import { describe, it, expect } from "vitest";
import { mapApiPostToCard, mapSummaryToCard } from "@/lib/content/reportHub";
import type { ReportPost, ReportSummary } from "@/types/report";

describe("reportHub mappings", () => {
	it("maps API post with string body into a usable card", () => {
		const post: ReportPost = {
			id: "123",
			slug: "my-report",
			title: "Sample Report",
			summary: "A short summary",
			body: "First paragraph.\n\nSecond paragraph.",
			cover: null,
			theme: "AI",
			tags: ["ai", "sample"],
			lang: "en",
			status: "published",
			version: 2,
			author: "Tester",
			publishedAt: "2025-11-29T00:00:00.000Z",
		};

		const card = mapApiPostToCard(post);

		expect(card.slug).toBe("my-report");
		expect(card.title).toBe("Sample Report");
		expect(card.snippet).toBe("A short summary");
		expect(card.body.length).toBe(2);
		expect(card.readTime.endsWith("min")).toBe(true);
		expect(card.tags).toContain("ai");
		expect(card.version).toBe(2);
	});

	it("maps static summary into a card with slug fallback", () => {
		const summary: ReportSummary = {
			symbol: "TST",
			title: "Title",
			snippet: "Snippet",
			date: "2025-11-29",
			author: "Author",
			theme: "General",
			url: "/reports/tst",
			tags: [],
			cover: "",
			readTime: "3 min",
			body: ["Paragraph"],
		};

		const card = mapSummaryToCard(summary);
		expect(card.slug).toBe("tst");
		expect(card.body).toEqual(["Paragraph"]);
		expect(card.status).toBe("published");
	});
});
