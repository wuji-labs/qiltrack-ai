"use client";

import { type SimilarReport } from "@/types/report";

type SimilarReportsProps = {
  similarReports: SimilarReport[];
  loadingSimilar: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
};

export function SimilarReports({ similarReports, loadingSimilar, t }: SimilarReportsProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.26em] text-subtle">Similar reports</p>
        {loadingSimilar && (
          <span className="inline-flex items-center gap-2 text-xs text-subtle">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
            Loading
          </span>
        )}
      </div>
      {!loadingSimilar && similarReports.length === 0 && (
        <p className="text-sm text-subtle">No similar reports yet.</p>
      )}
      {(loadingSimilar || similarReports.length > 0) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {loadingSimilar &&
            [0, 1, 2].map((skeleton) => (
              <div
                key={`similar-skeleton-${skeleton}`}
                className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 p-3 space-y-2"
              >
                <div className="h-4 w-1/3 rounded bg-[var(--bg-base)]/70 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-[var(--bg-base)]/60 animate-pulse" />
              </div>
            ))}
          {!loadingSimilar &&
            similarReports.map((item) => (
              <div
                key={item.report_run_id}
                className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-semibold text-[var(--color-foreground)]">
                    {item.symbol}
                  </p>
                  <span className="text-xs text-subtle">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-subtle">
                  Similarity {(item.similarity * 100).toFixed(1)}%
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
