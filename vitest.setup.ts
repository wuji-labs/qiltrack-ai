import { vi } from "vitest";

// Provide safe dummy env vars for tests
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_dummy";
process.env.FINNHUB_API_KEY ||= "test-finnhub-key";
process.env.OPENROUTER_API_KEY ||= "test-openrouter-key";
process.env.OPENROUTER_MODEL ||= "openai/gpt-4o";
process.env.HELICONE_API_KEY ||= "test-helicone-key";
process.env.HELICONE_MODEL ||= "gpt-4o-mini";
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

// Lightweight Supabase mock
vi.mock("@/lib/supabase/server", () => {
  const makeBuilder = () => {
    const builder: any = {
      select: vi.fn(() => builder),
      insert: vi.fn(async () => ({ data: null, error: null })),
      update: vi.fn(async () => ({ data: null, error: null })),
      delete: vi.fn(async () => ({ data: null, error: null })),
      eq: vi.fn(() => builder),
      order: vi.fn(() => builder),
      range: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      like: vi.fn(() => builder),
      in: vi.fn(() => builder),
      single: vi.fn(async () => ({ data: {}, error: null })),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      limit: vi.fn(() => builder),
    };
    return builder;
  };

  const baseClient: any = {
    from: vi.fn(() => makeBuilder()),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ data: { path: "mock/path" }, error: null })),
        createSignedUrl: vi.fn(async () => ({
          data: { signedUrl: "https://example.com/mock" },
          error: null,
        })),
      })),
    },
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { user: { id: "test-user" } } }, error: null })),
      getUser: vi.fn(async () => ({ data: { user: { id: "test-user" } }, error: null })),
      admin: {
        createUser: vi.fn(async () => ({ data: { user: { id: "new-user" } }, error: null })),
        updateUserById: vi.fn(async () => ({ error: null })),
        deleteUser: vi.fn(async () => ({ error: null })),
      },
    },
  };

  return {
    createServerClient: vi.fn(() => baseClient),
    createServiceRoleClient: vi.fn(() => baseClient),
    createRouteHandlerClient: vi.fn(() => baseClient),
    getUserIdFromRequest: vi.fn(async () => "test-user"),
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
          metrics: {},
          recentNews: [],
        };
      }
    },
  };
});

// LLM mock: keep cost calc but stub network methods
vi.mock("@/lib/services/llm", async () => {
  const actual = await vi.importActual<any>("@/lib/services/llm");
  class LLMServiceMock extends actual.LLMService {
    constructor(options?: any) {
      super(
        options ?? {
          openRouter: {
            apiKey: "test-openrouter-key",
            model: "openai/gpt-4o",
            siteUrl: "http://localhost",
            appName: "test-app",
          },
          helicone: {
            apiKey: "test-helicone-key",
            model: "gpt-4o-mini",
          },
        },
      );
    }
    async generateReport() {
      return "mock-report";
    }
    async generateEmbedding() {
      return { embedding: [] };
    }
  }
  return { ...actual, LLMService: LLMServiceMock };
});

// Storage mock
vi.mock("@/lib/services/storage", () => {
  return {
    StorageService: class {
      async uploadFile(path: string) {
        return { path, publicUrl: `https://example.com/${path}` };
      }
      async uploadReportJson(runId: string) {
        const path = `reports/${runId}.json`;
        return { path, publicUrl: `https://example.com/${path}` };
      }
    },
  };
});

// Redis/rate limit mocks
vi.mock("@/lib/cache/redis", () => {
  class MarketDataCache {
    async get() {
      return null;
    }
    async set() {}
  }
  class ReportCache {
    async get() {
      return null;
    }
    async set() {}
  }
  return { MarketDataCache, ReportCache };
});

vi.mock("@/lib/api/rate-limit", () => {
  return {
    reportGenerationRateLimit: {},
    checkRateLimit: vi.fn(async () => ({ success: true, headers: {} })),
  };
});
