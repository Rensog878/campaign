"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { Button, Label } from "@/components/ui";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <input id="email" name="email" type="email" autoComplete="email" required autoFocus defaultValue={state?.email} className="field h-11" placeholder="you@company.com" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field h-11" placeholder="••••••••" />
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <>Sign in <ArrowRight className="size-4" /></>}
      </Button>
    </form>
  );
}
