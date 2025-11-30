import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    // Check for test bypass (same as /api/report)
    const testToken = process.env.TEST_REPORT_TOKEN || "local-test-token";
    const tokenFromHeader = request.headers.get("x-test-token");
    const tokenFromQuery = new URL(request.url).searchParams.get("testToken");
    const isTestBypass = Boolean(testToken && (tokenFromHeader === testToken || tokenFromQuery === testToken));

    let userId: string | null = null;

    if (!isTestBypass) {
      // Get user session using the same approach as auth callback
      const cookieStore = await cookies();
      const supabase = createRouteHandlerClient<Database>({
        cookies: async () => cookieStore,
      });

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user?.id) {
        console.warn(`[UNAUTHORIZED_SESSION] error: ${sessionError?.message || 'no session'}`);
        return NextResponse.json(
          { error: "Unauthorized", code: "unauthorized" },
          { status: 401 }
        );
      }

      userId = session.user.id;

      // Query report_credits table for real-time remaining credits
      const cookieStoreForQuery = await cookies();
      const supabaseForQuery = createRouteHandlerClient<Database>({
        cookies: async () => cookieStoreForQuery,
      });

      const { data, error: quotaError } = await supabaseForQuery
        .from("report_credits")
        .select("credits_available")
        .eq("user_id", userId as never)
        .single();

      if (quotaError) {
        console.warn(`[QUOTA_FETCH_FAILED] user_id: ${userId}, error: ${quotaError.message}`);
        return NextResponse.json(
          { error: "Failed to fetch quota information", code: "quota_fetch_failed" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        userId,
        credits: {
          remaining_credits: (data as { credits_available: number })?.credits_available ?? 0,
        },
        source: "report_credits",
      });
    } else {
      // Test mode: return mock quota
      userId = "00000000-0000-0000-0000-000000000001";
      return NextResponse.json({
        userId,
        credits: {
          remaining_credits: 999,
        },
        source: "report_credits",
      });
    }
  } catch (err) {
    console.error("Credits API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
