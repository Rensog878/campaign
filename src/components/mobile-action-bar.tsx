import type { ReactNode } from "react";

/** Primary actions pinned above the phone tab bar. A spacer keeps page content clear of it. */
export function MobileActionBar({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="h-16 lg:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg gap-2">{children}</div>
      </div>
    </>
  );
}
