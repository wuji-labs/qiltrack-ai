import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReportResponse } from "@/types/report";
import { generateReport, searchSymbols, fetchCredits } from "@/lib/services/api";

describe("API services", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("searchSymbols returns result list", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ results: [{ symbol: "NVDA", description: "NVIDIA" }] }),
		});
		vi.stubGlobal("fetch", fetchMock);

		const results = await searchSymbols("nv");
		expect(results).toHaveLength(1);
		expect(fetchMock).toHaveBeenCalledWith("/api/search?q=nv");
	});

	it("generateReport forwards params and parses data", async () => {
		const payload: ReportResponse = {
			symbol: "NVDA",
			report: "# test",
			companyData: { symbol: "NVDA", profile: {}, quote: {}, metrics: {}, recentNews: [] },
		};
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
		vi.stubGlobal("fetch", fetchMock);

		const data = await generateReport({ symbol: "NVDA", lang: "en", tone: "musk" });
		expect(fetchMock).toHaveBeenCalledWith("/api/report?symbol=NVDA&lang=en&tone=musk");
		expect(data.symbol).toBe("NVDA");
	});

	it("generateReport throws on error status", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			json: async () => ({ error: "Failed" }),
		});
		vi.stubGlobal("fetch", fetchMock);

		await expect(generateReport({ symbol: "BAD", lang: "en" })).rejects.toThrow("Failed");
	});

	it("fetchCredits returns remaining credits on success", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				userId: "test-user",
				credits: { remaining_credits: 10 },
				source: "v_user_quota",
			}),
		});
		vi.stubGlobal("fetch", fetchMock);

		const data = await fetchCredits();
		expect(fetchMock).toHaveBeenCalledWith("/api/report/credits");
		expect(data.credits.remaining_credits).toBe(10);
		expect(data.source).toBe("v_user_quota");
	});

	it("fetchCredits throws unauthorized error with code", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			status: 401,
			json: async () => ({ error: "Unauthorized", code: "unauthorized" }),
		});
		vi.stubGlobal("fetch", fetchMock);

		try {
			await fetchCredits();
			expect.fail("Should have thrown");
		} catch (err) {
			const error = err as Error & { code?: string; statusCode?: number };
			expect(error.message).toBe("Unauthorized");
			expect(error.code).toBe("unauthorized");
			expect(error.statusCode).toBe(401);
		}
	});

	it("fetchCredits throws quota_fetch_failed error with code", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			json: async () => ({
				error: "Failed to fetch quota information",
				code: "quota_fetch_failed",
			}),
		});
		vi.stubGlobal("fetch", fetchMock);

		try {
			await fetchCredits();
			expect.fail("Should have thrown");
		} catch (err) {
			const error = err as Error & { code?: string; statusCode?: number };
			expect(error.message).toBe("Failed to fetch quota information");
			expect(error.code).toBe("quota_fetch_failed");
			expect(error.statusCode).toBe(500);
		}
	});

	it("generateReport throws quota_exceeded error with code", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			status: 429,
			json: async () => ({ error: "Quota exceeded", code: "quota_exceeded" }),
		});
		vi.stubGlobal("fetch", fetchMock);

		try {
			await generateReport({ symbol: "NVDA", lang: "en" });
			expect.fail("Should have thrown");
		} catch (err) {
			const error = err as Error & { code?: string; statusCode?: number };
			expect(error.message).toBe("Quota exceeded");
			expect(error.code).toBe("quota_exceeded");
			expect(error.statusCode).toBe(429);
		}
	});
});
