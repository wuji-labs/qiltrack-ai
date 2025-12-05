import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";

// 默认初始积分
const DEFAULT_INITIAL_CREDITS = 60;

export async function GET(request: NextRequest) {
  try {
    // Check for test bypass (same as /api/report)
    const testToken = process.env.TEST_REPORT_TOKEN || "local-test-token";
    const tokenFromHeader = request.headers.get("x-test-token");
    const tokenFromQuery = new URL(request.url).searchParams.get("testToken");
    const isTestBypass = Boolean(
      testToken && (tokenFromHeader === testToken || tokenFromQuery === testToken)
    );

    let userId: string | null = null;

    if (!isTestBypass) {
      // Get user session using @supabase/ssr
      const cookieStore = await cookies();
      const supabase = createServerClient(cookieStore);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        console.warn(`[UNAUTHORIZED_SESSION] error: ${authError?.message || "no session"}`);
        // 友好地返回0积分，而不是401错误
        return NextResponse.json({
          userId: null,
          credits: {
            remaining_credits: 0,
          },
          source: "report_credits",
          authenticated: false,
        });
      }

      userId = user.id;

      // 使用 service role 查询积分（绕过 RLS）
      const supabaseAdmin = createServiceRoleClient();
      const { data, error: quotaError } = await supabaseAdmin
        .from("report_credits")
        .select("credits_available")
        .eq("user_id", userId)
        .maybeSingle();

      if (quotaError) {
        console.warn(`[QUOTA_FETCH_FAILED] user_id: ${userId}, error: ${quotaError.message}`);
        return NextResponse.json(
          { error: "Failed to fetch quota information", code: "quota_fetch_failed" },
          { status: 500 }
        );
      }

      // If no credits record exists, create one with default credits
      if (!data) {
        const { error: insertError } = await supabaseAdmin
          .from("report_credits")
          .insert({
            user_id: userId,
            credits_available: DEFAULT_INITIAL_CREDITS,
            credits_total: DEFAULT_INITIAL_CREDITS,
          });

        if (insertError) {
          console.warn(`[CREDITS_INIT_FAILED] user_id: ${userId}, error: ${insertError.message}`);
        }

        return NextResponse.json({
          userId,
          credits: {
            remaining_credits: DEFAULT_INITIAL_CREDITS,
          },
          source: "report_credits",
        });
      }

      return NextResponse.json({
        userId,
        credits: {
          remaining_credits: data.credits_available ?? 0,
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
    // 即使出错也返回友好的响应
    return NextResponse.json({
      userId: null,
      credits: {
        remaining_credits: 0,
      },
      source: "report_credits",
      error: "Internal server error",
    }, { status: 500 });
  }
}
