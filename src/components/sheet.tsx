"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

/** Slides up from the bottom on phones; a centred dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // stop the page scrolling behind the sheet
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 animate-fade bg-night/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "pb-safe relative max-h-[92dvh] w-full animate-sheet overflow-y-auto rounded-t-3xl bg-panel shadow-pop sm:max-w-md sm:animate-rise sm:rounded-2xl sm:pb-0",
          className,
        )}
      >
        <div className="sticky top-0 z-10 bg-panel/95 px-5 pb-3 pt-2 backdrop-blur sm:pt-5">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="-mr-2 grid size-10 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink">
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="px-5 pb-6 pt-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
