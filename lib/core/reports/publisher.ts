/**
 * Report Publisher
 * Handles automatic publishing of user-generated reports to the report center
 *
 * Features:
 * - Intelligent deduplication (same company + language)
 * - Automatic SEO metadata generation
 * - Access level assignment (timed-free, pro, ultra)
 * - Quality scoring and categorization
 * - Scheduled access level upgrades
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/i18n-config";
import type { AccessLevel, ReportPost } from "@/types/report";
import { generateSEOMeta, type SEOMetaInput } from "../seo/meta-generator";

export interface PublishReportParams {
  reportRunId: string;
  userId?: string;
  forcePublish?: boolean; // Skip duplicate check
}

export interface PublishResult {
  published: boolean;
  reason?: string;
  slug?: string;
  url?: string;
  existingSlug?: string;
}

export interface QualityScore {
  total: number; // 0-100
  breakdown: {
    contentLength: number;
    dataCompleteness: number;
    hasCharts: number;
    userRating: number;
  };
}

/**
 * Check if a similar report already exists (deduplication)
 */
export async function checkDuplicate(
  symbol: string,
  language: Language,
  daysThreshold = 7
): Promise<{ exists: boolean; report?: ReportPost }> {
  const supabase = createServiceRoleClient();

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  const { data, error } = await supabase
    .from("report_posts")
    .select("*")
    .eq("symbol", symbol.toUpperCase())
    .eq("language", language)
    .eq("status", "published")
    .gte("published_at", thresholdDate.toISOString())
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned (not an error)
    console.error("Error checking duplicate:", error);
    return { exists: false };
  }

  return {
    exists: !!data,
    report: data as ReportPost | undefined,
  };
}

/**
 * Calculate content quality score (0-100)
 */
export function calculateQualityScore(
  content: string,
  marketDataFieldCount: number,
  chartCount = 0,
  userRating?: number
): QualityScore {
  const breakdown = {
    contentLength: 0,
    dataCompleteness: 0,
    hasCharts: 0,
    userRating: 0,
  };

  // Content length score (max 30 points)
  const wordCount = content.split(/\s+/).length;
  breakdown.contentLength = Math.min(30, Math.floor(wordCount / 50));

  // Data completeness score (max 30 points)
  // Assume 15 key data fields in marketData
  breakdown.dataCompleteness = Math.min(30, marketDataFieldCount * 2);

  // Chart/visualization score (max 20 points)
  breakdown.hasCharts = Math.min(20, chartCount * 5);

  // User rating score (max 20 points)
  if (userRating && userRating > 0) {
    breakdown.userRating = userRating * 4; // 5-star rating * 4 = 20
  }

  const total =
    breakdown.contentLength +
    breakdown.dataCompleteness +
    breakdown.hasCharts +
    breakdown.userRating;

  return { total, breakdown };
}

/**
 * Determine initial access level based on quality score
 *
 * **NEW STRATEGY (2025-12-09)**:
 * - All new reports default to "pro" (protected content for paying users)
 * - Admins manually select high-quality reports to set as "timed-free" for SEO
 * - Quality score is saved for admin reference, but doesn't auto-set access level
 *
 * This protects valuable content by default and gives admins full control over
 * which reports are used for SEO traffic acquisition.
 */
export function determineAccessLevel(qualityScore: number): AccessLevel {
  // Default to Ultra for all new reports
  // Admins can manually downgrade to "pro" or "timed-free" for SEO purposes

  // Quality score thresholds (for admin reference):
  // - 80+: Excellent (consider for timed-free SEO)
  // - 60-79: Good (consider for pro content)
  // - <60: Fair (may not be suitable for public SEO)

  return "ultra"; // Default: Ultra-exclusive content
}

/**
 * Categorize report by industry/theme based on symbol
 */
export function categorizeByIndustry(symbol: string): string {
  // Industry mapping (simplified - should be fetched from market data)
  const industryMap: Record<string, string> = {
    AAPL: "Cloud + AI",
    MSFT: "Cloud + AI",
    GOOGL: "Cloud + AI",
    AMZN: "Cloud + AI",
    META: "Cloud + AI",
    NVDA: "Semiconductor",
    AMD: "Semiconductor",
    INTC: "Semiconductor",
    TSM: "Semiconductor",
    ASML: "Semiconductor",
    RTX: "Defense & Aerospace",
    LMT: "Defense & Aerospace",
    BA: "Defense & Aerospace",
    TSLA: "Mobility",
    F: "Mobility",
    GM: "Mobility",
    RIVN: "Mobility",
    NFLX: "Media",
    DIS: "Media",
  };

  return industryMap[symbol.toUpperCase()] || "Technology";
}

/**
 * Count available data fields in market data
 */
function countDataFields(marketData: any): number {
  let count = 0;

  if (!marketData) return count;

  // Count profile fields
  if (marketData.profile) {
    const profile = marketData.profile;
    if (profile.name) count++;
    if (profile.marketCapitalization) count++;
    if (profile.finnhubIndustry) count++;
  }

  // Count quote fields
  if (marketData.quote) {
    const quote = marketData.quote;
    if (quote.current) count++;
    if (quote.change) count++;
    if (quote.high) count++;
    if (quote.low) count++;
  }

  // Count metrics fields
  if (marketData.metrics) {
    const metrics = marketData.metrics;
    if (metrics.peTTM) count++;
    if (metrics.pbAnnual) count++;
    if (metrics.roeTTM) count++;
    if (metrics.revenueGrowth3Y) count++;
  }

  return count;
}

/**
 * Count charts/tables in markdown content
 */
function countCharts(content: string): number {
  // Simple heuristic: count markdown tables and common chart keywords
  const tableCount = (content.match(/\|.*\|/g) || []).length / 3; // Rough estimate
  const chartKeywords = ["chart", "graph", "figure", "table"];

  let chartCount = Math.floor(tableCount);

  for (const keyword of chartKeywords) {
    if (content.toLowerCase().includes(keyword)) {
      chartCount++;
    }
  }

  return Math.min(chartCount, 5); // Cap at 5
}

/**
 * Main function: Automatically publish a report to the report center
 */
export async function autoPublishReport(
  params: PublishReportParams
): Promise<PublishResult> {
  const { reportRunId, userId, forcePublish = false } = params;

  const supabase = createServiceRoleClient();

  // 1. Fetch the report run data
  const { data: reportRun, error: fetchError } = await supabase
    .from("report_runs")
    .select("*")
    .eq("id", reportRunId)
    .single();

  if (fetchError || !reportRun) {
    return {
      published: false,
      reason: "Report run not found",
    };
  }

  const symbol = reportRun.symbol;
  const language = (reportRun.language || "en") as Language;
  const tone = reportRun.mode || "baseline";

  // 2. Check for duplicates (unless force publish)
  if (!forcePublish) {
    const duplicate = await checkDuplicate(symbol, language, 7);

    if (duplicate.exists && duplicate.report) {
      return {
        published: false,
        reason: "Duplicate report exists (within 7 days)",
        existingSlug: duplicate.report.slug,
        url: `/reports/${duplicate.report.slug}`,
      };
    }
  }

  // 3. Fetch report document content
  const { data: reportDoc, error: docError } = await supabase
    .from("report_documents")
    .select("content_markdown, market_data")
    .eq("report_run_id", reportRunId)
    .single();

  if (docError || !reportDoc || !reportDoc.content_markdown) {
    return {
      published: false,
      reason: "Report content not found",
    };
  }

  const content = reportDoc.content_markdown;
  const marketData = reportDoc.market_data || {};

  // 4. Calculate quality score
  const dataFieldCount = countDataFields(marketData);
  const chartCount = countCharts(content);
  const quality = calculateQualityScore(content, dataFieldCount, chartCount);

  // 5. Determine access level
  const accessLevel = determineAccessLevel(quality.total);

  // 6. Generate SEO metadata
  const companyName = marketData?.profile?.name || symbol;
  const industry = categorizeByIndustry(symbol);

  const seoInput: SEOMetaInput = {
    symbol,
    title: reportRun.title || `${symbol} Analysis`,
    content,
    language,
    companyName,
    industry,
  };

  const seoMeta = generateSEOMeta(seoInput);

  // 7. Generate cover image URL (use existing or default)
  const coverUrl = `/reports/covers/${symbol.toLowerCase()}.webp`;

  // 8. Extract tags from content
  const tags = seoMeta.keywords.slice(0, 5);

  // 9. Create report post with complete company data
  const { data: newPost, error: publishError } = await supabase
    .from("report_posts")
    .insert({
      report_run_id: reportRunId,
      user_id: userId || reportRun.user_id,
      slug: seoMeta.slug,
      symbol: symbol.toUpperCase(),
      title: reportRun.title || `${symbol} Investment Analysis`,
      summary: seoMeta.summary,
      body: content,
      cover: coverUrl,
      theme: industry,
      tags,
      language,
      tone,
      status: "published",
      access_level: accessLevel,
      quality_score: quality.total,
      meta_title: seoMeta.metaTitle,
      meta_description: seoMeta.metaDescription,
      meta_keywords: seoMeta.keywords,
      featured: false,
      view_count: 0,
      published_at: new Date().toISOString(),
      company_data: marketData, // Save complete company data for report display
    })
    .select()
    .single();

  if (publishError) {
    console.error("Error publishing report:", publishError);
    return {
      published: false,
      reason: `Database error: ${publishError.message}`,
    };
  }

  // 10. Log quality score for admin reference (no automatic scheduling)
  // NEW STRATEGY: Admins manually select reports for SEO in /admin/reports
  // Quality score helps admins identify high-value reports worth promoting
  console.log(
    `[Publisher] Report published with quality score ${quality.total}/100. ` +
    `Admin can review in /admin/reports to set access level.`
  );

  return {
    published: true,
    slug: seoMeta.slug,
    url: `/reports/${seoMeta.slug}`,
    qualityScore: quality.total, // Return quality score for logging
  };
}

/**
 * @deprecated No longer used - automatic access level upgrades removed
 *
 * **NEW STRATEGY (2025-12-09)**:
 * - Reports default to "pro" access level
 * - Admins manually select reports for SEO (set to "timed-free")
 * - No automatic scheduling needed
 *
 * If you need to restore auto-upgrades in the future, implement with:
 * - Job queue (BullMQ/Inngest)
 * - Scheduled database jobs
 * - Vercel Cron functions
 */
async function scheduleAccessLevelUpgrade(
  postId: string,
  daysDelay: number,
  targetLevel: AccessLevel
): Promise<void> {
  // Deprecated: No longer scheduling automatic upgrades
  console.warn(
    `[Publisher] scheduleAccessLevelUpgrade is deprecated. ` +
    `Admins should manually set access levels in /admin/reports.`
  );
}

/**
 * Manually upgrade a report's access level (called by admin or scheduled job)
 */
export async function upgradeAccessLevel(
  postId: string,
  newLevel: AccessLevel
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("report_posts")
    .update({ access_level: newLevel })
    .eq("id", postId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Bulk publish multiple reports (useful for initial SEO content seeding)
 */
export async function bulkPublishReports(
  reportRunIds: string[]
): Promise<{
  published: number;
  failed: number;
  results: PublishResult[];
}> {
  const results: PublishResult[] = [];
  let published = 0;
  let failed = 0;

  for (const reportRunId of reportRunIds) {
    const result = await autoPublishReport({ reportRunId });

    results.push(result);

    if (result.published) {
      published++;
    } else {
      failed++;
    }
  }

  return { published, failed, results };
}
