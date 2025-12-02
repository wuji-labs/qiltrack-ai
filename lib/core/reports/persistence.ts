/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { StorageService } from "@/lib/services/storage";
import type { SavedReport } from "./types";
import { v4 as uuidv4 } from "uuid";

/**
 * Report persistence layer handles saving reports to database
 */
export class ReportPersistence {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  /**
   * Save generated report to database
   *
   * @param report - Report content and metadata
   * @param userId - User who generated the report
   * @returns Saved report with ID and slug
   */
  async saveReport(
    report: {
      content: string;
      symbol: string;
      title: string;
      language: string;
      tone: string;
      marketData: any;
    },
    userId: string
  ): Promise<SavedReport> {
    const supabase = await createClient();

    // Generate IDs
    const reportRunId = uuidv4();
    const slug = this.generateSlug(report.symbol, report.language);

    // Upload report JSON to storage
    const storageResult = await this.storageService.uploadReportJson(reportRunId, {
      content: report.content,
      marketData: report.marketData,
      metadata: {
        symbol: report.symbol,
        language: report.language,
        tone: report.tone,
        generatedAt: new Date().toISOString(),
      },
    });

    // Save to database
    const { data, error } = await supabase
      .from("report_posts")
      .insert({
        report_run_id: reportRunId,
        user_id: userId,
        symbol: report.symbol,
        title: report.title,
        slug: slug,
        content: report.content,
        storage_url: storageResult.publicUrl,
        tone: report.tone,
        lang: report.language,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save report: ${error.message}`);
    }

    return {
      id: data.id,
      slug: data.slug,
      report_run_id: reportRunId,
      symbol: data.symbol,
      title: data.title,
      content: data.content,
      cover_url: data.cover_url,
      storage_url: data.storage_url,
      tone: data.tone as any,
      language: data.lang as any,
      created_at: data.created_at,
    };
  }

  /**
   * Check if a report can be reused (within 7 days, same params)
   *
   * @param symbol - Stock symbol
   * @param language - Report language
   * @param tone - Report tone
   * @param userId - User ID
   * @returns Existing report if reusable, null otherwise
   */
  async checkReusableReport(
    symbol: string,
    language: string,
    tone: string,
    userId: string
  ): Promise<SavedReport | null> {
    const supabase = await createClient();

    // Check for reports within last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("report_posts")
      .select("*")
      .eq("user_id", userId)
      .eq("symbol", symbol)
      .eq("lang", language)
      .eq("tone", tone)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      slug: data.slug,
      report_run_id: data.report_run_id,
      symbol: data.symbol,
      title: data.title,
      content: data.content,
      cover_url: data.cover_url,
      storage_url: data.storage_url,
      tone: data.tone as any,
      language: data.lang as any,
      created_at: data.created_at,
    };
  }

  /**
   * Generate slug for report URL
   * @private
   */
  private generateSlug(symbol: string, language: string): string {
    const timestamp = Date.now();
    return `${symbol.toLowerCase()}-${language}-${timestamp}`;
  }

  /**
   * Record audit log for report generation
   */
  async recordAudit(userId: string, action: string, details: Record<string, any>): Promise<void> {
    const supabase = await createClient();

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      table_name: "report_posts",
      details,
    });
  }
}
