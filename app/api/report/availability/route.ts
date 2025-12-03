import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/report/availability
 * Check if a reusable report exists within the 7-day window
 *
 * Query params:
 * - symbol: Stock symbol (required)
 * - lang: Language code (optional, default: 'en')
 * - mode: Report tone/mode (optional, default: 'production')
 *
 * Returns:
 * - reusable_run_id: UUID of the reusable report (if found)
 * - created_at: When the report was created
 * - symbol, lang, mode: Echo back for confirmation
 */
export async function GET(request: NextRequest) {
  try {
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];

    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const symbol = (searchParams.get("symbol") || "").toUpperCase().trim();
    const lang = searchParams.get("lang") || "en";
    const mode = searchParams.get("mode") || "production";

    if (!symbol) {
      const response = NextResponse.json({ error: "Missing symbol parameter" }, { status: 400 });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    // Call the database function to find reusable report
    const { data, error } = await supabase.rpc("fn_find_reusable_report", {
      p_symbol: symbol,
      p_lang: lang,
      p_mode: mode,
    });

    if (error) {
      console.error("Failed to check report availability:", error);
      const response = NextResponse.json(
        { error: "Failed to check report availability" },
        { status: 500 }
      );
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    // Check if the reusable report belongs to the current user
    const reusableReport = data && data.length > 0 ? data[0] : null;

    if (reusableReport) {
      // Verify ownership
      const { data: runData, error: runError } = await supabase
        .from("report_runs")
        .select("user_id")
        .eq("id", reusableReport.report_run_id)
        .single();

      if (runError || !runData) {
        const response = NextResponse.json({
          reusable: false,
          reusable_run_id: null,
          created_at: null,
          symbol,
          lang,
          mode,
          is_own_report: false,
        });
        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });
        return response;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isOwnReport = (runData as any).user_id === userId;

      const response = NextResponse.json({
        reusable: true,
        reusable_run_id: reusableReport.report_run_id,
        created_at: reusableReport.created_at,
        symbol: reusableReport.symbol,
        lang: reusableReport.lang,
        mode: reusableReport.tone,
        is_own_report: isOwnReport,
      });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    // No reusable report found
    const response = NextResponse.json({
      reusable: false,
      reusable_run_id: null,
      created_at: null,
      symbol,
      lang,
      mode,
      is_own_report: false,
    });
    responseCookies.forEach(({ name, value }) => {
      response.headers.append("Set-Cookie", `${name}=${value}`);
    });
    return response;
  } catch (err) {
    console.error("Report availability error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
