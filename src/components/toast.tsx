"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Toast = { id: number; ok: boolean; text: string; details?: string[] };
const EVENT = "portal-toast";

export function toast(ok: boolean, text: string, details?: string[]) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { ok, text, details } }));
}

/** Shows the outcome of a server action. */
export function toastResult(r: { ok: boolean; message?: string; errors?: string[] }) {
  toast(r.ok, r.message ?? (r.ok ? "Done." : "Please fix the following:"), r.errors);
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const t = { id: Date.now() + Math.random(), ...(e as CustomEvent).detail } as Toast;
      setItems((s) => [...s.slice(-2), t]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), t.ok ? 4000 : 7000);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-toast gap-3 rounded-xl bg-night px-4 py-3 text-sm text-white shadow-pop">
          {t.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />}
          <div>
            <p>{t.text}</p>
            {t.details?.length ? (
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-white/70">
                {t.details.map((d) => <li key={d}>{d}</li>)}
              </ul>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
