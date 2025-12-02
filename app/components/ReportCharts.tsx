import type { CompanyData, CompanyNewsItem } from "@/types/report";

type PricePerformanceChartProps = {
  companyData: CompanyData;
};

type ValuationMetricsChartProps = {
  companyData: CompanyData;
};

type NewsTimelineWidgetProps = {
  companyData: CompanyData;
  maxItems?: number;
};

const formatNumber = (value?: number, digits = 2) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "N/A";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(digits);
};

const StatPill = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/70 px-3 py-1 text-xs text-subtle">
    <span className="uppercase tracking-[0.16em] text-[var(--accent-emerald)]">{label}</span>
    <span className="font-semibold text-[var(--color-foreground)]">{value}</span>
  </div>
);

export function PricePerformanceChart({ companyData }: PricePerformanceChartProps) {
  const { quote, metrics } = companyData;

  const current = quote.current ?? quote.prevClose ?? 0;
  const dayLow = quote.low ?? current;
  const dayHigh = quote.high ?? current;
  const weekLow = metrics["52WeekLow"] ?? dayLow;
  const weekHigh = metrics["52WeekHigh"] ?? dayHigh;

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
  const dayPosition = clamp(((current - dayLow) / Math.max(dayHigh - dayLow, 1)) * 100, 0, 100);
  const weekPosition = clamp(((current - weekLow) / Math.max(weekHigh - weekLow, 1)) * 100, 0, 100);

  return (
    <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/75 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Price & Volatility</p>
          <p className="text-lg font-semibold text-[var(--color-foreground)]">
            ${formatNumber(current, 2)}
            {quote.change !== undefined && (
              <span
                className={`ml-2 text-sm ${
                  quote.change >= 0 ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                {quote.change >= 0 ? "+" : ""}
                {formatNumber(quote.change, 2)} ({quote.changePercent?.toFixed(2) ?? "0"}%)
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatPill label="Open" value={quote.open ? `$${formatNumber(quote.open)}` : "N/A"} />
          <StatPill
            label="Prev"
            value={quote.prevClose ? `$${formatNumber(quote.prevClose)}` : "N/A"}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-subtle">
            <span>Day Range</span>
            <span>
              {dayLow ? `$${formatNumber(dayLow)}` : "N/A"} -{" "}
              {dayHigh ? `$${formatNumber(dayHigh)}` : "N/A"}
            </span>
          </div>
          <div className="relative h-3 rounded-full bg-[var(--bg-base)]/60">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400/70 to-cyan-300/70"
              style={{ width: `${Math.max(dayPosition, 8)}%` }}
            />
            <div
              className="absolute -top-1.5 h-6 w-1 rounded-full bg-white/80 shadow-[0_0_0_4px_rgba(255,255,255,0.08)]"
              style={{ left: `${dayPosition}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-subtle">
            <span>52W Range</span>
            <span>
              {weekLow ? `$${formatNumber(weekLow)}` : "N/A"} -{" "}
              {weekHigh ? `$${formatNumber(weekHigh)}` : "N/A"}
            </span>
          </div>
          <div className="relative h-3 rounded-full bg-[var(--bg-base)]/60">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-300/60 via-emerald-300/70 to-cyan-300/70"
              style={{ width: `${Math.max(weekPosition, 8)}%` }}
            />
            <div
              className="absolute -top-1.5 h-6 w-1 rounded-full bg-white/80 shadow-[0_0_0_4px_rgba(255,255,255,0.08)]"
              style={{ left: `${weekPosition}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ValuationMetricsChart({ companyData }: ValuationMetricsChartProps) {
  const { metrics } = companyData;

  const metricRows: Array<{ label: string; value?: number; helper?: string; max?: number }> = [
    { label: "P/E (TTM)", value: metrics.peTTM, helper: "x", max: 60 },
    { label: "P/S (TTM)", value: metrics.psTTM, helper: "x", max: 40 },
    { label: "P/B", value: metrics.pbAnnual, helper: "x", max: 20 },
    { label: "ROE", value: metrics.roeTTM, helper: "%", max: 40 },
    { label: "Revenue CAGR (3Y)", value: metrics.revenueGrowth3Y, helper: "%", max: 80 },
    { label: "EPS CAGR (3Y)", value: metrics.epsGrowth3Y, helper: "%", max: 80 },
    { label: "Div Yield", value: metrics.dividendYieldIndicatedAnnual, helper: "%", max: 10 },
  ];

  return (
    <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/75 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">
            Valuation & Quality
          </p>
          <p className="text-sm text-subtle">Key multiples and profitability</p>
        </div>
      </div>

      <div className="space-y-2">
        {metricRows.map((row) => {
          const valueText =
            row.value === undefined || row.value === null
              ? "N/A"
              : `${row.value.toFixed(2)}${row.helper ?? ""}`;
          const percent =
            row.value !== undefined && row.value !== null
              ? Math.min(Math.abs(row.value) / (row.max ?? 50), 1) * 100
              : 0;
          return (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-[var(--color-foreground)]">
                <span className="text-subtle">{row.label}</span>
                <span className="font-semibold">{valueText}</span>
              </div>
              <div className="relative h-2 rounded-full bg-[var(--bg-base)]/60 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-300/70 via-emerald-300/80 to-cyan-300/80"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NewsTimelineWidget({ companyData, maxItems = 4 }: NewsTimelineWidgetProps) {
  const news = (companyData.recentNews || [])
    .filter((item) => item.headline)
    .sort((a, b) => (b.datetime ?? 0) - (a.datetime ?? 0))
    .slice(0, maxItems);

  const formatDate = (item: CompanyNewsItem) => {
    if (!item.datetime) return "";
    return new Date(item.datetime * 1000).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  if (news.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/60 p-4 text-sm text-subtle">
        No recent news.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/75 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Recent News</p>
        <span className="text-xs text-subtle">Latest {news.length}</span>
      </div>
      <div className="space-y-3">
        {news.map((item) => (
          <a
            key={item.id ?? item.url ?? item.headline}
            href={item.url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="group block rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-3 transition hover:border-emerald-300/70 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-subtle">
                {item.source ?? "News"}
              </p>
              <span className="text-xs text-subtle">{formatDate(item)}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)] group-hover:text-emerald-200">
              {item.headline}
            </p>
            {item.summary ? (
              <p className="mt-1 text-xs text-subtle line-clamp-2">{item.summary}</p>
            ) : null}
          </a>
        ))}
      </div>
    </div>
  );
}
