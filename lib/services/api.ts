import type { Language } from "@/lib/i18n-config";
import type {
  AdminReportPostPayload,
  AdminUploadResult,
  ReportPostResponse,
  ReportPostsResponse,
  ReportResponse,
  ReportTone,
  SearchResult,
  SimilarReport,
} from "@/types/report";

type FetchReportParams = {
  symbol: string;
  lang: Language;
  tone?: ReportTone;
};

type QuoteResponse = {
  symbol: string;
  quote: Record<string, unknown>;
};

type HistoryResponse = {
  reports: Array<{
    id: string;
    symbol: string;
    created_at: string;
    status: string;
    markdown_path?: string | null;
    docx_path?: string | null;
    markdown_signed_url?: string | null;
    docx_signed_url?: string | null;
    mode?: string | null;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
};

type CreditsResponse = {
  userId: string;
  credits: {
    remaining_credits: number;
  };
  source?: string;
};

type DailyRewardResponse = {
  success: boolean;
  message: string;
  remainingCredits: number;
};

type ApiErrorResponse = {
  error: string;
  code?:
    | "unauthorized"
    | "quota_exceeded"
    | "quota_fetch_failed"
    | "reward_claim_failed"
    | "internal_error";
};

async function handleJson<T>(
  res: Response,
  defaultMessage: string
): Promise<T & { __statusCode?: number }> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    throw new Error(`${defaultMessage} (${res.status})`);
  }

  if (!res.ok) {
    const apiError = body as ApiErrorResponse;
    const message = typeof apiError?.error === "string" ? apiError.error : defaultMessage;
    const error = new Error(message) as Error & { code?: string; statusCode?: number };
    error.code = apiError?.code;
    error.statusCode = res.status;
    throw error;
  }

  return body as T & { __statusCode?: number };
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
  const data = await handleJson<{ results?: SearchResult[] }>(res, "Failed to search symbol");
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
  const body = await handleJson<any>(res, "Failed to generate report");
  return (body as { data?: ReportResponse }).data ?? (body as ReportResponse);
}

export async function fetchQuote(symbol: string): Promise<QuoteResponse> {
  const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
  return handleJson<QuoteResponse>(res, "Failed to fetch quote");
}

/**
 * Fetch report history for authenticated user
 * @param page Page number (1-indexed)
 * @param limit Items per page (max 50)
 */
export async function fetchReportHistory(
  page: number = 1,
  limit: number = 10
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`/api/report/history?${params.toString()}`);
  return handleJson<HistoryResponse>(res, "Failed to fetch report history");
}

/**
 * Fetch current user's credit information
 */
export async function fetchCredits(): Promise<CreditsResponse> {
  const res = await fetch("/api/report/credits");
  return handleJson<CreditsResponse>(res, "Failed to fetch credits");
}

/**
 * Claim daily reward (10 credits)
 */
export async function claimDailyReward(): Promise<DailyRewardResponse> {
  const res = await fetch("/api/report/daily-reward", { method: "POST" });
  return handleJson<DailyRewardResponse>(res, "Failed to claim daily reward");
}

export async function fetchSimilarReports(params: {
  runId: string;
  lang?: Language;
  tone?: ReportTone;
  limit?: number;
}): Promise<{ similar: SimilarReport[] }> {
  const search = new URLSearchParams({ runId: params.runId });
  if (params.lang) search.set("lang", params.lang);
  if (params.tone) search.set("tone", params.tone);
  if (params.limit) search.set("limit", String(params.limit));

  const res = await fetch(`/api/report/similar?${search.toString()}`);
  return handleJson<{ similar: SimilarReport[] }>(res, "Failed to fetch similar reports");
}

type ReportPostsQuery = {
  page?: number;
  limit?: number;
  tag?: string;
  theme?: string;
  lang?: string;
  query?: string;
  status?: string;
};

/**
 * Fetch curated report posts list (paginated)
 */
export async function fetchReportPosts(
  params: ReportPostsQuery = {}
): Promise<ReportPostsResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.tag) search.set("tag", params.tag);
  if (params.theme) search.set("theme", params.theme);
  if (params.lang) search.set("lang", params.lang);
  if (params.query) search.set("q", params.query);
  if (params.status) search.set("status", params.status);

  const res = await fetch(`/api/report/posts?${search.toString()}`);
  return handleJson<ReportPostsResponse>(res, "Failed to fetch report posts");
}

/**
 * Fetch a single curated report post by slug
 */
export async function fetchReportPost(slug: string): Promise<ReportPostResponse> {
  const res = await fetch(`/api/report/posts/${encodeURIComponent(slug)}`);
  return handleJson<ReportPostResponse>(res, "Failed to fetch report post");
}

/**
 * Admin: create a report post
 */
export async function createAdminReportPost(
  payload: Required<Pick<AdminReportPostPayload, "title" | "slug">> &
    Omit<AdminReportPostPayload, "title" | "slug">
): Promise<ReportPostResponse> {
  const res = await fetch("/api/admin/report/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson<ReportPostResponse>(res, "Failed to create report post");
}

/**
 * Admin: update a report post by id or slug
 */
export async function updateAdminReportPost(
  payload: AdminReportPostPayload
): Promise<ReportPostResponse> {
  const res = await fetch("/api/admin/report/posts", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson<ReportPostResponse>(res, "Failed to update report post");
}

/**
 * Admin: upload an asset to Storage and record upload
 */
export async function uploadAdminAsset(
  file: File,
  options?: { userId?: string; title?: string; note?: string; version?: number; status?: string }
): Promise<AdminUploadResult> {
  const form = new FormData();
  form.append("file", file);
  if (options?.userId) form.append("userId", options.userId);
  if (options?.title) form.append("title", options.title);
  if (options?.note) form.append("note", options.note);
  if (options?.version) form.append("version", String(options.version));
  if (options?.status) form.append("status", options.status);

  const res = await fetch("/api/admin/report/upload", {
    method: "POST",
    body: form,
  });
  return handleJson<AdminUploadResult>(res, "Failed to upload asset");
}

/**
 * Check if a report can be reused within 7 days
 */
export async function fetchReportAvailability(params: {
  symbol: string;
  lang?: Language;
  mode?: string;
}): Promise<{ reusable: boolean; reusable_run_id?: string }> {
  const search = new URLSearchParams({ symbol: params.symbol });
  if (params.lang) search.set("lang", params.lang);
  if (params.mode) search.set("mode", params.mode);

  const res = await fetch(`/api/report/availability?${search.toString()}`);
  return handleJson<{ reusable: boolean; reusable_run_id?: string }>(
    res,
    "Failed to check report availability"
  );
}

/**
 * Fetch popular/featured reports
 */
export async function fetchPopularReports(params?: {
  limit?: number;
  lang?: Language;
  mode?: string;
}): Promise<{
  reports: Array<{
    report_run_id: string;
    symbol: string;
    created_at: string;
    featured_at?: string;
  }>;
}> {
  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.lang) search.set("lang", params.lang);
  if (params?.mode) search.set("mode", params.mode);

  const res = await fetch(`/api/report/popular?${search.toString()}`);
  return handleJson<{
    reports: Array<{
      report_run_id: string;
      symbol: string;
      created_at: string;
      featured_at?: string;
    }>;
  }>(res, "Failed to fetch popular reports");
}

/**
 * Admin: bulk unfeature reports older than specified days
 */
export async function bulkUnfeatureReports(params?: {
  olderThanDays?: number;
}): Promise<{ unfeaturedCount: number }> {
  const search = new URLSearchParams();
  if (params?.olderThanDays) search.set("olderThanDays", String(params.olderThanDays));

  const res = await fetch(`/api/admin/runs/unfeature-bulk?${search.toString()}`, {
    method: "POST",
  });
  return handleJson<{ unfeaturedCount: number }>(res, "Failed to bulk unfeature reports");
}
