"use client";

type KpiCardProps = {
  label: string;
  value: string | number | null | undefined;
  icon?: string;
  tone?: "positive" | "negative" | "neutral" | "warning";
  trend?: "up" | "down" | "flat";
  helper?: string;
};

const toneColors = {
  positive: "border-[#5be0b0]/30 bg-[#5be0b0]/5",
  negative: "border-red-400/30 bg-red-400/5",
  warning: "border-yellow-400/30 bg-yellow-400/5",
  neutral: "border-[var(--stroke-soft)] bg-[var(--bg-layer)]",
};

const toneTextColors = {
  positive: "text-[#5be0b0]",
  negative: "text-red-400",
  warning: "text-yellow-400",
  neutral: "text-[var(--color-foreground)]",
};

const trendIcons = {
  up: "↗",
  down: "↘",
  flat: "→",
};

export default function KpiCard({
  label,
  value,
  icon,
  tone = "neutral",
  trend,
  helper,
}: KpiCardProps) {
  const displayValue = value ?? "N/A";
  const isNumeric = typeof value === "number";

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border p-5
        backdrop-blur-sm transition-all duration-300
        hover:border-[var(--accent-emerald)]/40 hover:shadow-lg
        ${toneColors[tone]}
      `}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--accent-emerald)]/20 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="relative z-10">
        {/* Header with icon and trend */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && <span className="text-2xl">{icon}</span>}
            <span className="text-xs uppercase tracking-wider text-[var(--text-subtle)] font-medium">
              {label}
            </span>
          </div>
          {trend && (
            <span className={`text-lg ${toneTextColors[tone]}`}>
              {trendIcons[trend]}
            </span>
          )}
        </div>

        {/* Value */}
        <div className={`text-3xl font-bold mb-1 ${toneTextColors[tone]}`}>
          {isNumeric && typeof value === "number"
            ? value.toLocaleString("en-US", {
                maximumFractionDigits: 2,
                minimumFractionDigits: 0,
              })
            : displayValue}
        </div>

        {/* Helper text */}
        {helper && (
          <p className="text-xs text-[var(--text-dim)] mt-2">{helper}</p>
        )}
      </div>
    </div>
  );
}
