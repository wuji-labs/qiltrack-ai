"use client";

type LoadingStateProps = {
  loading: boolean;
  progressStageLabel: string;
  selectedToneTitle: string;
  t: (key: string, vars?: Record<string, string>) => string;
};

export function LoadingState({
  loading,
  progressStageLabel,
  selectedToneTitle,
  t,
}: LoadingStateProps) {
  if (!loading) return null;

  const loadingSubtitle = t("generator.searching.wait");

  return (
    <div className="space-y-3">
      <p className="text-sm text-subtle uppercase tracking-[0.26em]">{loadingSubtitle}</p>
      <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm text-subtle">
          <span>{progressStageLabel}</span>
          <span className="text-[var(--accent-blue)]">{selectedToneTitle}</span>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-[var(--bg-base)]/50 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-[var(--bg-base)]/50 animate-pulse" />
          <div className="h-3 w-4/6 rounded bg-[var(--bg-base)]/50 animate-pulse" />
          <div className="h-3 w-3/5 rounded bg-[var(--bg-base)]/50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
