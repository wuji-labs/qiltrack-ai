import { vi } from "vitest";

// Provide safe dummy env vars for tests
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_dummy";
process.env.FINNHUB_API_KEY ||= "test-finnhub-key";
process.env.OPENROUTER_API_KEY ||= "test-openrouter-key";
process.env.OPENROUTER_MODEL ||= "openai/gpt-5.1";
process.env.HELICONE_API_KEY ||= "test-helicone-key";
process.env.HELICONE_MODEL ||= "gpt-5.1";
process.env.NEXTAUTH_URL ||= "http://localhost:3000";

// Mock Next headers/cookies to avoid request-scope errors
vi.mock("next/headers", () => {
  const jar = new Map<string, string>();
  const cookies = () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    getAll: () => Array.from(jar.entries()).map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
    has: (name: string) => jar.has(name),
  });
  return {
    cookies,
    headers: () => new Headers(),
  };
});

// Stripe mock
vi.mock("@/lib/stripe/client", () => {
  const stripeMock = {
    checkout: {
      sessions: {
        create: vi.fn(async () => ({ url: "https://example.com/checkout" })),
      },
    },
    webhooks: {
      constructEvent: vi.fn((_body, _sig, _secret) => ({
        type: "checkout.session.completed",
        data: { object: { customer: "cus_test", customer_details: { email: "test@example.com" }, metadata: { plan: "pro" } } },
      })),
    },
  };
  return {
    getStripeClient: vi.fn(() => stripeMock),
    stripe: stripeMock,
  };
});

// Market data mock
vi.mock("@/lib/services/market-data", () => {
  return {
    MarketDataService: class {
      async fetchCompanyData(symbol: string) {
        if (symbol === "INVALID") {
          throw new Error("Invalid symbol");
        }
        return {
          symbol,
          profile: {
            name: "Test Corp",
            ticker: symbol,
            exchange: "NASDAQ",
            finnhubIndustry: "Tech",
            country: "US",
            currency: "USD",
            ipo: "2020-01-01",
            marketCapitalization: 1000,
            weburl: "https://example.com",
          },
          quote: {
            current: 150,
            change: 1,
            changePercent: 0.5,
            high: 155,
            low: 145,
            open: 148,
            prevClose: 149,
            timestamp: Date.now(),
          },
          metrics: { peTTM: 15 },
          recentNews: [{ headline: "Test News", datetime: Date.now(), source: "Test", url: "https://example.com" }],
          news: [{ headline: "Test News", datetime: Date.now(), source: "Test", url: "https://example.com" }],
        };
      }
    },
  };
});

// LLM mock: deterministic behavior plus cost calculation
vi.mock("@/lib/services/llm", () => {
  type TokenUsage = { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  class LLMService {
    private pricing = {
      "gpt-4o-mini": { prompt: 0.15, completion: 0.6 },
      "gpt-4o": { prompt: 2.5, completion: 10 },
      "anthropic/claude-3.5-sonnet": { prompt: 3.0, completion: 15 },
    };

    constructor(_options?: any) {}

    private normalizeModel(model: string) {
      return model.replace(/^openai\//, "");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private calculateCost(usage: TokenUsage, model: string): number {
      const normalized = this.normalizeModel(model);
      const pricing = this.pricing[normalized as keyof typeof this.pricing] || this.pricing["gpt-4o-mini"];
      const promptCost = (usage.prompt_tokens * pricing.prompt) / 1_000_000;
      const completionCost = (usage.completion_tokens * pricing.completion) / 1_000_000;
      return Number((promptCost + completionCost).toFixed(10));
    }

    async generateReport(systemPrompt: string, userPrompt: string, options?: { maxTokens?: number }) {
      if (!systemPrompt || !userPrompt || (options?.maxTokens ?? 0) < 0) {
        throw new Error("Invalid prompt");
      }
      return `mock-report-${userPrompt}`.slice(0);
    }

    async generateEmbedding(text: string) {
      if (!text) {
        throw new Error("Text is required");
      }
      return Array.from({ length: 5 }, (_, i) => i / 10);
    }
  }

  return { LLMService };
});

// Storage mock
vi.mock("@/lib/services/storage", () => {
  const defaultBucket = "report-outputs";

  const buildPath = (userId: string, reportId: string, format: string) =>
    `reports/${userId}/${reportId}.${format}`;

  return {
    StorageService: class {
      constructor(private bucket: string = defaultBucket) {}
      async uploadFile(path: string) {
        return { path, publicUrl: `https://example.com/${path}` };
      }
      async uploadReportJson(runId: string) {
        const path = `reports/${runId}.json`;
        return { path, publicUrl: `https://example.com/${path}` };
      }
      async uploadReportCover(reportId: string, _image: Buffer | string, format = "png") {
        const path = `covers/${reportId}.${format}`;
        return { path, publicUrl: `https://example.com/${path}` };
      }
      getPublicUrl(path: string) {
        return `https://example.com/${path}`;
      }
      async fileExists(_path: string) {
        return true;
      }
    },
    async uploadReport(userId: string, reportId: string, _content: string, format = "json") {
      const path = buildPath(userId, reportId, format);
      return path;
    },
    async getSignedUrl(path: string, _expiresIn: number) {
      return `https://example.com/${path}`;
    },
  };
});
