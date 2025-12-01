import { ExternalServiceError } from "../core/errors";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

/**
 * Company profile data from Finnhub
 */
export interface CompanyProfile {
  name: string;
  ticker: string;
  exchange: string;
  finnhubIndustry: string;
  country: string;
  currency: string;
  ipo: string;
  marketCapitalization: number;
  weburl: string;
}

/**
 * Stock quote data
 */
export interface StockQuote {
  current: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  timestamp: number;
}

/**
 * Financial metrics
 */
export interface FinancialMetrics {
  peTTM?: number;
  psTTM?: number;
  pbAnnual?: number;
  revenueGrowth3Y?: number;
  revenueGrowth5Y?: number;
  epsGrowth3Y?: number;
  epsGrowth5Y?: number;
  currentRatioQuarterly?: number;
  quickRatioAnnual?: number;
  roeTTM?: number;
  roaRfy?: number;
  dividendYieldIndicatedAnnual?: number;
  "52WeekHigh"?: number;
  "52WeekLow"?: number;
}

/**
 * Company news item
 */
export interface NewsItem {
  datetime: number;
  headline: string;
  source: string;
  url: string;
  summary?: string;
  related?: string;
}

/**
 * Complete market data for a company
 */
export interface MarketData {
  symbol: string;
  profile: CompanyProfile;
  quote: StockQuote;
  metrics: FinancialMetrics;
  recentNews: NewsItem[];
}

/**
 * Market Data Service handles all interactions with Finnhub API
 */
export class MarketDataService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FINNHUB_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("Finnhub API key not configured");
    }
  }

  /**
   * Fetch complete market data for a symbol
   *
   * @param symbol - Stock symbol (e.g. "AAPL")
   * @returns Complete market data
   */
  async fetchCompanyData(symbol: string): Promise<MarketData> {
    const normalizedSymbol = symbol.toUpperCase().trim();

    // Fetch all data in parallel
    const [profile, quote, metrics, news] = await Promise.all([
      this.getProfile(normalizedSymbol),
      this.getQuote(normalizedSymbol),
      this.getMetrics(normalizedSymbol),
      this.getNews(normalizedSymbol),
    ]);

    return {
      symbol: normalizedSymbol,
      profile,
      quote,
      metrics,
      recentNews: news,
    };
  }

  /**
   * Get company profile
   */
  async getProfile(symbol: string): Promise<CompanyProfile> {
    const url = `${FINNHUB_BASE}/stock/profile2?symbol=${encodeURIComponent(
      symbol
    )}&token=${this.apiKey}`;

    const data = await this.fetchJson(url);

    if (!data || !data.ticker) {
      throw new ExternalServiceError(
        `No profile data found for symbol: ${symbol}`
      );
    }

    return {
      name: data.name || "",
      ticker: data.ticker || symbol,
      exchange: data.exchange || "",
      finnhubIndustry: data.finnhubIndustry || "",
      country: data.country || "",
      currency: data.currency || "USD",
      ipo: data.ipo || "",
      marketCapitalization: data.marketCapitalization || 0,
      weburl: data.weburl || "",
    };
  }

  /**
   * Get stock quote
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(
      symbol
    )}&token=${this.apiKey}`;

    const data = await this.fetchJson(url);

    if (!data || data.c === undefined) {
      throw new ExternalServiceError(
        `No quote data found for symbol: ${symbol}`
      );
    }

    return {
      current: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      prevClose: data.pc,
      timestamp: data.t,
    };
  }

  /**
   * Get financial metrics
   */
  async getMetrics(symbol: string): Promise<FinancialMetrics> {
    const url = `${FINNHUB_BASE}/stock/metric?symbol=${encodeURIComponent(
      symbol
    )}&metric=all&token=${this.apiKey}`;

    const data = await this.fetchJson(url);

    const metric = data?.metric || {};

    return {
      peTTM: metric.peTTM,
      psTTM: metric.psTTM,
      pbAnnual: metric.pbAnnual,
      revenueGrowth3Y: metric.revenueGrowth3Y,
      revenueGrowth5Y: metric.revenueGrowth5Y,
      epsGrowth3Y: metric.epsGrowth3Y,
      epsGrowth5Y: metric.epsGrowth5Y,
      currentRatioQuarterly: metric.currentRatioQuarterly,
      quickRatioAnnual: metric.quickRatioAnnual,
      roeTTM: metric.roeTTM,
      roaRfy: metric.roaRfy,
      dividendYieldIndicatedAnnual:
        metric.dividendYieldIndicatedAnnual,
      "52WeekHigh": metric["52WeekHigh"],
      "52WeekLow": metric["52WeekLow"],
    };
  }

  /**
   * Get recent company news (last 60 days)
   */
  async getNews(symbol: string, days: number = 60): Promise<NewsItem[]> {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);

    const fromDate = this.formatDate(startDate);
    const toDate = this.formatDate(today);

    const url = `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(
      symbol
    )}&from=${fromDate}&to=${toDate}&token=${this.apiKey}`;

    const data = await this.fetchJson(url);

    if (!Array.isArray(data)) {
      return [];
    }

    // Return max 10 most recent news items
    return data.slice(0, 10);
  }

  /**
   * Format date as YYYY-MM-DD
   * @private
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Fetch JSON from URL
   * @private
   */
  private async fetchJson(url: string): Promise<any> {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Request failed: ${res.status} ${res.statusText} - ${errorText}`
        );
      }

      return await res.json();
    } catch (error) {
      throw new ExternalServiceError(
        `Finnhub API request failed: ${error}`,
        { url, error: String(error) }
      );
    }
  }
}
