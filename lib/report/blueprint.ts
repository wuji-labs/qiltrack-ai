import type { CompanyData, CompanyMetrics, ReportResponse, ReportTone } from "@/types/report";

type BlueprintMetric = {
  label: string;
  value: string;
  helper?: string;
  tone?: "positive" | "negative" | "neutral";
};

export type BlueprintSection = {
  id: string;
  title: string;
  body: string;
};

export type ReportBlueprint = {
  symbol: string;
  companyName: string;
  exchange?: string;
  industry?: string;
  currency?: string;
  marketCap?: string;
  tone: ReportTone;
  generatedAt: string;
  keyInsights: string[];
  profile: BlueprintMetric[];
  valuation: BlueprintMetric[];
  quality: BlueprintMetric[];
  liquidity: BlueprintMetric[];
  growth: BlueprintMetric[];
  newsHighlights: Array<{
    headline: string;
    source?: string;
    datetime?: number;
    url?: string;
  }>;
  sections: BlueprintSection[];
  disclaimer: string;
};

const DEFAULT_KEY_INSIGHTS = [
  "Solid cash position",
  "Improving margins",
  "Monitor competitive risks",
];

const formatNumber = (value?: number | null, digits: number = 0) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "N/A";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
};

const formatPercent = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(1)}%`;
};

const formatCurrency = (value?: number | null, currency: string = "USD") => {
  if (value === undefined || value === null || Number.isNaN(value)) return "N/A";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 10 ? 0 : 2,
  });
  return formatter.format(value);
};

const toBillions = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "N/A";
  const billions = value / 1_000;
  return `${billions.toFixed(1)}B`;
};

const extractKeyInsights = (report: string | undefined, fallback: string[]) => {
  if (!report) return fallback;
  const lines = report
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const candidates = lines.filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line));
  const normalized = candidates
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
    .filter((line) => line.length > 0);
  if (normalized.length >= 3) return normalized.slice(0, 3);
  return [...normalized, ...fallback].slice(0, 3);
};

const extractSections = (report: string | undefined): BlueprintSection[] => {
  if (!report) return [];
  const lines = report.split("\n");
  const sections: BlueprintSection[] = [];
  let current: BlueprintSection | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = {
        id: line
          .replace(/^##\s+/, "")
          .toLowerCase()
          .replace(/\s+/g, "-"),
        title: line.replace(/^##\s+/, ""),
        body: "",
      };
      continue;
    }
    if (!current) continue;
    current.body = current.body ? `${current.body}\n${line}` : line;
  }

  if (current) sections.push(current);
  return sections;
};

const buildProfileMetrics = (company: CompanyData): BlueprintMetric[] => {
  const profile = company.profile || {};
  const quote = company.quote || {};
  return [
    {
      label: "Exchange",
      value: profile.exchange || "N/A",
    },
    {
      label: "Sector",
      value: profile.finnhubIndustry || "N/A",
    },
    {
      label: "Country",
      value: profile.country || "N/A",
    },
    {
      label: "Currency",
      value: profile.currency || "N/A",
    },
    {
      label: "Market Cap",
      value: profile.marketCapitalization ? toBillions(profile.marketCapitalization) : "N/A",
      helper: profile.currency,
    },
    {
      label: "Last Price",
      value: formatCurrency(quote.current, profile.currency || "USD"),
      helper: formatPercent(quote.changePercent),
      tone:
        quote.changePercent && quote.changePercent > 0
          ? "positive"
          : quote.changePercent && quote.changePercent < 0
            ? "negative"
            : "neutral",
    },
  ];
};

const buildValuation = (
  metrics: CompanyMetrics = {},
  currency: string = "USD"
): BlueprintMetric[] => {
  const m = metrics;
  return [
    { label: "P/E (TTM)", value: formatNumber(m.peTTM, 1) },
    { label: "P/B", value: formatNumber(m.pbAnnual, 1) },
    { label: "P/S (TTM)", value: formatNumber(m.psTTM, 1) },
    { label: "52W High", value: formatCurrency(m["52WeekHigh"], currency) },
    { label: "52W Low", value: formatCurrency(m["52WeekLow"], currency) },
  ];
};

const buildQuality = (metrics: CompanyMetrics = {}): BlueprintMetric[] => {
  const m = metrics;
  return [
    { label: "ROE (TTM)", value: formatPercent(m.roeTTM) },
    { label: "ROA", value: formatPercent(m.roaRfy) },
    { label: "EPS 3Y CAGR", value: formatPercent(m.epsGrowth3Y) },
    { label: "EPS 5Y CAGR", value: formatPercent(m.epsGrowth5Y) },
  ];
};

const buildLiquidity = (metrics: CompanyMetrics = {}): BlueprintMetric[] => {
  const m = metrics;
  return [
    { label: "Current Ratio", value: formatNumber(m.currentRatioQuarterly, 2) },
    { label: "Quick Ratio", value: formatNumber(m.quickRatioAnnual, 2) },
    { label: "Dividend Yield", value: formatPercent(m.dividendYieldIndicatedAnnual) },
  ];
};

const buildGrowth = (metrics: CompanyMetrics = {}): BlueprintMetric[] => {
  const m = metrics;
  return [
    { label: "Revenue 3Y CAGR", value: formatPercent(m.revenueGrowth3Y) },
    { label: "Revenue 5Y CAGR", value: formatPercent(m.revenueGrowth5Y) },
  ];
};

export function createReportBlueprint(
  data: ReportResponse,
  tone: ReportTone = "baseline"
): ReportBlueprint {
  const { companyData, report, symbol } = data;
  const metrics = companyData.metrics || {};
  const currency = companyData.profile.currency || "USD";

  const keyInsights = extractKeyInsights(report, DEFAULT_KEY_INSIGHTS);
  const sections = extractSections(report);
  const profile = buildProfileMetrics(companyData);
  const valuation = buildValuation(metrics, currency);
  const quality = buildQuality(metrics);
  const liquidity = buildLiquidity(metrics);
  const growth = buildGrowth(metrics);

  const newsHighlights = (companyData.recentNews || []).slice(0, 6).map((item) => ({
    headline: item.headline || "News",
    source: item.source,
    datetime: item.datetime,
    url: item.url,
  }));

  return {
    symbol,
    companyName: companyData.profile.name || symbol,
    exchange: companyData.profile.exchange,
    industry: companyData.profile.finnhubIndustry,
    currency,
    marketCap: companyData.profile.marketCapitalization
      ? toBillions(companyData.profile.marketCapitalization)
      : undefined,
    tone,
    generatedAt: new Date().toISOString(),
    keyInsights,
    profile,
    valuation,
    quality,
    liquidity,
    growth,
    newsHighlights,
    sections,
    disclaimer:
      "Generated by Qiltrack AI from multi-source market data and public disclosures. For informational purposes only.",
  };
}
