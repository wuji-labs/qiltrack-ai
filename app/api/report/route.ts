export const runtime = "nodejs";
// Vercel Pro allows up to 300s (5 min), Hobby plan is limited to 10s
// LLM report generation typically takes 60-150 seconds
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { CreditManager } from "@/lib/core/credits/manager";
import { ReportGenerator } from "@/lib/core/reports/generator";
import { ReportPersistence } from "@/lib/core/reports/persistence";
import { EmbeddingsManager } from "@/lib/core/reports/embeddings";
import { ContentSanitizer } from "@/lib/core/reports/content-sanitizer";
import { handleApiError, successResponse } from "@/lib/api/error-handler";
import { UnauthorizedError, InsufficientCreditsError, ValidationError } from "@/lib/core/errors";
import { DEFAULT_LANGUAGE, type Language } from "@/lib/i18n-config";
import type { ReportTone } from "@/lib/core/reports/types";
import { reportGenerationRateLimit, checkRateLimit } from "@/lib/api/rate-limit";

/**
 * Check for test bypass token
 * SECURITY: Only enabled in development environment with explicit token
 */
function checkTestBypass(request: NextRequest): boolean {
  // Only allow test bypass in development
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const testToken = process.env.TEST_REPORT_TOKEN;
  if (!testToken) {
    return false;
  }

  const tokenFromHeader = request.headers.get("x-test-token");
  const tokenFromQuery = new URL(request.url).searchParams.get("testToken");

  const isValid = tokenFromHeader === testToken || tokenFromQuery === testToken;

  if (isValid) {
    console.warn("[REPORT_API] Test bypass activated - development mode only");
  }

  return isValid;
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

    let userId: string | null = null;

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

    // Validate symbol length to prevent abuse
    if (symbol.length > 10) {
      throw new ValidationError("Invalid symbol: too long (max 10 characters)");
    }

    const sanitizer = new ContentSanitizer();
    const language = sanitizer.normalizeLanguage(searchParams.get("lang"));
    const tone = (searchParams.get("tone") || "baseline") as ReportTone;

    // 3. Rate limiting check (skip in test mode)
    if (!isTestBypass && userId) {
      const { success, headers } = await checkRateLimit(
        userId!,
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

    const persistence = new ReportPersistence();

    // 4. Check for reusable report (within 7 days)
    if (!isTestBypass && userId) {
      const existingReport = await persistence.checkReusableReport(symbol, language, tone, userId);

      if (existingReport) {
        console.info(
          `[REPORT_REUSED] user_id: ${userId}, symbol: ${symbol}, report_id: ${existingReport.id}`
        );

        // Load full content from storage (fallback to database content if storage fails)
        const storedContent = existingReport.report_run_id
          ? await persistence.getStoredReportContent(existingReport.report_run_id)
          : null;
        const reportContent = (storedContent && storedContent.trim()) || existingReport.content;

        // If content is empty or too short, skip reuse and regenerate
        if (!reportContent || reportContent.trim().length < 100) {
          console.warn("[REPORT_REUSE_EMPTY_CONTENT] Content empty or too short, will regenerate", {
            userId,
            symbol,
            reportId: existingReport.id,
            reportRunId: existingReport.report_run_id,
            contentLength: reportContent?.length || 0,
          });
          // Fall through to generate a new report
        } else {
          // For consistency, load stored market data from Storage JSON instead of refetching live data
          const storedMarketData =
            (existingReport.report_run_id
              ? await persistence.getStoredMarketData(existingReport.report_run_id)
              : null) || null;
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
    }

    // 4.1 Shared reuse for other/new users: only reuse same-day reports
    if (isTestBypass || !userId) {
      const sharedReport = await persistence.checkSharedReusableReport(symbol, language, tone, 1);
      if (sharedReport) {
        console.info(
          `[REPORT_REUSED_SHARED] symbol: ${symbol}, report_id: ${sharedReport.id}, run_id: ${sharedReport.report_run_id}`
        );

        // Load full content from storage (fallback to database content if storage fails)
        const storedContent = sharedReport.report_run_id
          ? await persistence.getStoredReportContent(sharedReport.report_run_id)
          : null;
        const reportContent = (storedContent && storedContent.trim()) || sharedReport.content;

        // If content is empty or too short, skip reuse and regenerate
        if (!reportContent || reportContent.trim().length < 100) {
          console.warn("[REPORT_REUSE_EMPTY_CONTENT_SHARED] Content empty or too short, will regenerate", {
            symbol,
            reportId: sharedReport.id,
            reportRunId: sharedReport.report_run_id,
            contentLength: reportContent?.length || 0,
          });
          // Fall through to generate a new report
        } else {
          const storedMarketData =
            (sharedReport.report_run_id
              ? await persistence.getStoredMarketData(sharedReport.report_run_id)
              : null) || null;
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
    }

    // 4.2 Check for cross-user reusable report (same day, silent reuse - save tokens)
    // This runs for authenticated users to check if another user already generated this report today
    if (!isTestBypass && userId) {
      const sharedReport = await persistence.checkSharedReusableReport(symbol, language, tone, 1);
      if (sharedReport) {
        console.info(
          `[REPORT_REUSED_CROSS_USER] user_id: ${userId}, symbol: ${symbol}, original_report_id: ${sharedReport.id}`
        );

        // Load full content from storage (fallback to database content if storage fails)
        const storedContent = sharedReport.report_run_id
          ? await persistence.getStoredReportContent(sharedReport.report_run_id)
          : null;
        const reportContent = (storedContent && storedContent.trim()) || sharedReport.content;

        // Only use cross-user reuse if content is substantial (100+ chars)
        if (reportContent && reportContent.trim().length >= 100) {
          const storedMarketData =
            (sharedReport.report_run_id
              ? await persistence.getStoredMarketData(sharedReport.report_run_id)
              : null) || null;
          const companyData =
            storedMarketData ?? {
              symbol,
              profile: {},
              quote: {},
              metrics: {},
              recentNews: [],
            };

          // For cross-user reuse, we still consume credits (user pays for viewing, but we save LLM costs)
          const creditManager = new CreditManager();
          const REPORT_CREDIT_COST = 30;

          // Check balance first
          const balance = await creditManager.getBalance(userId);
          if (balance.credits_available < REPORT_CREDIT_COST) {
            throw new InsufficientCreditsError(
              `积分不足，需要 ${REPORT_CREDIT_COST} 积分，当前余额 ${balance.credits_available} 积分`
            );
          }

          // Consume credit
          await creditManager.checkAndConsume(userId, REPORT_CREDIT_COST, symbol);
          console.info(`[CREDIT_CONSUMED_CROSS_USER_REUSE] user_id: ${userId}, symbol: ${symbol}, credits: ${REPORT_CREDIT_COST}`);

          // Return the reused report (looks like a fresh generation to user - no reuse hint)
          const response = successResponse({
            symbol: sharedReport.symbol,
            report: reportContent,
            companyData,
            reportRunId: sharedReport.report_run_id,
            reused: false, // Silent reuse - don't tell the user
          });

          responseCookies.forEach(({ name, value }) => {
            response.headers.append("Set-Cookie", `${name}=${value}`);
          });

          return response;
        }
      }
    }

    // 5. Check credits BEFORE generating report (important: prevent LLM costs if insufficient credits)
    if (!isTestBypass && userId) {
      const creditManager = new CreditManager();
      const REPORT_CREDIT_COST = 30;

      // Check balance first - BEFORE calling LLM
      const balance = await creditManager.getBalance(userId);

      if (balance.credits_available < REPORT_CREDIT_COST) {
        throw new InsufficientCreditsError(
          `积分不足，需要 ${REPORT_CREDIT_COST} 积分，当前余额 ${balance.credits_available} 积分`
        );
      }
    }

    // 6. Generate report using new service layer
    const generator = new ReportGenerator();

    const generatedReport = await generator.generate({
      symbol,
      language,
      tone,
      userId: userId ?? undefined,
      metadata: {
        isTest: isTestBypass,
      },
    });

    // 7. Consume credits AFTER successful generation
    if (!isTestBypass && userId) {
      const creditManager = new CreditManager();
      const REPORT_CREDIT_COST = 30;

      // Consume credit atomically ONLY after successful generation
      // 每份报告固定扣除30积分
      await creditManager.checkAndConsume(userId, REPORT_CREDIT_COST, symbol);
      console.info(`[CREDIT_CONSUMED] user_id: ${userId}, symbol: ${symbol}, credits: ${REPORT_CREDIT_COST}`);
    }

    const companyData =
      generatedReport.marketData ?? {
        symbol,
        profile: {},
        quote: {},
        metrics: {},
        recentNews: [],
      };

    // 8. Extract title from report (first # line)
    const titleMatch = generatedReport.content.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] || `Investment Analysis Report: ${symbol} (${language})`;

    // 9. Save report to database
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

    // 10. Record audit log
    if (userId) {
      await persistence.recordAudit(userId, "GENERATE_REPORT", {
        symbol,
        language,
        tone,
        report_id: savedReport.id,
        report_run_id: savedReport.report_run_id,
      });
    }

    // 11. Generate embeddings in background (non-blocking)
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

    // 12. Return success response
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
