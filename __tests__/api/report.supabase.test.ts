import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock all Supabase and services
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
  createClient: vi.fn(), // Add createClient for new architecture
  createServiceRoleClient: vi.fn(),
  uploadToStorage: vi.fn(),
}));

vi.mock("@/lib/services/quota", () => ({
  consumeReportCredit: vi.fn(),
  writeReportAudit: vi.fn(),
}));

vi.mock("@/lib/observability/langfuse", () => ({
  getLangfuseClient: vi.fn(() => null),
}));

// Mock langfuse dependency to avoid requiring external package
vi.mock("langfuse", () => ({
  Langfuse: vi.fn(() => ({
    track: vi.fn(),
    flush: vi.fn(),
  })),
}));

// Mock global fetch for Finnhub/LLM
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { GET } from "@/app/api/report/route";
import {
  createServerClient,
  createClient,
  createServiceRoleClient,
  uploadToStorage,
} from "@/lib/supabase/server";
import { writeReportAudit } from "@/lib/services/quota";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("API: /api/report - Supabase Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set env vars for each test (runtime read now)
    process.env.TEST_REPORT_TOKEN = "test-token";
    process.env.FINNHUB_API_KEY = "test-finnhub-key";
    process.env.HELICONE_API_KEY = "test-helicone-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    mockFetch.mockClear();
  });

  it("should reject unauthorized requests without session", async () => {
    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    vi.mocked(createServerClient).mockImplementation(() => {
      // Don't call the setter
      return mockSupabaseClient;
    });

    // Mock createClient for new architecture services
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);

    const request = new NextRequest("http://localhost:3000/api/report?symbol=AAPL", {
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("should allow test bypass with token and skip auth", async () => {
    // Mock fetch responses for Finnhub/LLM calls
    const mockFetchResponses = [
      // profile
      { ok: true, json: async () => ({ name: "Apple Inc.", ticker: "AAPL", exchange: "NASDAQ" }) },
      // quote
      { ok: true, json: async () => ({ c: 150.0, d: 2.5, dp: 1.7 }) },
      // metrics
      { ok: true, json: async () => ({ metric: { peTTM: 25.5 } }) },
      // news
      { ok: true, json: async () => [] },
      // LLM (Helicone)
      {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "# [Qiltrack AI] Apple Report\n\n## Test\n\nThis is a test report.",
              },
            },
          ],
        }),
      },
    ];

    mockFetch.mockImplementation(() => {
      if (mockFetchResponses.length > 0) {
        const response = mockFetchResponses.shift();
        return Promise.resolve(response);
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    // Create flexible mock that handles different query chains
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createChainableMock = (dataToReturn: unknown = null): any => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chain: any = {
        select: vi.fn(),
        insert: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        gte: vi.fn(),
        lte: vi.fn(),
        not: vi.fn(),
        limit: vi.fn(),
        order: vi.fn(),
        single: vi.fn().mockResolvedValue({
          data: dataToReturn || { id: "run-test-123" },
          error: null,
        }),
      };
      chain.select.mockReturnValue(chain);
      chain.insert.mockReturnValue(chain);
      chain.delete.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      chain.gte.mockReturnValue(chain);
      chain.lte.mockReturnValue(chain);
      chain.not.mockReturnValue(chain);
      chain.limit.mockReturnValue(chain);
      chain.order.mockReturnValue(chain);

      // Make chain awaitable
      chain[Symbol.toStringTag] = "Promise";
      chain.then = (onFulfilled: (val: unknown) => unknown) => {
        return Promise.resolve({
          data: null,
          error: null,
        }).then(onFulfilled);
      };
      chain.catch = (onRejected: (val: unknown) => unknown) => {
        return Promise.resolve({
          data: null,
          error: null,
        }).catch(onRejected);
      };
      return chain;
    };

    const createMockFrom = () => ({
      insert: vi.fn().mockReturnValue(
        createChainableMock({
          id: "run-test-123",
          symbol: "AAPL",
          title: "Apple Inc. Report",
          report_run_id: "run-test-123",
        })
      ),
      select: vi.fn().mockReturnValue(createChainableMock({ remaining_credits: 10 })),
      delete: vi.fn().mockReturnValue(createChainableMock()),
    });

    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null }, // No session in test mode
          error: null,
        }),
      },
      from: vi.fn().mockImplementation(() => createMockFrom()),
      rpc: vi.fn().mockResolvedValue({
        data: [{ success: true, remaining_credits: 10 }],
        error: null,
      }),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: { path: "test.json" }, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://signed.url" } }),
        })),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    vi.mocked(createServerClient).mockImplementation((cookieGetter, cookieSetter) => {
      // Simulate calling the setter with empty array
      if (cookieSetter) {
        cookieSetter([]);
      }
      return mockSupabaseClient;
    });

    // Mock createClient for new architecture (ReportPersistence, CreditManager)
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);

    // Mock createServiceRoleClient for StorageService
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabaseClient);
    vi.mocked(uploadToStorage).mockResolvedValue("https://signed.url");
    vi.mocked(writeReportAudit).mockResolvedValue(undefined);

    const request = new NextRequest(
      "http://localhost:3000/api/report?symbol=AAPL&testToken=test-token",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    if (response.status !== 200) {
      const errorData = await response.json();
      console.error("Test failed with error:", errorData);
    }
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.report).toBeDefined();
    expect(data.data.symbol).toBe("AAPL");
    // Verify test mode audit was called with test uuid
    // Note: In new architecture, audit is recorded via ReportPersistence
  });

  it("should reject with missing symbol", async () => {
    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-123" } } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { remaining_credits: 10 },
              error: null,
            }),
          }),
        }),
      }),
      rpc: vi.fn().mockResolvedValue({
        data: [{ success: true, remaining_credits: 10 }],
        error: null,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    vi.mocked(createServerClient).mockImplementation(() => {
      // Don't call the setter
      return mockSupabaseClient;
    });

    // Mock createClient for new architecture
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);

    const request = new NextRequest("http://localhost:3000/api/report", {
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.message).toContain("Missing");
  });

  it("should reject when quota is exceeded", async () => {
    const mockChain = {
      select: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      not: vi.fn(),
      limit: vi.fn(),
      order: vi.fn(),
      single: vi.fn(),
    };

    // Setup chain to return null for select queries (no existing report)
    mockChain.select.mockReturnValue(mockChain);
    mockChain.eq.mockReturnValue(mockChain);
    mockChain.gte.mockReturnValue(mockChain);
    mockChain.lte.mockReturnValue(mockChain);
    mockChain.not.mockReturnValue(mockChain);
    mockChain.limit.mockReturnValue(mockChain);
    mockChain.order.mockReturnValue(mockChain);
    mockChain.single.mockResolvedValue({ data: null, error: null });

    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-123" } } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(mockChain),
      rpc: vi.fn().mockResolvedValue({
        data: [{ success: false, remaining_credits: 0 }],
        error: null,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    vi.mocked(createServerClient).mockImplementation(() => {
      // Don't call the setter
      return mockSupabaseClient;
    });

    // Mock createClient for new architecture - returns 0 credits
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);

    const request = new NextRequest("http://localhost:3000/api/report?symbol=AAPL", {
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
  });
});
