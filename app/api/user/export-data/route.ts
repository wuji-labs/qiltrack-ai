import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/error-handler";
import { maskEmail } from "@/lib/utils/validation";

/**
 * GDPR Article 20: Right to Data Portability
 * Export all user data in machine-readable format (JSON)
 *
 * GET /api/user/export-data
 *
 * Returns complete user data archive including:
 * - Profile information
 * - Credit balance and transaction history
 * - Generated reports
 * - Audit logs
 * - Subscription data
 */
export async function GET(request: NextRequest) {
  try {
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    // 1. Authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to export your data" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Use service role client to bypass RLS for complete data export
    const supabaseAdmin = createServiceRoleClient();

    // 2. Collect all user data across tables
    const [
      profileResult,
      creditsResult,
      creditEventsResult,
      dailyRewardResult,
      reportsResult,
      auditLogsResult,
      referralsResult,
    ] = await Promise.all([
      // Profile data
      supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single(),

      // Credit balance
      supabaseAdmin
        .from("report_credits")
        .select("*")
        .eq("user_id", userId)
        .single(),

      // Credit transaction history
      supabaseAdmin
        .from("report_credit_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      // Daily rewards
      supabaseAdmin
        .from("daily_rewards")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),

      // Generated reports
      supabaseAdmin
        // @ts-ignore - reports table not in generated types yet
        .from("reports")
        .select("id, symbol, title, language, tone, report_run_id, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      // Audit logs (user actions)
      supabaseAdmin
        .from("audit_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      // Referral data
      supabaseAdmin
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    // 3. Build comprehensive data export
    const exportData = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        data_format: "JSON",
        gdpr_article: "Article 20 - Right to Data Portability",
        privacy_notice: "This export contains all personal data stored in Qiltrack AI system",
      },
      profile: profileResult.data || null,
      credits: {
        balance: creditsResult.data || null,
        transaction_history: creditEventsResult.data || [],
        transaction_count: creditEventsResult.data?.length || 0,
      },
      daily_rewards: dailyRewardResult.data || null,
      reports: {
        reports: reportsResult.data || [],
        total_count: reportsResult.data?.length || 0,
      },
      activity_logs: {
        logs: auditLogsResult.data || [],
        total_count: auditLogsResult.data?.length || 0,
      },
      referrals: {
        referrals: referralsResult.data || [],
        total_count: referralsResult.data?.length || 0,
      },
    };

    // 4. Log the export request (GDPR compliance - track data access)
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "DATA_EXPORT",
      resource_type: "user_data",
      resource_id: userId,
      details: {
        export_type: "gdpr_full_export",
        records_exported: {
          profile: 1,
          credit_events: creditEventsResult.data?.length || 0,
          reports: reportsResult.data?.length || 0,
          audit_logs: auditLogsResult.data?.length || 0,
          referrals: referralsResult.data?.length || 0,
        },
      },
    });

    console.info(`[GDPR_EXPORT] user_id: ${userId}, email: ${maskEmail(session.user.email || 'unknown')}`);

    // 5. Return JSON export with download headers
    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="qiltrack-data-export-${userId.substring(0, 8)}-${Date.now()}.json"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

    responseCookies.forEach(({ name, value }) =>
      response.headers.append("Set-Cookie", `${name}=${value}`)
    );

    return response;
  } catch (error) {
    console.error("[GDPR_EXPORT_ERROR]", error);
    return handleApiError(error);
  }
}
