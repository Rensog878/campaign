import { CheckCheck, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const bubbles = [
  { text: "Hi Priya 👋 Our weekend sale is live: 20% off everything until Sunday.", time: "10:00" },
  { text: "Your order #4821 has been packed and ships today.", time: "10:10" },
  { text: "Reminder: your appointment is tomorrow at 11 AM.", time: "10:20" },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col justify-between px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><MessageCircle className="size-5" /></span>
          <span className="font-semibold tracking-tight">Campaign Portal</span>
        </div>
        <div className="mx-auto w-full max-w-sm animate-rise py-12">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to schedule campaigns, edit templates and see every message you&apos;ve sent.</p>
          <div className="mt-8"><LoginForm /></div>
        </div>
        <p className="text-xs text-muted">Access is by invitation. Ask your administrator for an account.</p>
      </section>

      <section aria-hidden className="relative hidden overflow-hidden bg-night lg:block">
        <div className="absolute -left-24 top-1/3 size-[520px] rounded-full bg-brand/25 blur-[120px]" />
        <div className="absolute -right-10 -top-20 size-[360px] rounded-full bg-emerald-300/10 blur-[100px]" />
        <div className="relative flex h-full flex-col justify-center px-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">WhatsApp Business</p>
          <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
            Right message. Right customers. Right pace.
          </h2>
          <div className="chat-wall mt-10 max-w-md space-y-3 rounded-3xl p-5 shadow-2xl ring-1 ring-white/10">
            {bubbles.map((b, i) => (
              <div key={b.time} className="w-[85%] animate-rise rounded-xl rounded-tl-sm bg-bubble px-3 py-2 text-sm text-ink shadow-sm" style={{ animationDelay: `${200 + i * 350}ms` }}>
                {b.text}
                <span className="float-right ml-3 mt-1.5 flex items-center gap-0.5 text-[10px] text-muted">
                  {b.time} <CheckCheck className="size-3.5 text-sky-500" />
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-8 text-sm text-white/60">
            <span><b className="block text-2xl font-semibold text-white">Batches</b>paced to protect your number</span>
            <span><b className="block text-2xl font-semibold text-white">Live log</b>sent, delivered, read</span>
          </div>
        </div>
      </section>
    </main>
  );
}
