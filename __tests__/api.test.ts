import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReportResponse } from "@/types/report";
import { generateReport, searchSymbols } from "@/lib/services/api";

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
});
