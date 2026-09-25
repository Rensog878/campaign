"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toastResult } from "@/components/toast";
import { Button, Label } from "@/components/ui";
import { changePassword } from "../actions/account";

export function PasswordForm() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await changePassword(cur, next);
          toastResult(r);
          if (r.ok) { setCur(""); setNext(""); }
        });
      }}
    >
      <div><Label htmlFor="cur">Current password</Label><input id="cur" type="password" autoComplete="current-password" className="field" value={cur} onChange={(e) => setCur(e.target.value)} required /></div>
      <div><Label htmlFor="new" hint="8+ characters">New password</Label><input id="new" type="password" autoComplete="new-password" minLength={8} className="field" value={next} onChange={(e) => setNext(e.target.value)} required /></div>
      <Button disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : "Change password"}</Button>
    </form>
  );
}
