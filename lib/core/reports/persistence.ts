/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { StorageService } from "@/lib/services/storage";
import { generateDocxFromMarkdown } from "@/lib/services/docx-generator";
import type { SavedReport } from "./types";
import { v4 as uuidv4 } from "uuid";
import { createServiceRoleClient } from "@/lib/supabase/server";

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
    userId?: string
  ): Promise<SavedReport> {
    const supabase = await createClient();
    const supabaseServiceRole = createServiceRoleClient();

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

    // Generate markdown and docx file paths
    const markdownPath = `reports/${reportRunId}.md`;
    const docxPath = `reports/${reportRunId}.docx`;

    // Upload markdown file to storage
    try {
      await this.storageService.uploadFile(markdownPath, report.content, "text/markdown");
      console.info(`[ReportPersistence] Uploaded markdown file: ${markdownPath}`);
    } catch (err) {
      console.warn(`[ReportPersistence] Failed to upload markdown file:`, err);
    }

    // Generate and upload DOCX file to storage
    try {
      const docxBuffer = await generateDocxFromMarkdown(report.content, report.symbol);
      await this.storageService.uploadFile(docxPath, docxBuffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      console.info(`[ReportPersistence] Uploaded DOCX file: ${docxPath}`);
    } catch (err) {
      console.warn(`[ReportPersistence] Failed to generate or upload DOCX file:`, err);
    }

    // Save to database (report_posts)
    const { data, error } = await supabase
      .from("report_posts")
      .insert({
        report_run_id: reportRunId,
        user_id: userId ?? null,
        symbol: report.symbol,
        title: report.title,
        slug: slug,
        // content: report.content, // Use body field instead
        body: report.content,
        // storage_url: storageResult.publicUrl, // Not in table schema
        tone: report.tone,
        lang: report.language,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save report: ${error.message}`);
    }

    // Create report_runs record for report history tracking
    try {
      const { data: runData, error: runError } = await supabaseServiceRole
        .from("report_runs")
        .insert({
          id: reportRunId,
          user_id: userId ?? null,
          symbol: report.symbol,
          tone: report.tone,
          language: report.language,
          status: "completed",
          markdown_path: markdownPath,
          docx_path: docxPath,
          mode: "production",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (runError) {
        console.error(`[ReportPersistence] Failed to create report_runs record:`, runError);
      } else {
        console.info(`[ReportPersistence] Created report_runs record: ${reportRunId}`);
      }
    } catch (err) {
      console.error(`[ReportPersistence] Error creating report_runs record:`, err);
    }

    return {
      id: data.id,
      slug: data.slug,
      report_run_id: reportRunId,
      symbol: data.symbol ?? report.symbol,
      title: data.title,
      content: data.body ?? data.summary ?? "", // Use body or summary as content
      cover_url: data.cover ?? undefined,
      storage_url: undefined, // Not in schema
      tone: report.tone as any,
      language: data.lang as any,
      created_at: data.created_at ?? new Date().toISOString(),
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
      .not("body", "is", null)
      .not("report_run_id", "is", null)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    const content = (data as any).content ?? data.body ?? data.summary ?? "";
    if (!data.report_run_id || typeof content !== "string" || content.trim().length < 20) {
      return null;
    }

    return {
      id: data.id,
      slug: data.slug,
      report_run_id: (data as any).report_run_id ?? "",
      symbol: (data as any).symbol ?? symbol,
      title: data.title,
      content: (data as any).content ?? data.body ?? data.summary ?? "",
      cover_url: (data as any).cover_url ?? data.cover ?? undefined,
      storage_url: (data as any).storage_url ?? undefined,
      tone: tone as any,
      language: data.lang as any,
      created_at: data.created_at ?? new Date().toISOString(),
    };
  }

  /**
   * Check for a reusable report generated by any user within a given number of days (e.g., same-day reuse)
   */
  async checkSharedReusableReport(
    symbol: string,
    language: string,
    tone: string,
    maxAgeDays: number = 1
  ): Promise<SavedReport | null> {
    const supabase = await createClient();

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (maxAgeDays - 1));

    const { data, error } = await supabase
      .from("report_posts")
      .select("*")
      .eq("symbol", symbol)
      .eq("lang", language)
      .eq("tone", tone)
      .not("body", "is", null)
      .not("report_run_id", "is", null)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    const content = (data as any).content ?? data.body ?? data.summary ?? "";
    if (!data.report_run_id || typeof content !== "string" || content.trim().length < 20) {
      return null;
    }

    return {
      id: data.id,
      slug: data.slug,
      report_run_id: (data as any).report_run_id ?? "",
      symbol: (data as any).symbol ?? symbol,
      title: data.title,
      content: (data as any).content ?? data.body ?? data.summary ?? "",
      cover_url: (data as any).cover_url ?? data.cover ?? undefined,
      storage_url: (data as any).storage_url ?? undefined,
      tone: tone as any,
      language: data.lang as any,
      created_at: data.created_at ?? new Date().toISOString(),
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

    await (supabase as any).from("audit_logs").insert({
      user_id: userId,
      action,
      table_name: "report_posts",
      details,
    });
  }

  /**
   * Load stored market data JSON from storage (if available)
   */
  async getStoredMarketData(reportRunId: string): Promise<any | null> {
    try {
      const supabase = createServiceRoleClient();
      const path = `reports/${reportRunId}.json`;
      const { data, error } = await supabase.storage.from("report-outputs").download(path);
      if (error || !data) return null;
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed?.marketData ?? parsed?.companyData ?? parsed?.data?.companyData ?? null;
    } catch (err) {
      console.warn("[ReportPersistence] failed to load stored market data:", err);
      return null;
    }
  }

  /**
   * Load stored report content from storage (if available)
   */
  async getStoredReportContent(reportRunId: string): Promise<string | null> {
    try {
      if (!reportRunId) {
        console.warn("[ReportPersistence] missing reportRunId when loading stored content");
        return null;
      }

      const supabase = createServiceRoleClient();
      // Try markdown file first (most reliable source)
      const mdPath = `reports/${reportRunId}.md`;
      const { data: mdData, error: mdError } = await supabase.storage.from("report-outputs").download(mdPath);
      if (!mdError && mdData) {
        const text = await mdData.text();
        const trimmed = text.trim();
        if (trimmed) {
          return trimmed;
        }
        console.warn(
          "[ReportPersistence] markdown content empty, falling back to JSON",
          { reportRunId }
        );
      }

      // Fallback to JSON file
      const jsonPath = `reports/${reportRunId}.json`;
      const { data: jsonData, error: jsonError } = await supabase.storage.from("report-outputs").download(jsonPath);
      if (!jsonError && jsonData) {
        const text = await jsonData.text();
        const parsed = JSON.parse(text);
        const content = parsed?.content ?? parsed?.report ?? parsed?.data?.report;
        if (typeof content === "string") {
          const trimmed = content.trim();
          if (trimmed) return trimmed;
        }
      }

      // Fallback: try database columns (content_md / content_html) in report_runs
      const dbContent = await this.getReportContentFromDatabase(reportRunId);
      return dbContent;
    } catch (err) {
      console.warn("[ReportPersistence] failed to load stored report content:", err);
      return null;
    }
  }

  /**
   * Fallback to fetch report content from report_runs table (content_md/html)
   */
  private async getReportContentFromDatabase(reportRunId: string): Promise<string | null> {
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("report_runs")
        .select("content_md, content_html")
        .eq("id", reportRunId as never)
        .single();

      if (error || !data) return null;

      const md = (data as any).content_md;
      if (typeof md === "string" && md.trim()) {
        return md.trim();
      }

      const html = (data as any).content_html;
      if (typeof html === "string" && html.trim()) {
        const text = html
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+\n/g, "\n")
          .trim();
        return text || null;
      }

      return null;
    } catch (err) {
      console.warn("[ReportPersistence] failed to load report content from DB:", err);
      return null;
    }
  }
}
