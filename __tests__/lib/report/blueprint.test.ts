import { describe, expect, it } from "vitest";

import { createReportBlueprint } from "@/lib/report/blueprint";
import type { ReportResponse } from "@/types/report";

const sampleResponse: ReportResponse = {
  symbol: "AAPL",
  report: `# Investor AI 銆愭椿鍗＄墝銆戠ぞ浼氱鐞嗛閫夎瘎浼?

## 椤圭洰缁撴瀯
- Key 1 alpha
- Key 2 beta
- Key 3 gamma

## 鏂伴椈 路 鏀跨瓥 路 榛戝ぉ楣呴浄杈?
鏈柊璁″垝鍦ㄤ富棰樻竻鍗＄被鍦扮敤閫?
`,
  companyData: {
    symbol: "AAPL",
    profile: {
      name: "Apple Inc.",
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
    recentNews: [
      {
        id: 1,
        headline: "Apple releases new devices",
        source: "TechWire",
        datetime: 1_700_000_000,
        url: "https://example.com",
      },
    ],
  },
  remainingQuota: 9,
};

describe("createReportBlueprint", () => {
  it("extracts key insights and sections from markdown", () => {
    const blueprint = createReportBlueprint(sampleResponse, "buffett");

    expect(blueprint.keyInsights).toEqual(["Key 1 alpha", "Key 2 beta", "Key 3 gamma"]);
    expect(blueprint.sections.length).toBeGreaterThan(0);
    expect(blueprint.sections[0]?.title).toBe("椤圭洰缁撴瀯");
    expect(blueprint.tone).toBe("buffett");
  });

  it("formats metrics with fallbacks", () => {
    const blueprint = createReportBlueprint(sampleResponse, "baseline");
    const marketCap = blueprint.profile.find((item) => item.label === "Market Cap");
    const price = blueprint.profile.find((item) => item.label === "Last Price");

    expect(marketCap?.value).toContain("B");
    expect(price?.value).toContain("$");
  });

  it("handles missing optional data gracefully", () => {
    const minimal: ReportResponse = {
      symbol: "TSLA",
      report: "",
      companyData: {
        symbol: "TSLA",
        profile: { name: "Tesla", ticker: "TSLA", exchange: "", finnhubIndustry: "", country: "", currency: "USD", ipo: "", marketCapitalization: undefined, weburl: "" },
        quote: {},
        metrics: {},
        recentNews: [],
      },
    };

    const blueprint = createReportBlueprint(minimal);
    expect(blueprint.keyInsights.length).toBe(3);
    expect(blueprint.profile.length).toBeGreaterThan(0);
  });
});
