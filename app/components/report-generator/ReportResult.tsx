"use client";

import { useMemo, useRef, memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReportResponse } from "@/types/report";
import type { ToneOption } from "./types";
import KpiCard from "@/app/components/KpiCard";
import {
  PricePerformanceChart,
  ValuationMetricsChart,
  NewsTimelineWidget,
} from "@/app/components/ReportCharts";
import { ExportButtons } from "./ExportButtons";

type ReportResultProps = {
  reportData: ReportResponse | null;
  lastToneInfo: ToneOption;
  highlightFallback: string[];
  exportingDocx: boolean;
  exportingPdf: boolean;
  onCopyRichText: () => Promise<void>;
  onExportDocx: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  t: (key: string, vars?: Record<string, string>) => string;
};

const markdownComponents: Components = {
  h1: ({ node, ...props }) => {
    void node;
    return (
      <h1
        className="text-3xl sm:text-4xl font-bold mt-8 mb-6 text-[var(--accent-emerald)] border-b-2 border-[var(--accent-emerald)]/30 pb-3"
        {...props}
      />
    );
  },
  h2: ({ node, ...props }) => {
    void node;
    return (
      <h2
        className="text-2xl font-semibold mt-8 mb-4 text-[var(--color-foreground)] border-l-4 border-[var(--accent-emerald)] pl-4"
        {...props}
      />
    );
  },
  h3: ({ node, ...props }) => {
    void node;
    return <h3 className="text-xl font-semibold mt-6 mb-3 text-[var(--text-dim)]" {...props} />;
  },
  p: ({ node, ...props }) => {
    void node;
    return (
      <p
        className="leading-relaxed text-[14px] sm:text-[16px] mb-4 text-[var(--text-subtle)]"
        {...props}
      />
    );
  },
  li: ({ node, ...props }) => {
    void node;
    return (
      <li className="leading-relaxed text-[14px] sm:text-[16px] mb-2 flex items-start gap-3">
        <span className="text-[var(--accent-emerald)] mt-1">•</span>
        <span {...props} />
      </li>
    );
  },
  strong: ({ node, ...props }) => {
    void node;
    return <strong className="font-semibold text-[var(--accent-emerald)]" {...props} />;
  },
  ul: ({ node, ...props }) => {
    void node;
    return <ul className="mb-4 space-y-1 list-none" {...props} />;
  },
  ol: ({ node, ...props }) => {
    void node;
    return <ol className="mb-4 space-y-2 list-decimal ml-6" {...props} />;
  },
  code: ({ node, ...props }) => {
    void node;
    return (
      <code
        className="px-2 py-1 rounded-md bg-[var(--bg-layer)]/80 border border-[var(--stroke-soft)] text-[13px] text-emerald-200 font-mono"
        {...props}
      />
    );
  },
  blockquote: ({ node, ...props }) => {
    void node;
    return (
      <blockquote
        className="border-l-4 border-[var(--accent-emerald)]/50 pl-4 pr-4 py-2 my-4 italic text-[var(--text-dim)] bg-[var(--bg-layer)]/50 rounded-r-lg"
        {...props}
      />
    );
  },
  table: ({ node, ...props }) => {
    void node;
    return (
      <div className="my-6 overflow-x-auto">
        <table
          className="min-w-full border-collapse border border-[var(--stroke-soft)] rounded-lg overflow-hidden"
          {...props}
        />
      </div>
    );
  },
  thead: ({ node, ...props }) => {
    void node;
    return <thead className="bg-[var(--accent-emerald)]/10" {...props} />;
  },
  tbody: ({ node, ...props }) => {
    void node;
    return <tbody className="divide-y divide-[var(--stroke-soft)]" {...props} />;
  },
  tr: ({ node, ...props }) => {
    void node;
    return <tr className="hover:bg-[var(--bg-layer)]/30 transition-colors" {...props} />;
  },
  th: ({ node, ...props }) => {
    void node;
    return (
      <th
        className="px-4 py-3 text-left text-sm font-semibold text-[var(--accent-emerald)] border border-[var(--stroke-soft)]"
        {...props}
      />
    );
  },
  td: ({ node, ...props }) => {
    void node;
    return (
      <td
        className="px-4 py-3 text-sm text-[var(--text-subtle)] border border-[var(--stroke-soft)]"
        {...props}
      />
    );
  },
};

export function ReportResult({
  reportData,
  lastToneInfo,
  highlightFallback,
  exportingDocx,
  exportingPdf,
  onCopyRichText,
  onExportDocx,
  onExportPdf,
  t,
}: ReportResultProps) {
  const reportContentRef = useRef<HTMLDivElement>(null);

  // Build company info items with translations and proper fallbacks
  const companyInfoItems = useMemo(() => {
    if (!reportData?.companyData?.profile) return [];

    const profile = reportData.companyData.profile;
    const items: Array<{ label: string; value: string }> = [];

    // Company name
    if (profile.name) {
      items.push({
        label: t("report.companyInfo.name"),
        value: profile.name,
      });
    }

    // Stock code with exchange
    const exchange = profile.exchange || "";
    const exchangeLabel = exchange ? ` (${exchange})` : "";
    items.push({
      label: t("report.companyInfo.ticker"),
      value: `${reportData.symbol}${exchangeLabel}`,
    });

    // Industry - prioritize over IPO date
    if (profile.finnhubIndustry) {
      items.push({
        label: t("report.companyInfo.industry"),
        value: profile.finnhubIndustry,
      });
    } else if (profile.ipo) {
      // Only show IPO date if industry is not available
      items.push({
        label: t("report.companyInfo.ipo"),
        value: profile.ipo,
      });
    }

    return items;
  }, [reportData, t]);

  const keyInsights = useMemo(() => {
    if (!reportData?.report) return highlightFallback.slice(0, 3);
    const lines = reportData.report
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const candidates = lines.filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line));
    const normalized = candidates
      .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
      .filter((line) => line.length > 0);
    if (normalized.length >= 3) return normalized.slice(0, 3);
    return [...normalized, ...highlightFallback].slice(0, 3);
  }, [reportData, highlightFallback]);

  if (!reportData) {
    return (
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 space-y-4 bg-[var(--bg-layer)]/85 border border-[var(--stroke-soft)] shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-[var(--accent-emerald)]/14 blur-[100px]"
            aria-hidden
          />
          <div
            className="absolute right-0 bottom-0 h-44 w-44 rounded-full bg-[var(--accent-blue)]/12 blur-[120px]"
            aria-hidden
          />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-3 text-sm uppercase tracking-[0.22em] text-subtle">
          <div className="relative inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3.5 py-1.5 text-sm text-[var(--accent-emerald)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
            <span className="rounded-full bg-[var(--accent-emerald)]/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              {t("generator.step.three")}
            </span>
            <span className="whitespace-nowrap">{t("report.tip.title")}</span>
            <div
              className="pointer-events-none absolute inset-0 rounded-full border border-[var(--stroke-soft)]/70"
              aria-hidden
            />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)]/70 bg-[var(--bg-layer)]/85 px-3.5 py-1.5 text-sm text-[var(--color-foreground)] whitespace-nowrap">
            <span
              className="h-2 w-2 rounded-full bg-[var(--accent-emerald)] animate-pulse"
              aria-hidden
            />
            {t("generator.progress.ready")}
          </span>
        </div>
        <div className="relative grid gap-3 md:grid-cols-[1.2fr] items-start overflow-hidden">
          <div className="space-y-3">
            <p className="text-base text-dim leading-relaxed">{t("report.tip.body")}</p>
            <p className="text-sm text-subtle">{t("report.tip.action")}</p>
          </div>
        </div>
      </div>
    );
  }

  const keyInsightsSubtitle = t("report.keyInsights.subtitle");

  return (
    <div className="space-y-4 rounded-3xl bg-[var(--bg-layer)]/70 p-4 sm:p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
      <p className="text-sm uppercase tracking-[0.28em] text-subtle">
        {t("report.meta", { symbol: reportData.symbol })}
      </p>

      <div className="space-y-3">
        <div className="text-base text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4">
          {t("report.disclaimerNotice")}
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/60 p-4 text-dim">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">
                {keyInsightsSubtitle}
              </p>
            </div>
            <div className="text-sm uppercase tracking-[0.26em] text-subtle">
              <span className="inline-flex items-center gap-1">
                <span>{lastToneInfo.emoji}</span>
                <span>{lastToneInfo.title}</span>
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            {/* Company basic info - prioritize industry over IPO */}
            {companyInfoItems.map((item, index) => (
              <div
                key={`info-${index}`}
                className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 px-3 py-2 text-base text-dim"
              >
                <span className="text-subtle">{item.label}：</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>

          <ExportButtons
            exportingDocx={exportingDocx}
            exportingPdf={exportingPdf}
            onCopyRichText={onCopyRichText}
            onExportDocx={onExportDocx}
            onExportPdf={onExportPdf}
            t={t}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold uppercase tracking-wider text-[var(--color-foreground)] mb-4">
          {t("report.section.keyMetrics")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label={t("report.kpi.marketCap")}
            value={
              reportData.companyData.profile.marketCapitalization
                ? `$${(reportData.companyData.profile.marketCapitalization / 1000).toFixed(1)}B`
                : "N/A"
            }
            icon="💰"
            tone="neutral"
          />
          <KpiCard
            label={t("report.kpi.peRatio")}
            value={reportData.companyData.metrics.peTTM?.toFixed(2) ?? "N/A"}
            icon="📊"
            tone={
              reportData.companyData.metrics.peTTM
                ? reportData.companyData.metrics.peTTM > 30
                  ? "warning"
                  : reportData.companyData.metrics.peTTM < 15
                    ? "positive"
                    : "neutral"
                : "neutral"
            }
            helper="TTM"
          />
          <KpiCard
            label={t("report.kpi.currentPrice")}
            value={
              reportData.companyData.quote.current
                ? `$${reportData.companyData.quote.current.toFixed(2)}`
                : "N/A"
            }
            icon="💹"
            tone={
              reportData.companyData.quote.change
                ? reportData.companyData.quote.change > 0
                  ? "positive"
                  : "negative"
                : "neutral"
            }
            trend={
              reportData.companyData.quote.change
                ? reportData.companyData.quote.change > 0
                  ? "up"
                  : reportData.companyData.quote.change < 0
                    ? "down"
                    : "flat"
                : undefined
            }
            helper={
              reportData.companyData.quote.changePercent
                ? `${reportData.companyData.quote.changePercent > 0 ? "+" : ""}${reportData.companyData.quote.changePercent.toFixed(2)}%`
                : undefined
            }
          />
          <KpiCard
            label={t("report.kpi.roe")}
            value={
              reportData.companyData.metrics.roeTTM
                ? `${reportData.companyData.metrics.roeTTM.toFixed(2)}%`
                : "N/A"
            }
            icon="📈"
            tone={
              reportData.companyData.metrics.roeTTM
                ? reportData.companyData.metrics.roeTTM > 15
                  ? "positive"
                  : reportData.companyData.metrics.roeTTM > 10
                    ? "neutral"
                    : "warning"
                : "neutral"
            }
            helper={t("report.kpi.roeHelper")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <PricePerformanceChart companyData={reportData.companyData} t={t} />
        <ValuationMetricsChart companyData={reportData.companyData} t={t} />
      </div>

      {reportData.companyData.recentNews && reportData.companyData.recentNews.length > 0 && (
        <div className="mt-6">
          <NewsTimelineWidget companyData={reportData.companyData} t={t} />
        </div>
      )}

      <div
        ref={reportContentRef}
        className="report-markdown-content text-base sm:text-lg leading-relaxed text-dim mt-8"
      >
        <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
          {reportData.report}
        </ReactMarkdown>
      </div>

      <details className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/50 p-3">
        <summary className="text-sm text-subtle cursor-pointer select-none">
          {t("report.debug")}
        </summary>
        <pre className="mt-2 text-xs text-subtle max-h-64 overflow-auto bg-[var(--bg-layer)] rounded-xl p-3 border border-[var(--stroke-soft)]/60">
          {JSON.stringify(reportData.companyData, null, 2)}
        </pre>
      </details>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when props haven't changed
export default memo(ReportResult);
