import { describe, expect, it } from "vitest";

import { buildPerformanceChart, buildValuationChart } from "@/lib/report/charts";
import type { CompanyData } from "@/types/report";

const company: CompanyData = {
  symbol: "AAPL",
  profile: {
    name: "Apple",
    ticker: "AAPL",
    exchange: "NASDAQ",
    finnhubIndustry: "Technology",
    country: "US",
    currency: "USD",
    ipo: "1980-12-12",
    marketCapitalization: 3100000,
    weburl: "https://apple.com",
  },
  quote: {
    current: 175.5,
    change: 1.2,
    changePercent: 0.8,
    high: 178,
    low: 173,
    open: 174,
    prevClose: 174.3,
    timestamp: 1_700_000_000,
  },
  metrics: {
    peTTM: 28.3,
    psTTM: 7.5,
    pbAnnual: 45.1,
    revenueGrowth3Y: 0.12,
    revenueGrowth5Y: 0.15,
    epsGrowth3Y: 0.1,
    epsGrowth5Y: 0.18,
    currentRatioQuarterly: 0.95,
    quickRatioAnnual: 0.83,
    roeTTM: 32.4,
    roaRfy: 18.1,
    dividendYieldIndicatedAnnual: 0.6,
    "52WeekHigh": 190.0,
    "52WeekLow": 138.0,
  },
  recentNews: [],
};

describe("report charts", () => {
  it("builds performance chart with data points", () => {
    const chart = buildPerformanceChart(company);
    expect(chart.hasData).toBe(true);
    expect(chart.labels).toHaveLength(5);
    expect(chart.datasets[0]?.data.filter((v) => v !== null).length).toBeGreaterThan(0);
  });

  it("builds valuation chart with multiples and returns", () => {
    const chart = buildValuationChart(company);
    expect(chart.hasData).toBe(true);
    expect(chart.labels).toContain("P/E");
    expect(chart.datasets[0]?.data[0]).toBeCloseTo(28.3);
  });

  it("gracefully handles missing metrics", () => {
    const emptyCompany: CompanyData = {
      symbol: "TSLA",
      profile: { name: "Tesla", ticker: "TSLA", exchange: "", finnhubIndustry: "", country: "", currency: "USD", ipo: "", marketCapitalization: undefined, weburl: "" },
      quote: {},
      metrics: {},
      recentNews: [],
    };

    const perf = buildPerformanceChart(emptyCompany);
    const val = buildValuationChart(emptyCompany);

    expect(perf.hasData).toBe(false);
    expect(val.hasData).toBe(false);
    expect(perf.datasets[0]?.data.every((v) => v === null)).toBe(true);
  });
});
