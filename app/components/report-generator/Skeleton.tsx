export function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-[var(--bg-layer)] rounded-lg" />
        <div className="h-8 w-32 bg-[var(--bg-layer)] rounded-lg" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/50"
          >
            <div className="h-4 w-24 bg-[var(--bg-base)] rounded mb-3" />
            <div className="h-8 w-32 bg-[var(--bg-base)] rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="p-6 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/50">
        <div className="h-6 w-40 bg-[var(--bg-base)] rounded mb-4" />
        <div className="h-64 bg-[var(--bg-base)] rounded" />
      </div>

      {/* Content sections skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/50"
          >
            <div className="h-6 w-48 bg-[var(--bg-base)] rounded mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-[var(--bg-base)] rounded" />
              <div className="h-4 w-5/6 bg-[var(--bg-base)] rounded" />
              <div className="h-4 w-4/6 bg-[var(--bg-base)] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="relative overflow-hidden space-y-5 rounded-[28px] border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-4 sm:p-6 shadow-[0_20px_70px_rgba(0,0,0,0.34)] animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-[var(--bg-base)] rounded-full" />
        <div className="h-8 w-32 bg-[var(--bg-base)] rounded-full" />
      </div>
      <div className="h-20 bg-[var(--bg-base)] rounded-[24px]" />
      <div className="flex justify-center">
        <div className="h-14 w-48 bg-[var(--bg-base)] rounded-full" />
      </div>
    </div>
  );
}
