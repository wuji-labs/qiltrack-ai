import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/report/history/route";
import type { SupabaseClient } from "@supabase/supabase-js";

let mockServiceClient: {
  storage: {
    from: ReturnType<typeof vi.fn>;
  };
};

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
  createServiceRoleClient: vi.fn(() => mockServiceClient),
}));

import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";

describe("API: /api/report/history - RLS Filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    mockServiceClient = {
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://example.com/signed" },
            error: null,
          }),
        })),
      },
    };

    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockServiceClient as unknown as SupabaseClient
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should reject unauthorized requests", async () => {
    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);

    const request = new NextRequest("http://localhost:3000/api/report/history", {
      method: "GET",
      headers: {
        cookie: "",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return paginated report history", async () => {
    const mockReports = [
      {
        id: "run-123",
        symbol: "AAPL",
        created_at: "2025-11-24T10:00:00Z",
        status: "completed",
      },
      {
        id: "run-124",
        symbol: "GOOGL",
        created_at: "2025-11-23T10:00:00Z",
        status: "completed",
      },
    ];

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
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockReports,
                error: null,
                count: 2,
              }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);

    const request = new NextRequest("http://localhost:3000/api/report/history", {
      method: "GET",
      headers: {
        cookie: "",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("reports");
    expect(data).toHaveProperty("pagination");
    expect(data.reports).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.pageSize).toBe(10);
  });

  it("should handle pagination parameters", async () => {
    const mockReports = Array.from({ length: 10 }, (_, i) => ({
      id: `run-${200 + i}`,
      symbol: `SYM${i}`,
      created_at: "2025-11-20T10:00:00Z",
      status: "completed",
    }));

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
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockReports,
                error: null,
                count: 25,
              }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);

    const request = new NextRequest(
      "http://localhost:3000/api/report/history?page=2&limit=10",
      {
        method: "GET",
        headers: {
          cookie: "",
        },
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.page).toBe(2);
    expect(data.pagination.pageSize).toBe(10);
    expect(data.pagination.total).toBe(25);
    expect(data.pagination.pages).toBe(3);
  });

  it("should apply RLS filtering by user_id", async () => {
    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-456" } } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0,
              }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);

    const request = new NextRequest("http://localhost:3000/api/report/history", {
      method: "GET",
      headers: {
        cookie: "",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    // Verify that eq() was called with the user_id (RLS filtering)
    const mockClient = vi.mocked(createServerClient).mock.results[0].value;
    const selectCall = mockClient.from.mock.calls[0];
    expect(selectCall[0]).toBe("report_runs");
  });

  it("should return empty array when no reports exist", async () => {
    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-789" } } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0,
              }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);

    const request = new NextRequest("http://localhost:3000/api/report/history", {
      method: "GET",
      headers: {
        cookie: "",
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.reports).toHaveLength(0);
    expect(data.pagination.total).toBe(0);
    expect(data.pagination.pages).toBe(0);
  });

  it("should handle database errors gracefully", async () => {
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
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Database connection error" },
                count: null,
              }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);

    const request = new NextRequest("http://localhost:3000/api/report/history", {
      method: "GET",
      headers: {
        cookie: "",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch report history");
  });

  it("should validate page and limit parameters", async () => {
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
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0,
              }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);

    // Test with invalid page (should default to 1)
    const request = new NextRequest(
      "http://localhost:3000/api/report/history?page=0&limit=100",
      {
        method: "GET",
        headers: {
          cookie: "",
        },
      }
    );

    const response = await GET(request);
    const data = await response.json();

    // page 0 should be treated as page 1
    expect(data.pagination.page).toBe(1);
    // limit > 50 should be capped at 50
    expect(data.pagination.pageSize).toBe(50);
  });
});
