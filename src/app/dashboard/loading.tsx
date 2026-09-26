// Shown instantly while a dashboard page loads, so taps feel responsive on slow networks.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="h-8 w-44 rounded-lg bg-line/70" />
      <div className="mt-2 h-4 w-72 max-w-full rounded bg-line/50" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-line bg-panel" />
        ))}
      </div>
      <div className="mt-6 space-y-px overflow-hidden rounded-2xl border border-line bg-panel">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-4 last:border-0">
            <div className="size-10 rounded-full bg-line/60" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 rounded bg-line/70" />
              <div className="h-3 w-2/3 rounded bg-line/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
