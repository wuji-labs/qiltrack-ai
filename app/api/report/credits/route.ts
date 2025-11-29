import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    // Check for test bypass (same as /api/report)
    const testToken = process.env.TEST_REPORT_TOKEN || "local-test-token";
    const tokenFromHeader = request.headers.get("x-test-token");
    const tokenFromQuery = new URL(request.url).searchParams.get("testToken");
    const isTestBypass = Boolean(testToken && (tokenFromHeader === testToken || tokenFromQuery === testToken));

    let userId: string | null = null;

    if (!isTestBypass) {
      // Get user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user?.id) {
        const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        responseCookies.forEach(({ name, value }) => response.headers.append("Set-Cookie", `${name}=${value}`));
        return response;
      }

      userId = session.user.id;
    } else {
      // Test mode: use test user ID
      userId = "00000000-0000-0000-0000-000000000001";
    }

    // Query v_user_quota view for real-time remaining credits
    // This view is synced with report_credits table via fn_consume_report_credit
    let quotaData;

    if (isTestBypass) {
      // Test mode: return mock quota
      quotaData = { remaining_credits: 999 };
    } else {
      const { data, error: quotaError } = await supabase
        .from("v_user_quota")
        .select("remaining_credits")
        .eq("user_id", userId)
        .single();

      if (quotaError) {
        console.error("Failed to fetch quota:", quotaError);
        const response = NextResponse.json({ error: "Failed to fetch quota information" }, { status: 500 });
        responseCookies.forEach(({ name, value }) => response.headers.append("Set-Cookie", `${name}=${value}`));
        return response;
      }

      quotaData = data;
    }

    const response = NextResponse.json({
      userId,
      credits: {
        remaining_credits: quotaData?.remaining_credits ?? 0,
      },
    });

    responseCookies.forEach(({ name, value }) => response.headers.append("Set-Cookie", `${name}=${value}`));
    return response;
  } catch (err) {
    console.error("Credits API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
