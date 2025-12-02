"use client";

import type { ReactNode } from "react";

type KpiTone = "positive" | "neutral" | "warning" | "negative";
type TrendDirection = "up" | "down" | "flat";

type KpiCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: KpiTone;
  helper?: string;
  trend?: TrendDirection;
};

const toneClassNames: Record<KpiTone, { container: string; accent: string; badge: string }> = {
  positive: {
    container: "border-emerald-300/60 bg-emerald-500/10 shadow-[0_18px_40px_rgba(16,185,129,0.14)]",
    accent: "text-emerald-100",
    badge: "bg-emerald-400/15 text-emerald-100 border-emerald-300/40",
  },
  neutral: {
    container: "border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80",
    accent: "text-[var(--color-foreground)]",
    badge: "bg-[var(--bg-layer)] text-subtle border-[var(--stroke-soft)]",
  },
  warning: {
    container: "border-amber-300/60 bg-amber-500/10 shadow-[0_18px_40px_rgba(251,191,36,0.12)]",
    accent: "text-amber-100",
    badge: "bg-amber-400/15 text-amber-50 border-amber-300/40",
  },
  negative: {
    container: "border-rose-400/60 bg-rose-500/10 shadow-[0_18px_40px_rgba(244,63,94,0.12)]",
    accent: "text-rose-100",
    badge: "bg-rose-400/15 text-rose-50 border-rose-300/40",
  },
};

const trendMeta: Record<TrendDirection, { label: string; icon: string; className: string }> = {
  up: { label: "Up", icon: "▲", className: "text-emerald-200" },
  down: { label: "Down", icon: "▼", className: "text-rose-200" },
  flat: { label: "Flat", icon: "■", className: "text-subtle" },
};

export default function KpiCard({
  label,
  value,
  icon,
  tone = "neutral",
  helper,
  trend,
}: KpiCardProps) {
  const toneClasses = toneClassNames[tone];
  const trendInfo = trend ? trendMeta[trend] : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border px-4 py-3 sm:py-4 transition-all duration-200 ease-out ${toneClasses.container}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-6 top-0 h-20 w-20 rounded-full bg-[var(--accent-emerald)]/12 blur-[80px]"
          aria-hidden
        />
        <div
          className="absolute right-0 bottom-0 h-20 w-20 rounded-full bg-[var(--accent-blue)]/10 blur-[70px]"
          aria-hidden
        />
      </div>
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-lg">{icon}</span> : null}
          <span className="text-xs uppercase tracking-[0.22em] text-subtle">{label}</span>
        </div>
        {helper ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${toneClasses.badge}`}
          >
            {helper}
          </span>
        ) : null}
      </div>
      <div className="relative mt-3 flex items-baseline justify-between gap-2">
        <div className={`text-2xl font-semibold ${toneClasses.accent}`}>{value}</div>
        {trendInfo ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full border border-[var(--stroke-soft)]/60 bg-[var(--bg-layer)]/70 px-2 py-1 text-xs font-semibold ${trendInfo.className}`}
          >
            <span aria-hidden>{trendInfo.icon}</span>
            {trendInfo.label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
