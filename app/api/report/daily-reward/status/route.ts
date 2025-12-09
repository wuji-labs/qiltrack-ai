import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { appendCookies } from "@/lib/utils/cookie-helper";

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
      appendCookies(response, responseCookies);
      return response;
    }

    const userId = session.user.id;

    // Check if user has claimed today's reward
    const today = new Date().toISOString().split("T")[0];

    const { data: claimData, error: claimError } = await supabase
      .from("report_credit_events")
      .select("id, delta, created_at")
      .eq("user_id", userId)
      .eq("event_type", "daily_reward")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`)
      .limit(1);

    if (claimError) {
      console.warn(`[DAILY_REWARD_STATUS_ERROR] user_id: ${userId}, error: ${claimError.message}`);
    }

    const hasClaimed = claimData && claimData.length > 0;

    // Get user's membership tier for daily reward amount
    const { data: profileData } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    const plan = profileData?.plan || "free";

    // Daily reward amounts based on tier
    const dailyRewardAmounts: Record<string, number> = {
      free: 10,
      pro: 30,
      ultra: 60,
    };

    const dailyRewardAmount = dailyRewardAmounts[plan] || 10;

    // Get streak count from daily_rewards table
    const { data: streakData } = await supabase
      .from("daily_rewards")
      .select("streak_count")
      .eq("user_id", userId)
      .single();

    const streakCount = streakData?.streak_count || 0;

    const response = NextResponse.json({
      hasClaimed,
      streakCount,
      dailyRewardAmount,
      tier: plan,
    });

    appendCookies(response, responseCookies);
    return response;
  } catch (err) {
    console.error("Daily reward status API error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "internal_error" },
      { status: 500 }
    );
  }
}
