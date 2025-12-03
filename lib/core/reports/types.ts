/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Language } from "@/lib/i18n-config";
import type { MarketData } from "@/lib/services/market-data";

/**
 * Report tone/style
 */
export type ReportTone = "baseline" | "buffett" | "musk" | "muddy";

/**
 * Report generation parameters
 */
export interface GenerateReportParams {
  symbol: string;
  language?: Language;
  tone?: ReportTone;
  userId?: string;
  metadata?: {
    reportRunId?: string;
    isTest?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Generated report
 */
export interface GeneratedReport {
  content: string;
  marketData: MarketData;
  metadata: ReportMetadata;
}

/**
 * Report metadata
 */
export interface ReportMetadata {
  reportRunId?: string;
  symbol: string;
  language: Language;
  tone: ReportTone;
  generatedAt: string;
  userId?: string;
  tokensUsed?: number;
  modelUsed?: string;
  generationTimeMs?: number;
}

/**
 * Report save result
 */
export interface SavedReport {
  id: string;
  slug: string;
  report_run_id: string;
  symbol: string;
  title: string;
  content: string;
  cover_url?: string;
  storage_url?: string;
  tone: ReportTone;
  language: Language;
  created_at: string;
}

/**
 * Report reuse check result
 */
export interface ReuseCheckResult {
  canReuse: boolean;
  existingReport?: SavedReport;
  reason?: string;
}
