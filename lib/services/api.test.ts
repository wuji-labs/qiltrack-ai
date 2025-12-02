import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateReport, fetchCredits } from "./api";

describe("API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateReport", () => {
    it("should throw error with message 'Quota exceeded' on 429 response", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: "Quota exceeded" }),
      });
      global.fetch = mockFetch;

      await expect(generateReport({ symbol: "AAPL", lang: "en" })).rejects.toThrow(
        "Quota exceeded"
      );
    });

    it("should throw error with message from backend on 401 response", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });
      global.fetch = mockFetch;

      await expect(generateReport({ symbol: "AAPL", lang: "en" })).rejects.toThrow("Unauthorized");
    });

    it("should throw error with message from backend on 500 response", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });
      global.fetch = mockFetch;

      await expect(generateReport({ symbol: "AAPL", lang: "en" })).rejects.toThrow(
        "Internal server error"
      );
    });

    it("should throw default error when response is not JSON", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });
      global.fetch = mockFetch;

      await expect(generateReport({ symbol: "AAPL", lang: "en" })).rejects.toThrow(
        "Failed to generate report (500)"
      );
    });

    it("should return report data on successful response", async () => {
      const mockData = {
        symbol: "AAPL",
        report: "# Apple Inc Report\nSome content",
        companyData: { profile: { name: "Apple Inc" } },
        remainingQuota: 5,
      };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });
      global.fetch = mockFetch;

      const result = await generateReport({ symbol: "AAPL", lang: "en" });
      expect(result).toEqual(mockData);
    });

    it("should include testToken in URL when provided", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          symbol: "AAPL",
          report: "test",
          companyData: {},
        }),
      });
      global.fetch = mockFetch;

      // Mock the environment variable
      const originalEnv = process.env.NEXT_PUBLIC_TEST_REPORT_TOKEN;
      process.env.NEXT_PUBLIC_TEST_REPORT_TOKEN = "test-token-123";

      await generateReport({ symbol: "AAPL", lang: "en", tone: "baseline" });

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain("testToken=test-token-123");

      // Restore original env
      process.env.NEXT_PUBLIC_TEST_REPORT_TOKEN = originalEnv;
    });
  });

  describe("fetchCredits", () => {
    it("should return credits data on 200 response", async () => {
      const mockData = {
        userId: "user-123",
        credits: {
          remaining_credits: 10,
        },
      };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });
      global.fetch = mockFetch;

      const result = await fetchCredits();
      expect(result).toEqual(mockData);
      expect(result.credits.remaining_credits).toBe(10);
    });

    it("should throw 'Unauthorized' error on 401 response", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });
      global.fetch = mockFetch;

      await expect(fetchCredits()).rejects.toThrow("Unauthorized");
    });

    it("should throw error with backend message on 403 response", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });
      global.fetch = mockFetch;

      await expect(fetchCredits()).rejects.toThrow("Forbidden");
    });

    it("should throw default error when response is not JSON", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });
      global.fetch = mockFetch;

      await expect(fetchCredits()).rejects.toThrow("Failed to fetch credits (500)");
    });

    it("should call correct API endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          userId: "user-123",
          credits: { remaining_credits: 10 },
        }),
      });
      global.fetch = mockFetch;

      await fetchCredits();
      expect(mockFetch).toHaveBeenCalledWith("/api/report/credits");
    });
  });
});
