import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	searchSymbols,
	generateReport,
	fetchQuote,
	fetchReportHistory,
	fetchCredits,
} from "@/lib/services/api";

// Mock fetch globally
global.fetch = vi.fn();

describe("lib/services/api", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NEXT_PUBLIC_TEST_REPORT_TOKEN = undefined;
		process.env.NEXT_PUBLIC_ENABLE_TEST_SEARCH = undefined;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("searchSymbols", () => {
		it("should return empty array for empty query", async () => {
			const result = await searchSymbols("   ");
			expect(result).toEqual([]);
			expect(fetch).not.toHaveBeenCalled();
		});

		it("should successfully search symbols", async () => {
			const mockResults = [
				{ symbol: "AAPL", name: "Apple Inc." },
				{ symbol: "MSFT", name: "Microsoft Corporation" },
			];

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ results: mockResults }),
			} as Response);

			const result = await searchSymbols("APP");

			expect(result).toEqual(mockResults);
			expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/search?q=APP"));
		});

		it("should return empty array when API returns no results", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ results: undefined }),
			} as Response);

			const result = await searchSymbols("XYZ");

			expect(result).toEqual([]);
		});

		it("should handle API errors gracefully", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: "Invalid query" }),
			} as Response);

			await expect(searchSymbols("test")).rejects.toThrow("Invalid query");
		});

		it("should handle JSON parse errors", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => {
					throw new Error("Invalid JSON");
				},
			} as Response);

			await expect(searchSymbols("test")).rejects.toThrow("Failed to search symbol");
		});

		it("should include test token when enabled", async () => {
			process.env.NEXT_PUBLIC_TEST_REPORT_TOKEN = "test-123";
			process.env.NEXT_PUBLIC_ENABLE_TEST_SEARCH = "true";

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ results: [] }),
			} as Response);

			await searchSymbols("test");

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("testToken=test-123")
			);
		});
	});

	describe("generateReport", () => {
		it("should successfully generate a report", async () => {
			const mockResponse = {
				id: "report-1",
				status: "completed",
				content: "Report content...",
			};

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockResponse,
			} as Response);

			const result = await generateReport({
				symbol: "AAPL",
				lang: "en",
				tone: "baseline",
			});

			expect(result).toEqual(mockResponse);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/report?symbol=AAPL&lang=en&tone=baseline")
			);
		});

		it("should handle generation errors", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({ error: "Server error" }),
			} as Response);

			await expect(
				generateReport({ symbol: "AAPL", lang: "en" })
			).rejects.toThrow("Server error");
		});

		it("should include test token in generation when available", async () => {
			process.env.NEXT_PUBLIC_TEST_REPORT_TOKEN = "test-token-123";

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: "1", status: "completed" }),
			} as Response);

			await generateReport({ symbol: "TSLA", lang: "en" });

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("testToken=test-token-123")
			);
		});
	});

	describe("fetchQuote", () => {
		it("should successfully fetch a quote", async () => {
			const mockQuote = {
				symbol: "AAPL",
				quote: { price: 150.25, change: 2.5 },
			};

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockQuote,
			} as Response);

			const result = await fetchQuote("AAPL");

			expect(result).toEqual(mockQuote);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/quote?symbol=AAPL")
			);
		});

		it("should handle quote fetch errors", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: async () => ({ error: "Symbol not found" }),
			} as Response);

			await expect(fetchQuote("INVALID")).rejects.toThrow("Symbol not found");
		});

		it("should properly encode special characters in symbol", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ symbol: "BRK.A", quote: {} }),
			} as Response);

			await fetchQuote("BRK.A");

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("symbol=BRK.A")
			);
		});
	});

	describe("fetchReportHistory", () => {
		it("should fetch report history with default pagination", async () => {
			const mockHistory = {
				reports: [
					{ id: "1", symbol: "AAPL", created_at: "2024-01-01", status: "completed" },
				],
				pagination: { page: 1, pageSize: 10, total: 1, pages: 1 },
			};

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockHistory,
			} as Response);

			const result = await fetchReportHistory();

			expect(result).toEqual(mockHistory);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/report/history?page=1&limit=10")
			);
		});

		it("should accept custom pagination parameters", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ reports: [], pagination: { page: 2, pageSize: 20, total: 0, pages: 0 } }),
			} as Response);

			await fetchReportHistory(2, 20);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/report/history?page=2&limit=20")
			);
		});

		it("should handle history fetch errors", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({ error: "Unauthorized" }),
			} as Response);

			await expect(fetchReportHistory()).rejects.toThrow("Unauthorized");
		});
	});

	describe("fetchCredits", () => {
		it("should successfully fetch user credits", async () => {
			const mockCredits = {
				userId: "user-123",
				credits: { remaining_credits: 50 },
			};

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockCredits,
			} as Response);

			const result = await fetchCredits();

			expect(result).toEqual(mockCredits);
			expect(fetch).toHaveBeenCalledWith("/api/report/credits");
		});

		it("should handle credit fetch errors", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 403,
				json: async () => ({ error: "Access denied" }),
			} as Response);

			await expect(fetchCredits()).rejects.toThrow("Access denied");
		});

		it("should handle network errors", async () => {
			vi.mocked(fetch).mockRejectedValueOnce(
				new Error("Network timeout")
			);

			await expect(fetchCredits()).rejects.toThrow("Network timeout");
		});
	});

	describe("Error handling edge cases", () => {
		it("should handle API returning non-JSON error response", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => {
					throw new Error("Not JSON");
				},
			} as Response);

			await expect(searchSymbols("test")).rejects.toThrow(
				"Failed to search symbol (500)"
			);
		});

		it("should handle undefined error message from API", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({}),
			} as Response);

			await expect(generateReport({ symbol: "TEST", lang: "en" }))
				.rejects.toThrow("Failed to generate report");
		});
	});
});
