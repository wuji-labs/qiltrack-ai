/**
 * SEO Report Recommender (formerly Access Level Upgrader)
 *
 * **NEW STRATEGY (2025-12-09)**:
 * - Reports default to "pro" access level (protected content)
 * - This module helps admins identify high-quality reports for SEO promotion
 * - Admins manually select reports to set as "timed-free" for Google indexing
 *
 * Features:
 * - Recommend Pro reports suitable for SEO based on quality score
 * - Analyze timed-free report performance (traffic, conversions)
 * - Identify underperforming timed-free reports to restore to Pro
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

export type UpgradeResult = {
  processedCount: number;
  upgradedCount: number;
  upgrades: Array<{
    id: string;
    slug: string;
    oldLevel: string;
    newLevel: string;
    qualityScore: number;
  }>;
  errors: Array<{
    id: string;
    error: string;
  }>;
};

/**
 * Calculates quality score for a report
 * Matches the scoring algorithm in publisher.ts
 */
function calculateQualityScore(params: {
  contentLength: number;
  viewCount: number;
  featured: boolean;
}): number {
  let score = 0;

  // Content quality (0-40 points)
  const contentScore = Math.min(params.contentLength / 100, 40);
  score += contentScore;

  // Engagement metrics (0-40 points)
  const viewScore = Math.min(params.viewCount / 10, 30);
  score += viewScore;

  // Featured bonus (20 points)
  if (params.featured) {
    score += 20;
  }

  return Math.round(score);
}

/**
 * Determines target access level based on quality score
 */
function determineAccessLevel(score: number): "timed-free" | "pro" | "ultra" {
  if (score >= 80) return "ultra";
  if (score >= 60) return "pro";
  return "timed-free";
}

/**
 * Recommend Pro reports that are good candidates for SEO promotion
 *
 * Returns high-quality "pro" reports that admins might want to set as "timed-free"
 * for Google SEO traffic acquisition
 *
 * Selection criteria:
 * - Status: published
 * - Access level: pro (candidates for SEO)
 * - Quality score: >= 70
 * - Content length: >= 2000 characters
 * - Not already timed-free
 */
export async function recommendReportsForSEO(limit = 20): Promise<{
  recommended: Array<{
    id: string;
    slug: string;
    symbol: string;
    title: string;
    qualityScore: number;
    viewCount: number;
    publishedAt: string;
    reason: string;
  }>;
}> {
  const supabase = createServiceRoleClient();

  const { data: candidates, error } = await supabase
    .from("report_posts")
    .select("id, slug, symbol, title, content, view_count, featured, published_at, language")
    .eq("status", "published")
    .eq("access_level", "pro")
    .order("published_at", { ascending: false })
    .limit(100); // Get more candidates, then filter and score

  if (error) {
    console.error("Error fetching SEO candidates:", error);
    return { recommended: [] };
  }

  const recommendations = (candidates || [])
    .map(report => {
      const qualityScore = calculateQualityScore({
        contentLength: report.content?.length || 0,
        viewCount: report.view_count || 0,
        featured: report.featured || false,
      });

      // Determine recommendation reason
      let reason = "";
      if (qualityScore >= 85) {
        reason = "Excellent quality - strong SEO potential";
      } else if (qualityScore >= 75) {
        reason = "High quality - good for long-tail keywords";
      } else if (report.view_count > 100) {
        reason = "Popular internally - likely to perform well";
      } else {
        reason = "Moderate quality - consider for niche keywords";
      }

      return {
        id: report.id,
        slug: report.slug,
        symbol: report.symbol || "",
        title: report.title,
        qualityScore,
        viewCount: report.view_count || 0,
        publishedAt: report.published_at,
        reason,
      };
    })
    .filter(r => r.qualityScore >= 70) // Filter by quality
    .sort((a, b) => b.qualityScore - a.qualityScore) // Sort by quality
    .slice(0, limit);

  return { recommended: recommendations };
}

/**
 * @deprecated - Old automatic upgrade function no longer used
 * Keeping for backwards compatibility, but returns empty result
 */
export async function upgradeEligibleReports(): Promise<UpgradeResult> {
  const supabase = createServiceRoleClient();

  console.warn(
    "[upgradeEligibleReports] This function is deprecated. " +
    "Automatic access level upgrades have been disabled. " +
    "Use recommendReportsForSEO() instead to get manual recommendations."
  );

  // Return empty result - no automatic upgrades performed
  return {
    processedCount: 0,
    upgradedCount: 0,
    upgrades: [],
    errors: [],
  };
}

/**
 * Analyze timed-free report performance for SEO insights
 *
 * Returns metrics on currently published timed-free reports to help admins
 * decide which should stay public vs. be restored to pro
 */
export async function analyzeTimedFreePerformance(): Promise<{
  reports: Array<{
    id: string;
    slug: string;
    symbol: string;
    publishedAt: string;
    qualityScore: number;
    viewCount: number;
    organicVisits: number; // Future: from Google Analytics
    conversionRate: number; // Future: calculated from conversions
    recommendation: "keep_public" | "restore_to_pro" | "monitor";
    reason: string;
  }>;
}> {
  const supabase = createServiceRoleClient();

  const { data: timedFreeReports, error } = await supabase
    .from("report_posts")
    .select("id, slug, symbol, content, view_count, featured, published_at, organic_visits, conversion_rate")
    .eq("status", "published")
    .eq("access_level", "timed-free")
    .order("published_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error analyzing timed-free reports:", error);
    return { reports: [] };
  }

  const reports = (timedFreeReports || []).map(report => {
    const qualityScore = calculateQualityScore({
      contentLength: report.content?.length || 0,
      viewCount: report.view_count || 0,
      featured: report.featured || false,
    });

    const organicVisits = report.organic_visits || 0;
    const conversionRate = report.conversion_rate || 0;

    // Determine recommendation
    let recommendation: "keep_public" | "restore_to_pro" | "monitor" = "monitor";
    let reason = "";

    if (organicVisits > 1000 && conversionRate > 0.05) {
      recommendation = "keep_public";
      reason = "High traffic & conversion - excellent SEO performer";
    } else if (organicVisits < 50 && qualityScore > 85) {
      recommendation = "restore_to_pro";
      reason = "High quality but low SEO traffic - better as premium content";
    } else if (conversionRate > 0.1) {
      recommendation = "keep_public";
      reason = "High conversion rate - valuable for user acquisition";
    } else {
      recommendation = "monitor";
      reason = "Moderate performance - review in 30 days";
    }

    return {
      id: report.id,
      slug: report.slug,
      symbol: report.symbol || "",
      publishedAt: report.published_at,
      qualityScore,
      viewCount: report.view_count || 0,
      organicVisits,
      conversionRate,
      recommendation,
      reason,
    };
  });

  return { reports };
}

/**
 * @deprecated - Use analyzeTimedFreePerformance() instead
 */
export async function previewUpgrades(): Promise<{
  eligible: Array<{
    id: string;
    slug: string;
    publishedAt: string;
    currentLevel: string;
    projectedLevel: string;
    qualityScore: number;
  }>;
}> {
  console.warn(
    "[previewUpgrades] This function is deprecated. " +
    "Use analyzeTimedFreePerformance() for SEO performance insights."
  );

  return { eligible: [] };
}
