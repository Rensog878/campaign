"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { toastResult } from "./toast";
import { Button } from "./ui";

type Result = { ok: boolean; message?: string; errors?: string[] };

/** Runs a bound server action, with optional confirmation, then shows the result. */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "secondary",
  size = "sm",
  title,
  className,
}: {
  action: () => Promise<Result>;
  children: ReactNode;
  confirm?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  title?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      title={title}
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          toastResult(await action());
          router.refresh();
        });
      }}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : children}
    </Button>
  );
}
