import { createServiceRoleClient } from "@/lib/supabase/server";
import { StorageService } from "@/lib/services/storage";
import type { SavedReport, ReportTone, Language } from "./types";
import type { Database } from "@/types/database";

type ReportPost = Database['public']['Tables']['report_posts']['Row'];
type ReportPostInsert = Database['public']['Tables']['report_posts']['Insert'];
type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

/**
 * Database error with context
 */
export class DatabaseError extends Error {
  constructor(message: string, public context?: Record<string, unknown>) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Validation error for input parameters
 */
export class ValidationError extends Error {
  constructor(message: string, public context?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Report persistence layer handles saving reports to database
 * Uses type-safe Supabase client with generated database types
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
   * @param userId - User who generated the report (null for test/system reports)
   * @param reportRunId - Unique ID for this report generation run
   * @returns Saved report with ID and slug
   */
  async saveReport(
    report: {
      content: string;
      symbol: string;
      title: string;
      language: string;
      tone: string;
      marketData: unknown;
    },
    userId: string | null,
    reportRunId: string
  ): Promise<SavedReport> {
    // Input validation
    this.validateReportInput(report);

    const supabase = createServiceRoleClient();

    // Generate slug
    const timestamp = Date.now();
    const slug = `${report.symbol.toLowerCase()}-${report.language}-${timestamp}`;

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

    // Prepare insert data with proper types
    const reportPost: ReportPostInsert = {
      report_run_id: reportRunId,
      user_id: userId,
      title: report.title,
      slug,
      body: report.content,
      tone: report.tone,
      language: report.language,
      status: 'draft',
    };

    // Insert report record
    const { data: savedReport, error: insertError } = await supabase
      .from('report_posts')
      .insert(reportPost)
      .select()
      .single();

    if (insertError) {
      throw new DatabaseError('Failed to save report', {
        error: insertError.message,
        code: insertError.code,
        symbol: report.symbol,
      });
    }

    // Record audit log (independent, failure doesn't affect main flow)
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'GENERATE_REPORT',
        resource_type: 'report_posts',
        resource_id: savedReport.id,
        details: {
          symbol: report.symbol,
          tone: report.tone,
          language: report.language,
        },
      });
    } catch (err) {
      console.error('[Audit] Failed to log report generation:', err);
    }

    return {
      id: savedReport.id,
      slug: savedReport.slug,
      report_run_id: savedReport.report_run_id ?? reportRunId,
      symbol: report.symbol,
      title: savedReport.title,
      content: savedReport.body ?? '',
      tone: (savedReport.tone as ReportTone) ?? 'baseline',
      language: (savedReport.language as Language) ?? 'en',
      storage_url: storageResult.publicUrl,
      created_at: savedReport.created_at ?? new Date().toISOString(),
    };
  }

  /**
   * Check if a report can be reused (within 7 days, same params)
   *
   * @param symbol - Stock symbol
   * @param language - Report language
   * @param tone - Report tone
   * @param userId - User ID (null for test reports)
   * @returns Existing report if reusable, null otherwise
   */
  async checkReusableReport(
    symbol: string,
    language: string,
    tone: string,
    userId: string | null
  ): Promise<SavedReport | null> {
    const supabase = createServiceRoleClient();

    // Check for reports within last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Build query to match symbol pattern in slug
    let query = supabase
      .from('report_posts')
      .select('*')
      .like('slug', `${symbol.toLowerCase()}-${language}-%`)
      .eq('tone', tone)
      .eq('status', 'draft')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    // Filter by user if provided
    if (userId !== null) {
      query = query.eq('user_id', userId);
    } else {
      query = query.or('user_id.is.null');
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      slug: data.slug,
      report_run_id: data.report_run_id ?? '',
      symbol,
      title: data.title,
      content: data.body ?? '',
      tone: (data.tone as ReportTone | null) ?? 'baseline',
      language: (data.language as Language | null) ?? 'en',
      created_at: data.created_at ?? new Date().toISOString(),
    };
  }

  /**
   * Record audit log for report operations
   */
  async recordAudit(
    userId: string | null,
    action: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const supabase = createServiceRoleClient();

    const auditDetails: AuditLogInsert['details'] = details as AuditLogInsert['details'];

    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        resource_type: 'report_posts',
        details: auditDetails,
      });
    } catch (err) {
      console.error('[Audit] Failed to record audit log:', err);
    }
  }

  /**
   * Validate report input parameters
   * @throws {ValidationError} If validation fails
   */
  private validateReportInput(report: {
    symbol: string;
    tone: string;
    language: string;
    title: string;
    content: string;
  }): void {
    // Validate symbol format (2-10 uppercase letters)
    const symbolRegex = /^[A-Z]{1,10}$/;
    if (!symbolRegex.test(report.symbol)) {
      throw new ValidationError(
        'Invalid symbol format. Must be 1-10 uppercase letters.',
        { symbol: report.symbol }
      );
    }

    // Validate tone is in allowed values
    const allowedTones: ReportTone[] = ['baseline', 'buffett', 'musk', 'muddy'];
    if (!allowedTones.includes(report.tone as ReportTone)) {
      throw new ValidationError(
        `Invalid tone. Must be one of: ${allowedTones.join(', ')}`,
        { tone: report.tone, allowedTones }
      );
    }

    // Validate language is in allowed values
    const allowedLanguages: Language[] = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko'];
    if (!allowedLanguages.includes(report.language as Language)) {
      throw new ValidationError(
        `Invalid language. Must be one of: ${allowedLanguages.join(', ')}`,
        { language: report.language, allowedLanguages }
      );
    }

    // Validate required fields are non-empty
    if (!report.title || report.title.trim().length === 0) {
      throw new ValidationError('Report title is required');
    }

    if (!report.content || report.content.trim().length === 0) {
      throw new ValidationError('Report content is required');
    }

    // Validate content length (reasonable limits)
    if (report.content.length > 500000) {
      throw new ValidationError(
        'Report content exceeds maximum length of 500KB',
        { contentLength: report.content.length }
      );
    }
  }
}
