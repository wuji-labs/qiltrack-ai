import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
  uploadToStorage: vi.fn(),
}));

vi.mock("@/lib/services/quota", () => ({
  writeReportAudit: vi.fn(),
}));

vi.mock("@/lib/report/charts", () => ({
  buildPerformanceChart: vi.fn().mockReturnValue({ hasData: false }),
  buildValuationChart: vi.fn().mockReturnValue({ hasData: false }),
  renderChartPng: vi.fn().mockResolvedValue(null),
}));

vi.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: { children: unknown }) => children,
  Page: ({ children }: { children: unknown }) => children,
  Text: ({ children }: { children: unknown }) => children,
  View: ({ children }: { children: unknown }) => children,
  Image: () => null,
  StyleSheet: { create: (styles: unknown) => styles },
  pdf: vi.fn().mockReturnValue({
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("pdf-buffer")),
  }),
}));

import { POST } from "@/app/api/report/export/pdf/route";
import {
  createServerClient,
  createServiceRoleClient,
  uploadToStorage,
} from "@/lib/supabase/server";

describe("API: /api/report/export/pdf", () => {
  let storageFromMock: ReturnType<typeof vi.fn>;
  let insertMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) = "http://localhost:54321";
    (process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined) = "service-role-key";

    storageFromMock = vi.fn().mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: null, error: new Error("not found") }),
    });
    insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(createServiceRoleClient).mockReturnValue({
      storage: { from: storageFromMock },
      from: vi.fn().mockReturnValue({
        insert: insertMock,
      }),
    } as never);
  });

  it("rejects unauthorized requests", async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
    } as never);

    const request = new NextRequest("http://localhost:3000/api/report/export/pdf", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("rejects when plan is not annual", async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { plan: "free" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi
          .fn()
          .mockReturnValue({
            eq: vi
              .fn()
              .mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
          }),
      };
    });

    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-123" } } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);

    const request = new NextRequest("http://localhost:3000/api/report/export/pdf", {
      method: "POST",
      body: JSON.stringify({
        report: "# Title\n\nContent",
        companyData: { symbol: "AAPL", profile: {}, quote: {}, metrics: {}, recentNews: [] },
        reportRunId: "run-1",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("allows planLabel=annual when profile is not yet annual", async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { plan: "free" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi
          .fn()
          .mockReturnValue({
            eq: vi
              .fn()
              .mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
          }),
      };
    });

    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-123" } } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);
    vi.mocked(uploadToStorage).mockResolvedValue("https://signed.example/report.pdf");

    const request = new NextRequest("http://localhost:3000/api/report/export/pdf", {
      method: "POST",
      body: JSON.stringify({
        report: "# Investor AI\n\nFallback annual",
        companyData: { symbol: "AAPL", profile: {}, quote: {}, metrics: {}, recentNews: [] },
        symbol: "AAPL",
        planLabel: "annual",
        reportRunId: "run-2",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.downloadUrl).toBe("https://signed.example/report.pdf");
  });

  it("returns signed URL when PDF is generated for annual users", async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { plan: "annual", subscription_type: "annual" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi
          .fn()
          .mockReturnValue({
            eq: vi
              .fn()
              .mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
          }),
      };
    });

    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-123" } } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);
    vi.mocked(uploadToStorage).mockResolvedValue("https://signed.example/report.pdf");

    const request = new NextRequest("http://localhost:3000/api/report/export/pdf", {
      method: "POST",
      body: JSON.stringify({
        report: "# Investor AI\n\nTest body",
        companyData: { symbol: "AAPL", profile: {}, quote: {}, metrics: {}, recentNews: [] },
        symbol: "AAPL",
        planLabel: "annual",
        reportRunId: "run-1",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.downloadUrl).toBe("https://signed.example/report.pdf");
    expect(insertMock).toHaveBeenCalledWith({
      report_run_id: "run-1",
      document_type: "pdf",
      storage_path: "user-123/run-1/document.pdf",
    });
  });
});
