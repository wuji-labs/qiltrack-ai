import type { Language } from "@/lib/i18n-config";
import type { ReportResponse, ReportTone, SearchResult } from "@/types/report";

type FetchReportParams = {
	symbol: string;
	lang: Language;
	tone?: ReportTone;
};

type QuoteResponse = {
	symbol: string;
	quote: Record<string, unknown>;
};

async function handleJson<T>(res: Response, defaultMessage: string): Promise<T> {
	let body: unknown = null;
	try {
		body = await res.json();
	} catch {
		throw new Error(`${defaultMessage} (${res.status})`);
	}

	if (!res.ok) {
		const message =
			typeof (body as Record<string, unknown>)?.error === "string"
				? (body as { error: string }).error
				: defaultMessage;
		throw new Error(message);
	}

	return body as T;
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
	if (!query.trim()) return [];
	const searchParams = new URLSearchParams({ q: query.trim() });
	const testToken = process.env.NEXT_PUBLIC_TEST_REPORT_TOKEN;
	const enableTestSearch = process.env.NEXT_PUBLIC_ENABLE_TEST_SEARCH === "true";
	if (testToken && enableTestSearch) {
		searchParams.set("testToken", testToken);
	}
	const res = await fetch(`/api/search?${searchParams.toString()}`);
	const data = await handleJson<{ results?: SearchResult[] }>(
		res,
		"Failed to search symbol"
	);
	return data.results ?? [];
}

export async function generateReport(params: FetchReportParams): Promise<ReportResponse> {
	const search = new URLSearchParams({
		symbol: params.symbol,
		lang: params.lang,
	});
	const testToken = process.env.NEXT_PUBLIC_TEST_REPORT_TOKEN;

	if (params.tone) {
		search.set("tone", params.tone);
	}
	if (testToken) {
		search.set("testToken", testToken);
	}

	const res = await fetch(`/api/report?${search.toString()}`);
	return handleJson<ReportResponse>(res, "Failed to generate report");
}

export async function fetchQuote(symbol: string): Promise<QuoteResponse> {
	const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
	return handleJson<QuoteResponse>(res, "Failed to fetch quote");
}
