"use client";

import { CheckCircle2, Cloud, Loader2, LogOut, QrCode, RefreshCw, Smartphone, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toastResult } from "@/components/toast";
import { Badge, Button, Card, CardHeader, Label } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  connectSession,
  disconnectSession,
  getSessionState,
  saveWahaSettings,
  setProvider,
  type SessionState,
} from "../actions/provider";

type Provider = "META" | "LOCAL";

const OPTIONS = [
  {
    value: "META" as const,
    icon: Cloud,
    title: "Meta Cloud API",
    points: ["Official and safest for promotions", "Templates need Meta approval", "Meta charges per message"],
  },
  {
    value: "LOCAL" as const,
    icon: Smartphone,
    title: "Local session (WAHA)",
    points: ["Link a phone by scanning a QR code", "No template approval, no Meta fees", "Unofficial: the number can be banned"],
  },
];

export function ProviderSwitch({ provider, metaLive, localReady }: { provider: Provider; metaLive: boolean; localReady: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Card>
      <CardHeader title="Sending provider" description="Choose how campaigns and test messages are sent. You can switch at any time; the next batch uses the new provider." />
      <div className="grid gap-3 p-5 md:grid-cols-2">
        {OPTIONS.map((o) => {
          const active = provider === o.value;
          const configured = o.value === "META" ? metaLive : localReady;
          return (
            <button
              key={o.value}
              type="button"
              disabled={pending || active}
              onClick={() => {
                const warn =
                  o.value === "LOCAL"
                    ? "Switch to the local session? Sending promotions from a QR-linked number breaks WhatsApp's terms and can get the number banned. Keep batches small and slow."
                    : "Switch to Meta Cloud API? Only Meta-approved templates will be sent.";
                if (!window.confirm(warn)) return;
                start(async () => {
                  toastResult(await setProvider(o.value));
                  router.refresh();
                });
              }}
              className={cn(
                "relative rounded-xl border p-4 text-left transition disabled:cursor-default",
                active ? "border-brand bg-brand-soft/50 ring-4 ring-brand/10" : "border-line hover:border-ink/25",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2.5 font-medium">
                  <span className={cn("grid size-8 place-items-center rounded-lg", active ? "bg-brand text-white" : "bg-canvas text-ink-2")}>
                    <o.icon className="size-4" />
                  </span>
                  {o.title}
                </span>
                {active ? <Badge tone="green" dot>Active</Badge> : pending ? <Loader2 className="size-4 animate-spin text-muted" /> : <span className="text-xs text-muted">Switch</span>}
              </div>
              <ul className="mt-3 space-y-1 text-xs text-ink-2">
                {o.points.map((p) => <li key={p}>• {p}</li>)}
              </ul>
              {!configured && <p className="mt-3 text-xs text-amber-700">Not set up yet, so sends are simulated (demo mode).</p>}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

const STATUS_TEXT: Record<SessionState["status"], { tone: "green" | "amber" | "red" | "gray" | "blue"; label: string }> = {
  WORKING: { tone: "green", label: "Connected" },
  SCAN_QR_CODE: { tone: "amber", label: "Waiting for QR scan" },
  STARTING: { tone: "blue", label: "Starting…" },
  STOPPED: { tone: "gray", label: "Stopped" },
  FAILED: { tone: "red", label: "Failed" },
  MISSING: { tone: "gray", label: "Not started" },
  UNREACHABLE: { tone: "red", label: "Can't connect" },
  NOT_CONFIGURED: { tone: "gray", label: "Not set up" },
};

export function LocalSessionPanel({ url, hasKey, session, active }: { url: string; hasKey: boolean; session: string; active: boolean }) {
  const [form, setForm] = useState({ url, apiKey: "", session });
  const [state, setState] = useState<SessionState | null>(null);
  const [saving, startSave] = useTransition();
  const [busy, startBusy] = useTransition();
  const router = useRouter();

  const refresh = useCallback(async () => setState(await getSessionState()), []);

  useEffect(() => {
    let alive = true;
    getSessionState().then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, []);

  // Poll while the phone is being linked.
  const linking = state?.status === "STARTING" || state?.status === "SCAN_QR_CODE";
  useEffect(() => {
    if (!linking) return;
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [linking, refresh]);

  const s = state ? STATUS_TEXT[state.status] : null;

  return (
    <Card>
      <CardHeader
        title="Local session (WAHA)"
        description="A WAHA server on your VPS keeps a WhatsApp number linked, like WhatsApp Web."
        action={active ? <Badge tone="green" dot>Active</Badge> : undefined}
      />
      <form
        className="grid gap-4 border-b border-line p-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          startSave(async () => {
            const r = await saveWahaSettings(form);
            toastResult(r);
            if (r.ok) {
              setForm((f) => ({ ...f, apiKey: "" }));
              router.refresh();
              refresh();
            }
          });
        }}
      >
        <div className="sm:col-span-2">
          <Label htmlFor="wurl">WAHA server URL</Label>
          <input id="wurl" className="field" placeholder="https://waha.yourdomain.com" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="wkey" hint={hasKey ? "saved · leave blank to keep" : undefined}>API key</Label>
          <input id="wkey" type="password" autoComplete="off" className="field" placeholder={hasKey ? "••••••••" : "WAHA_API_KEY"} value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="wses" hint="free WAHA: default">Session name</Label>
          <input id="wses" className="field font-mono" value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Button variant="secondary" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "Save WAHA details"}</Button>
        </div>
      </form>

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Phone</span>
            {s ? <Badge tone={s.tone} dot>{s.label}</Badge> : <Loader2 className="size-4 animate-spin text-muted" />}
            {state?.status === "WORKING" && state.phone && (
              <span className="text-sm text-ink-2">+{state.phone}{state.name ? ` · ${state.name}` : ""}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={refresh} title="Refresh status"><RefreshCw className="size-3.5" /></Button>
            {state && !["WORKING", "NOT_CONFIGURED", "SCAN_QR_CODE", "STARTING"].includes(state.status) && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => startBusy(async () => {
                  toastResult(await connectSession());
                  await refresh();
                })}
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <><QrCode className="size-3.5" /> Link phone</>}
              </Button>
            )}
            {state?.status === "WORKING" && (
              <Button
                size="sm"
                variant="danger"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm("Unlink this phone? Campaigns using the local session will pause until a phone is linked again.")) return;
                  startBusy(async () => {
                    toastResult(await disconnectSession("logout"));
                    await refresh();
                  });
                }}
              >
                <LogOut className="size-3.5" /> Unlink phone
              </Button>
            )}
          </div>
        </div>

        {state?.status === "SCAN_QR_CODE" && (
          <div className="mt-5 flex flex-col items-center gap-5 rounded-xl bg-canvas p-5 sm:flex-row sm:items-start">
            <div className="grid size-56 shrink-0 place-items-center rounded-xl bg-white p-3 shadow-card">
              {state.qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.qr} alt="WhatsApp QR code" className="size-full" />
              ) : (
                <Loader2 className="size-6 animate-spin text-muted" />
              )}
            </div>
            <ol className="list-decimal space-y-2 pl-4 text-sm text-ink-2">
              <li>Open <b>WhatsApp</b> on the business phone.</li>
              <li>Tap <b>⋮ / Settings → Linked devices → Link a device</b>.</li>
              <li>Point the camera at this code. It refreshes by itself.</li>
            </ol>
          </div>
        )}
        {state?.status === "WORKING" && (
          <p className="mt-3 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="size-3.5" /> Ready. Delivery and read receipts arrive automatically.</p>
        )}
        {state?.error && (
          <p className="mt-3 flex items-center gap-2 text-xs text-rose-700"><TriangleAlert className="size-3.5" /> {state.error}</p>
        )}
        {state?.status === "NOT_CONFIGURED" && <p className="mt-3 text-xs text-muted">Save the WAHA server details above to link a phone.</p>}
      </div>
    </Card>
  );
}
