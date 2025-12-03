import type { Database } from '@/types/database';

/**
 * Standard API response for successful requests
 */
export interface APIResponse<T> {
  success: true;
  data: T;
}

/**
 * Standard API error response
 */
export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Report generation response data
 */
export interface ReportGenerationData {
  report: {
    id: string;
    slug: string;
    report_run_id: string;
    symbol: string;
    title: string;
    content: string;
    tone: string;
    language: string;
    created_at: string;
  };
  companyData: {
    profile: {
      country: string;
      currency: string;
      exchange: string;
      finnhubIndustry: string;
      ipo: string;
      logo: string;
      marketCapitalization: number;
      name: string;
      phone: string;
      shareOutstanding: number;
      ticker: string;
      weburl: string;
    };
    quote: {
      c: number;   // current price
      d: number;   // change
      dp: number;  // percent change
      h: number;   // high
      l: number;   // low
      o: number;   // open
      pc: number;  // previous close
      t: number;   // timestamp
    };
    news: Array<{
      category: string;
      datetime: number;
      headline: string;
      id: number;
      image: string;
      related: string;
      source: string;
      summary: string;
      url: string;
    }>;
  };
  metadata: {
    symbol: string;
    language: string;
    tone: string;
    generatedAt: string;
    userId: string | null;
    generationTimeMs: number;
  };
  reused: boolean;
}

export type ReportGenerationResponse = APIResponse<ReportGenerationData>;

/**
 * Helper to create success response
 */
export function successResponse<T>(data: T): Response {
  return Response.json({
    success: true,
    data,
  } as APIResponse<T>);
}

/**
 * Helper to create error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
  status: number = 400
): Response {
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    } as APIErrorResponse,
    { status }
  );
}

/**
 * Handle API errors and convert to error response
 */
export function handleApiError(error: unknown): Response {
  console.error('[API Error]', error);

  if (error instanceof Error) {
    return errorResponse(
      'INTERNAL_ERROR',
      error.message,
      { stack: error.stack },
      500
    );
  }

  return errorResponse(
    'UNKNOWN_ERROR',
    'An unknown error occurred',
    undefined,
    500
  );
}
