import { createClient } from "@/lib/supabase/server";
import { CreditManager } from "./manager";

/**
 * Daily reward status
 */
export interface DailyRewardStatus {
  canClaim: boolean;
  lastClaimed?: string;
  streakCount: number;
  nextClaimTime?: string;
  rewardAmount: number;
}

/**
 * Rewards Manager handles daily reward and streak logic
 */
export class RewardsManager {
  private creditManager: CreditManager;

  constructor() {
    this.creditManager = new CreditManager();
  }

  /**
   * Check if user can claim daily reward
   *
   * @param userId - User ID to check
   * @returns Daily reward status
   */
  async checkDailyRewardStatus(userId: string): Promise<DailyRewardStatus> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("daily_rewards")
      .select("last_claimed, streak_count")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      // User has never claimed, can claim now
      return {
        canClaim: true,
        streakCount: 0,
        rewardAmount: 10,
      };
    }

    const lastClaimed = new Date(data.last_claimed);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastClaimedDay = new Date(lastClaimed);
    lastClaimedDay.setHours(0, 0, 0, 0);

    const canClaim = lastClaimedDay.getTime() < today.getTime();

    // Calculate next claim time (tomorrow at 00:00)
    const nextClaimTime = new Date(today);
    nextClaimTime.setDate(nextClaimTime.getDate() + 1);

    return {
      canClaim,
      lastClaimed: data.last_claimed,
      streakCount: data.streak_count || 0,
      nextClaimTime: canClaim ? undefined : nextClaimTime.toISOString(),
      rewardAmount: 10,
    };
  }

  /**
   * Claim daily reward
   *
   * @param userId - User ID claiming the reward
   * @returns Result of the claim operation
   */
  async claimDailyReward(userId: string) {
    return await this.creditManager.claimDailyReward(userId);
  }

  /**
   * Get user's reward streak information
   *
   * @param userId - User ID to query
   * @returns Streak information
   */
  async getStreakInfo(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("daily_rewards")
      .select("streak_count, last_claimed, created_at")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return {
        streak_count: 0,
        last_claimed: null,
        total_days: 0,
      };
    }

    // Calculate total days since first reward
    const created = new Date(data.created_at);
    const today = new Date();
    const totalDays = Math.floor(
      (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      streak_count: data.streak_count || 0,
      last_claimed: data.last_claimed,
      total_days: totalDays + 1, // +1 to include the first day
    };
  }
}
