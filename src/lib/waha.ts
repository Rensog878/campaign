import "server-only";

// Client for a self-hosted WAHA gateway (https://waha.devlike.pro), which links a
// WhatsApp number through a QR-scanned session, like WhatsApp Web.

export type WahaConfig = { url: string; apiKey: string; session: string };

export type WahaStatus = "STOPPED" | "STARTING" | "SCAN_QR_CODE" | "WORKING" | "FAILED" | "MISSING" | "UNREACHABLE";

export class WahaError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function call<T>(cfg: WahaConfig, path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${cfg.url.replace(/\/+$/, "")}${path}`, {
      ...init,
      headers: { "X-Api-Key": cfg.apiKey, "Content-Type": "application/json", Accept: "application/json", ...init.headers },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new WahaError("Can't reach the WAHA server. Check the URL and that the server is running.");
  }
  const text = await res.text();
  const json = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : {};
  if (!res.ok) {
    if (res.status === 401) throw new WahaError("WAHA rejected the API key.", 401);
    const msg = typeof json === "object" ? json.message ?? json.error : json;
    throw new WahaError(Array.isArray(msg) ? msg.join(", ") : msg || `WAHA error (${res.status})`, res.status);
  }
  return json as T;
}

type SessionInfo = { name: string; status: WahaStatus; me?: { id: string; pushName?: string } | null };

export async function getSession(cfg: WahaConfig): Promise<{ status: WahaStatus; phone?: string; name?: string; error?: string }> {
  try {
    const s = await call<SessionInfo>(cfg, `/api/sessions/${encodeURIComponent(cfg.session)}`);
    return { status: s.status, phone: s.me?.id?.split("@")[0], name: s.me?.pushName };
  } catch (e) {
    if (e instanceof WahaError && e.status === 404) return { status: "MISSING" };
    return { status: "UNREACHABLE", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Creates the session (or updates its webhook) and starts it. */
export async function startSession(cfg: WahaConfig, webhookUrl: string) {
  const config = {
    webhooks: [{ url: webhookUrl, events: ["message", "message.ack", "session.status"] }],
  };
  const current = await getSession(cfg);
  if (current.status === "UNREACHABLE") throw new WahaError(current.error ?? "WAHA is unreachable.");
  if (current.status === "MISSING") {
    await call(cfg, "/api/sessions", { method: "POST", body: JSON.stringify({ name: cfg.session, start: true, config }) });
    return;
  }
  await call(cfg, `/api/sessions/${encodeURIComponent(cfg.session)}`, { method: "PUT", body: JSON.stringify({ config }) });
  if (current.status === "STOPPED" || current.status === "FAILED") {
    await call(cfg, `/api/sessions/${encodeURIComponent(cfg.session)}/start`, { method: "POST" });
  }
}

export async function stopSession(cfg: WahaConfig) {
  await call(cfg, `/api/sessions/${encodeURIComponent(cfg.session)}/stop`, { method: "POST" });
}

export async function logoutSession(cfg: WahaConfig) {
  await call(cfg, `/api/sessions/${encodeURIComponent(cfg.session)}/logout`, { method: "POST" });
}

/** QR code as a data: URL, or null when the session isn't waiting for a scan. */
export async function getQr(cfg: WahaConfig) {
  const r = await call<{ mimetype: string; data: string }>(cfg, `/api/${encodeURIComponent(cfg.session)}/auth/qr?format=image`);
  return r?.data ? `data:${r.mimetype || "image/png"};base64,${r.data}` : null;
}

type SentMessage = {
  id?: string | { _serialized?: string };
  key?: { id: string; remoteJid: string; fromMe: boolean };
};

function messageId(r: SentMessage, chatId: string) {
  if (typeof r.id === "string") return r.id;
  if (r.id?._serialized) return r.id._serialized;
  if (r.key?.id) return `${r.key.fromMe ? "true" : "false"}_${r.key.remoteJid || chatId}_${r.key.id}`;
  return `waha.${crypto.randomUUID()}`;
}

export async function sendText(cfg: WahaConfig, phone: string, text: string) {
  const chatId = `${phone}@c.us`;
  const r = await call<SentMessage>(cfg, "/api/sendText", {
    method: "POST",
    body: JSON.stringify({ session: cfg.session, chatId, text, linkPreview: false }),
  });
  return messageId(r, chatId);
}

export async function sendImage(cfg: WahaConfig, phone: string, url: string, caption: string) {
  const chatId = `${phone}@c.us`;
  const r = await call<SentMessage>(cfg, "/api/sendImage", {
    method: "POST",
    body: JSON.stringify({ session: cfg.session, chatId, file: { url }, caption }),
  });
  return messageId(r, chatId);
}

/** WAHA ack codes → our message status. */
export function mapAck(ack: number) {
  if (ack < 0) return "FAILED" as const;
  if (ack >= 3) return "READ" as const;
  if (ack === 2) return "DELIVERED" as const;
  if (ack === 1) return "SENT" as const;
  return null;
}
