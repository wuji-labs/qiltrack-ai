import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, successResponse } from "@/lib/api/error-handler";

/**
 * POST /api/errors/log
 * Log client-side errors for monitoring and debugging
 */
export async function POST(request: NextRequest) {
  const responseCookies: Array<{
    name: string;
    value: string;
    options?: unknown;
  }> = [];

  try {
    // 1. Parse error data
    const body = await request.json();
    const { error, errorInfo, timestamp, userAgent, url } = body;

    // 2. Optional authentication (log errors even for unauthenticated users)
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id || null;

    // 3. Get client IP address
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // 4. Prepare error log entry
    const errorLog = {
      user_id: userId,
      error_name: error?.name || "Unknown",
      error_message: error?.message || "No message",
      error_stack: error?.stack || null,
      component_stack: errorInfo?.componentStack || null,
      url: url || null,
      user_agent: userAgent || request.headers.get("user-agent") || null,
      ip_address: clientIp,
      timestamp: timestamp || new Date().toISOString(),
      severity: determineSeverity(error?.name),
      environment: process.env.NODE_ENV || "production",
    };

    // 5. Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[CLIENT ERROR]", errorLog);
    }

    // 6. Store in database
    const { error: dbError } = await supabase
      .from("client_error_logs")
      .insert(errorLog);

    if (dbError) {
      console.error("Failed to store error log:", dbError);
      // Don't throw - we still want to return success to client
    }

    // 7. Send to external monitoring service (e.g., Sentry)
    if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
      await sendToSentry(errorLog);
    }

    // 8. Alert on critical errors
    if (errorLog.severity === "critical") {
      await sendCriticalErrorAlert(errorLog);
    }

    return successResponse({
      message: "Error logged successfully",
      logged_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ERROR_LOG_HANDLER_ERROR]", error);
    // Return success even if logging fails - don't break client app
    return NextResponse.json(
      {
        success: true,
        data: { message: "Error received" },
      },
      { status: 200 }
    );
  }
}

/**
 * Determine error severity based on error type
 */
function determineSeverity(errorName?: string): "low" | "medium" | "high" | "critical" {
  if (!errorName) return "medium";

  const criticalErrors = ["ChunkLoadError", "SecurityError", "NetworkError"];
  const highErrors = ["TypeError", "ReferenceError", "SyntaxError"];
  const lowErrors = ["ValidationError", "UserInputError"];

  if (criticalErrors.some((e) => errorName.includes(e))) return "critical";
  if (highErrors.some((e) => errorName.includes(e))) return "high";
  if (lowErrors.some((e) => errorName.includes(e))) return "low";

  return "medium";
}

/**
 * Send error to Sentry (or similar monitoring service)
 */
async function sendToSentry(errorLog: any): Promise<void> {
  try {
    // Example: Send to Sentry API
    // In production, use @sentry/nextjs SDK instead
    if (!process.env.SENTRY_DSN) return;

    await fetch(process.env.SENTRY_DSN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exception: {
          values: [
            {
              type: errorLog.error_name,
              value: errorLog.error_message,
              stacktrace: errorLog.error_stack,
            },
          ],
        },
        user: errorLog.user_id ? { id: errorLog.user_id } : undefined,
        request: {
          url: errorLog.url,
          headers: {
            "User-Agent": errorLog.user_agent,
          },
        },
        timestamp: errorLog.timestamp,
        level: errorLog.severity,
        environment: errorLog.environment,
      }),
    });
  } catch (error) {
    console.error("Failed to send to Sentry:", error);
  }
}

/**
 * Send alert for critical errors
 */
async function sendCriticalErrorAlert(errorLog: any): Promise<void> {
  try {
    // Example: Send email/Slack notification for critical errors
    const alertMessage = `
🚨 Critical Error Detected

Error: ${errorLog.error_name}
Message: ${errorLog.error_message}
URL: ${errorLog.url}
User: ${errorLog.user_id || "Anonymous"}
IP: ${errorLog.ip_address}
Time: ${errorLog.timestamp}

Stack Trace:
${errorLog.error_stack}
    `.trim();

    // Send to monitoring channel
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: alertMessage,
          username: "QilTrack Error Monitor",
          icon_emoji: ":rotating_light:",
        }),
      });
    }

    // Send email to dev team
    if (process.env.ALERT_EMAIL) {
      // TODO: Implement email sending
      console.log("Would send alert email to:", process.env.ALERT_EMAIL);
    }
  } catch (error) {
    console.error("Failed to send critical error alert:", error);
  }
}
