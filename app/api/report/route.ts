export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { CreditManager } from "@/lib/core/credits/manager";
import { ReportGenerator } from "@/lib/core/reports/generator";
import { ReportPersistence } from "@/lib/core/reports/persistence";
import { EmbeddingsManager } from "@/lib/core/reports/embeddings";
import { ContentSanitizer } from "@/lib/core/reports/content-sanitizer";
import { MarketDataService } from "@/lib/services/market-data";
import { handleApiError, successResponse } from "@/lib/api/error-handler";
import { UnauthorizedError, InsufficientCreditsError, ValidationError } from "@/lib/core/errors";
import { DEFAULT_LANGUAGE, type Language } from "@/lib/i18n-config";
import type { ReportTone } from "@/lib/core/reports/types";
import { reportGenerationRateLimit, checkRateLimit } from "@/lib/api/rate-limit";

/**
 * Check for test bypass token
 */
function checkTestBypass(request: NextRequest): boolean {
  const testToken = process.env.TEST_REPORT_TOKEN || "local-test-token";
  const tokenFromHeader = request.headers.get("x-test-token");
  const tokenFromQuery = new URL(request.url).searchParams.get("testToken");
  return Boolean(testToken && (tokenFromHeader === testToken || tokenFromQuery === testToken));
}

/**
 * Generate investment report
 * GET /api/report?symbol=AAPL&lang=en&tone=baseline
 */
export async function GET(request: NextRequest) {
  const isTestBypass = checkTestBypass(request);

  // Collect response cookies
  const responseCookies: Array<{
    name: string;
    value: string;
    options?: unknown;
  }> = [];

  try {
    // 1. Authentication
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    let userId: string | null;

    if (!isTestBypass) {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user?.id) {
        throw new UnauthorizedError("Session not found or expired");
      }

      userId = session.user.id;
    } else {
      // Test mode - use deterministic UUID
      userId = null;
    }

    // 2. Parse and validate parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol")?.toUpperCase().trim();

    if (!symbol) {
      throw new ValidationError("Missing required parameter: symbol");
    }

    const sanitizer = new ContentSanitizer();
    const language = sanitizer.normalizeLanguage(searchParams.get("lang"));
    const tone = (searchParams.get("tone") || "baseline") as ReportTone;

    // 3. Rate limiting check (skip in test mode)
    if (!isTestBypass) {
      const { success, headers } = await checkRateLimit(
        userId,
        reportGenerationRateLimit
      );

      if (!success) {
        const response = NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "请求过于频繁，请稍后再试",
            },
          },
          { status: 429, headers }
        );

        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });

        return response;
      }

      // Add rate limit headers to response cookies for later use
      Object.entries(headers).forEach(([key, value]) => {
        responseCookies.push({ name: key, value });
      });
    }

    // 4. Check for reusable report (within 7 days)
    if (!isTestBypass && userId) {
      const persistence = new ReportPersistence();
      const existingReport = await persistence.checkReusableReport(symbol, language, tone, userId);

      if (existingReport) {
        console.info(
          `[REPORT_REUSED] user_id: ${userId}, symbol: ${symbol}, report_id: ${existingReport.id}`
        );

        // Load full content from storage (fallback to database content if storage fails)
        const storedContent = await persistence.getStoredReportContent(existingReport.report_run_id);
        const reportContent = storedContent || existingReport.content;

        // For consistency, load stored market data from Storage JSON instead of refetching live data
        const storedMarketData =
          (await persistence.getStoredMarketData(existingReport.report_run_id)) || null;
        const companyData =
          storedMarketData ?? {
            symbol,
            profile: {},
            quote: {},
            metrics: {},
            recentNews: [],
          };

        const response = successResponse({
          symbol: existingReport.symbol,
          report: reportContent,
          companyData,
          reportRunId: existingReport.report_run_id,
          reused: true,
          message: "Using existing report from the last 7 days",
        });

        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });

        return response;
      }
    }

    // 4.1 Shared reuse for other/new users: only reuse same-day reports
    if (isTestBypass || !userId) {
      const persistence = new ReportPersistence();
      const sharedReport = await persistence.checkSharedReusableReport(symbol, language, tone, 1);
      if (sharedReport) {
        console.info(
          `[REPORT_REUSED_SHARED] symbol: ${symbol}, report_id: ${sharedReport.id}, run_id: ${sharedReport.report_run_id}`
        );

        // Load full content from storage (fallback to database content if storage fails)
        const storedContent = await persistence.getStoredReportContent(sharedReport.report_run_id);
        const reportContent = storedContent || sharedReport.content;

        const storedMarketData =
          (await persistence.getStoredMarketData(sharedReport.report_run_id)) || null;
        const companyData =
          storedMarketData ?? {
            symbol,
            profile: {},
            quote: {},
            metrics: {},
            recentNews: [],
          };
        const response = successResponse({
          symbol: sharedReport.symbol,
          report: reportContent,
          companyData,
          reportRunId: sharedReport.report_run_id,
          reused: true,
          message: "Using existing report from today",
        });

        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });

        return response;
      }
    }

    // 5. Check and consume credits
    if (!isTestBypass) {
      const creditManager = new CreditManager();

      // Check balance first
      const balance = await creditManager.getBalance(userId);

      if (balance.credits_available <= 0) {
        throw new InsufficientCreditsError(
          `Insufficient credits. Available: ${balance.credits_available}`
        );
      }

      // Consume credit atomically
      await creditManager.checkAndConsume(userId, 1, symbol);
      console.info(`[CREDIT_CONSUMED] user_id: ${userId}, symbol: ${symbol}`);
    }

    // 6. Generate report using new service layer
    const generator = new ReportGenerator();

    const generatedReport = await generator.generate({
      symbol,
      language,
      tone,
      userId,
      metadata: {
        isTest: isTestBypass,
      },
    });

    const companyData =
      generatedReport.marketData ?? {
        symbol,
        profile: {},
        quote: {},
        metrics: {},
        recentNews: [],
      };

    // 7. Extract title from report (first # line)
    const titleMatch = generatedReport.content.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] || `Investment Analysis Report: ${symbol} (${language})`;

    // 8. Save report to database
    const persistence = new ReportPersistence();

    const savedReport = await persistence.saveReport(
      {
        content: generatedReport.content,
        symbol,
        title,
        language,
        tone,
        marketData: generatedReport.marketData,
      },
      userId ?? undefined
    );

    // 9. Record audit log
    if (userId) {
      await persistence.recordAudit(userId, "GENERATE_REPORT", {
        symbol,
        language,
        tone,
        report_id: savedReport.id,
        report_run_id: savedReport.report_run_id,
      });
    }

    // 10. Generate embeddings in background (non-blocking)
    if (!isTestBypass && savedReport.report_run_id) {
      const embeddingsManager = new EmbeddingsManager();
      // Fire and forget
      embeddingsManager
        .generateEmbeddings(savedReport.report_run_id, generatedReport.content, language, tone)
        .catch((err) => {
          console.warn("Background embedding generation failed:", err);
        });
    }

    console.info(
      `[REPORT_GENERATED] user_id: ${userId}, symbol: ${symbol}, report_id: ${savedReport.id}`
    );

    // 11. Return success response
    const response = successResponse({
      symbol,
      report: generatedReport.content,
      companyData,
      reportRunId: savedReport.report_run_id,
      reused: false,
      metadata: generatedReport.metadata,
    });

    responseCookies.forEach(({ name, value }) => {
      response.headers.append("Set-Cookie", `${name}=${value}`);
    });

    return response;
  } catch (error) {
    console.error("[REPORT_GENERATION_ERROR]", error);

    const errorResponse = handleApiError(error);

    responseCookies.forEach(({ name, value }) => {
      errorResponse.headers.append("Set-Cookie", `${name}=${value}`);
    });

    return errorResponse;
  }
}
