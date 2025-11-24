import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock all Supabase and services
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
  uploadToStorage: vi.fn(),
}));

vi.mock("@/lib/services/quota", () => ({
  consumeReportCredit: vi.fn(),
  writeReportAudit: vi.fn(),
}));

// Mock global fetch for Finnhub/LLM
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { GET } from "@/app/api/report/route";
import { createServerClient, createServiceRoleClient, uploadToStorage } from "@/lib/supabase/server";
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
    } as unknown as SupabaseClient;

    vi.mocked(createServerClient).mockImplementation(() => {
      // Don't call the setter
      return mockSupabaseClient;
    });

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
      { ok: true, json: async () => ([]) },
      // LLM (Helicone)
      {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "# [Investor AI] Apple Report\n\n## Test\n\nThis is a test report." } }],
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
    const createChainableMock = (dataToReturn: unknown = null) => {
      const chain: {
        select: ReturnType<typeof vi.fn>;
        insert: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
        eq: ReturnType<typeof vi.fn>;
        single: ReturnType<typeof vi.fn>;
        [key: string]: unknown;
      } = {
        select: vi.fn().mockReturnValue(chain),
        insert: vi.fn().mockReturnValue(chain),
        delete: vi.fn().mockReturnValue(chain),
        eq: vi.fn().mockReturnValue(chain),
        single: vi.fn().mockResolvedValue({
          data: dataToReturn || { id: "run-test-123" },
          error: null,
        }),
      };
      // Make chain awaitable
      chain[Symbol.toStringTag] = "Promise";
      (chain as { then?: (onFulfilled: (val: unknown) => unknown) => Promise<unknown> }).then = (onFulfilled: (val: unknown) => unknown) => {
        return Promise.resolve({
          data: null,
          error: null,
        }).then(onFulfilled);
      };
      (chain as { catch?: (onRejected: (val: unknown) => unknown) => Promise<unknown> }).catch = (onRejected: (val: unknown) => unknown) => {
        return Promise.resolve({
          data: null,
          error: null,
        }).catch(onRejected);
      };
      return chain;
    };

    const createMockFrom = () => ({
      insert: vi.fn().mockReturnValue(createChainableMock({ id: "run-test-123" })),
      select: vi.fn().mockReturnValue(
        createChainableMock({ remaining_credits: 10 })
      ),
      delete: vi.fn().mockReturnValue(
        createChainableMock()
      ),
    });

    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null }, // No session in test mode
          error: null,
        }),
      },
      from: vi.fn().mockImplementation(() => createMockFrom()),
    } as unknown as SupabaseClient;

    vi.mocked(createServerClient).mockImplementation((cookieGetter, cookieSetter) => {
      // Simulate calling the setter with empty array
      if (cookieSetter) {
        cookieSetter([]);
      }
      return mockSupabaseClient;
    });
    vi.mocked(createServiceRoleClient).mockReturnValue({} as unknown as SupabaseClient);
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
    expect(data.symbol).toBe("AAPL");
    // Verify test mode audit was called with test uuid
    expect(writeReportAudit).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000001", "AAPL", "test", "success");
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
    } as unknown as SupabaseClient;

    vi.mocked(createServerClient).mockImplementation(() => {
      // Don't call the setter
      return mockSupabaseClient;
    });

    const request = new NextRequest("http://localhost:3000/api/report", {
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Missing symbol");
  });

  it("should reject when quota is exceeded", async () => {
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
              data: { remaining_credits: 0 },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    vi.mocked(createServerClient).mockImplementation(() => {
      // Don't call the setter
      return mockSupabaseClient;
    });

    const request = new NextRequest("http://localhost:3000/api/report?symbol=AAPL", {
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(429);
  });
});
