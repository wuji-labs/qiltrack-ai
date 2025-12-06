import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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
      const response = NextResponse.json(
        { error: "Unauthorized", code: "unauthorized" },
        { status: 401 }
      );
      responseCookies.forEach(({ name, value }) =>
        response.headers.append("Set-Cookie", `${name}=${value}`)
      );
      return response;
    }

    const userId = session.user.id;

    // Call fn_claim_daily_reward function
    const { data, error } = await supabase.rpc(
      "fn_claim_daily_reward" as never,
      {
        p_user_id: userId,
      } as never
    );

    if (error) {
      console.warn(`[DAILY_REWARD_ERROR] user_id: ${userId}, error: ${error.message}`);
      const response = NextResponse.json(
        { error: "Failed to claim daily reward", code: "reward_claim_failed" },
        { status: 500 }
      );
      responseCookies.forEach(({ name, value }) =>
        response.headers.append("Set-Cookie", `${name}=${value}`)
      );
      return response;
    }

    const response = NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      success: (data as any)?.[0]?.success ?? false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message: (data as any)?.[0]?.message ?? "Unknown error",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      remainingCredits: (data as any)?.[0]?.remaining_credits ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      streakCount: (data as any)?.[0]?.streak_count ?? 0,
    });

    responseCookies.forEach(({ name, value }) =>
      response.headers.append("Set-Cookie", `${name}=${value}`)
    );
    return response;
  } catch (err) {
    console.error("Daily reward API error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "internal_error" },
      { status: 500 }
    );
  }
}
