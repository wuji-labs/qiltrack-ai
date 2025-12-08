import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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

    // Check if user has claimed today's reward
    const today = new Date().toISOString().split("T")[0];

    const { data: claimData, error: claimError } = await supabase
      .from("credit_transactions" as any)
      .select("id, amount, created_at")
      .eq("user_id", userId)
      .eq("type", "daily_reward")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`)
      .limit(1);

    if (claimError) {
      console.warn(`[DAILY_REWARD_STATUS_ERROR] user_id: ${userId}, error: ${claimError.message}`);
    }

    const hasClaimed = claimData && claimData.length > 0;

    // Get user's membership tier for daily reward amount
    const { data: profileData } = await supabase
      .from("user_profiles" as any)
      .select("membership_tier")
      .eq("user_id", userId)
      .single();

    const tier = (profileData as any)?.membership_tier || "free";

    // Daily reward amounts based on tier
    const dailyRewardAmounts: Record<string, number> = {
      free: 10,
      pro: 30,
      ultra: 60,
    };

    const dailyRewardAmount = dailyRewardAmounts[tier] || 10;

    // Get streak count from user_profiles
    const { data: streakData } = await supabase
      .from("user_profiles" as any)
      .select("daily_streak")
      .eq("user_id", userId)
      .single();

    const streakCount = (streakData as any)?.daily_streak || 0;

    const response = NextResponse.json({
      hasClaimed,
      streakCount,
      dailyRewardAmount,
      tier,
    });

    responseCookies.forEach(({ name, value }) =>
      response.headers.append("Set-Cookie", `${name}=${value}`)
    );
    return response;
  } catch (err) {
    console.error("Daily reward status API error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "internal_error" },
      { status: 500 }
    );
  }
}
