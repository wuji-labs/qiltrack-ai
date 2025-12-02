/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { InsufficientCreditsError, UnauthorizedError } from "../errors";

/**
 * Credit transaction metadata
 */
export interface CreditTransaction {
  id: string;
  user_id: string;
  event_type: "consumed" | "granted" | "daily_reward";
  credits_amount: number;
  reason?: string;
  metadata?: Record<string, any>;
  delta: number;
  created_at: string;
}

/**
 * Credit balance information
 */
export interface CreditBalance {
  credits_available: number;
  credits_used: number;
  last_updated: string;
}

/**
 * Credit operation result
 */
export interface CreditOperationResult {
  success: boolean;
  remaining_credits: number;
  message?: string;
}

/**
 * Credit Manager handles all credit-related operations
 *
 * @example
 * ```typescript
 * const manager = new CreditManager();
 *
 * // Check and consume credits
 * await manager.checkAndConsume(userId, 1);
 *
 * // Get balance
 * const balance = await manager.getBalance(userId);
 *
 * // Grant credits (admin only)
 * await manager.grantCredits(adminId, targetUserId, 10, "Bonus");
 * ```
 */
export class CreditManager {
  /**
   * Check and consume credits atomically
   *
   * @param userId - User ID to consume credits from
   * @param amount - Number of credits to consume (default: 1)
   * @param symbol - Optional stock symbol for tracking
   * @param metadata - Optional metadata for the transaction
   * @throws {InsufficientCreditsError} When user doesn't have enough credits
   */
  async checkAndConsume(
    userId: string,
    amount: number = 1,
    symbol?: string,
    metadata?: Record<string, any>
  ): Promise<CreditOperationResult> {
    const supabase = await createClient();

    if (amount === 1) {
      // Use optimized single-credit consumption
      const { data, error } = await supabase.rpc("fn_consume_report_credit", {
        p_user_id: userId,
        p_symbol: symbol,
        p_metadata: metadata ? metadata : null,
      });

      if (error) {
        throw new Error(`Failed to consume credit: ${error.message}`);
      }

      if (!data || data.length === 0 || !data[0]?.success) {
        throw new InsufficientCreditsError("积分不足，无法生成报告");
      }

      return {
        success: true,
        remaining_credits: data[0].remaining_credits || 0,
      };
    } else {
      // Use batch consumption for multiple credits
      const { data, error } = await supabase.rpc("fn_consume_report_credit", {
        p_user_id: userId,
        p_cost: amount,
      });

      if (error) {
        throw new Error(`Failed to consume credits: ${error.message}`);
      }

      if (!data || data.length === 0 || !data[0]?.success) {
        throw new InsufficientCreditsError(`积分不足，需要 ${amount} 积分，但余额不足`);
      }

      return {
        success: true,
        remaining_credits: data[0].remaining_credits || 0,
      };
    }
  }

  /**
   * Get user's credit balance
   *
   * @param userId - User ID to query
   * @returns Credit balance information
   */
  async getBalance(userId: string): Promise<CreditBalance> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("report_credits")
      .select("credits_available, credits_used, updated_at")
      .eq("user_id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to get credit balance: ${error.message}`);
    }

    if (!data) {
      // No credits record, return default
      return {
        credits_available: 0,
        credits_used: 0,
        last_updated: new Date().toISOString(),
      };
    }

    return {
      credits_available: data.credits_available || 0,
      credits_used: data.credits_used || 0,
      last_updated: data.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Grant credits to a user (admin only)
   *
   * @param adminId - Admin user ID performing the operation
   * @param targetUserId - User to receive credits
   * @param amount - Number of credits to grant
   * @param reason - Reason for granting credits
   * @throws {UnauthorizedError} When admin doesn't have required permissions
   */
  async grantCredits(
    adminId: string,
    targetUserId: string,
    amount: number,
    reason: string = "admin_grant"
  ): Promise<CreditOperationResult> {
    const supabase = await createClient();

    // Check admin permissions
    const isAdmin = await this.checkAdminPermission(adminId);
    if (!isAdmin) {
      throw new UnauthorizedError("需要管理员权限才能授予积分");
    }

    // Update credits atomically - first get current value
    const { data: currentCredits } = await supabase
      .from("report_credits")
      .select("credits_available")
      .eq("user_id", targetUserId)
      .single();

    const newAmount = (currentCredits?.credits_available || 0) + amount;

    const { data: creditData, error: updateError } = await supabase
      .from("report_credits")
      .update({
        credits_available: newAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to grant credits: ${updateError.message}`);
    }

    // Record transaction event
    const { error: eventError } = await supabase.from("report_credit_events").insert({
      user_id: targetUserId,
      event_type: "granted",
      credits_amount: amount,
      reason,
      delta: amount,
      metadata: {
        granted_by: adminId,
      },
    });

    if (eventError) {
      console.error("Failed to record credit event:", eventError);
    }

    // TODO: Record audit log (audit_logs table not in database yet)
    // const { error: auditError } = await supabase.from("audit_logs").insert({
    //   user_id: adminId,
    //   action: "GRANT_CREDITS",
    //   table_name: "report_credits",
    //   details: {
    //     target_user: targetUserId,
    //     amount,
    //     reason,
    //   },
    // });

    // if (auditError) {
    //   console.error("Failed to record audit log:", auditError);
    // }

    return {
      success: true,
      remaining_credits: creditData?.credits_available || 0,
      message: `成功授予 ${amount} 积分`,
    };
  }

  /**
   * Claim daily reward (10 credits per day)
   *
   * @param userId - User ID claiming the reward
   * @returns Operation result with remaining credits
   */
  async claimDailyReward(userId: string): Promise<CreditOperationResult> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("fn_claim_daily_reward" as any, {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to claim daily reward: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("Failed to claim daily reward: No data returned");
    }

    const result = data[0];

    return {
      success: result.success || false,
      remaining_credits: result.remaining_credits || 0,
      message: result.message || "",
    };
  }

  /**
   * Get credit transaction history for a user
   *
   * @param userId - User ID to query
   * @param limit - Maximum number of transactions to return (default: 50)
   * @returns Array of credit transactions
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("report_credit_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }

    return (data || []) as CreditTransaction[];
  }

  /**
   * Check if user has admin permissions
   * @private
   */
  private async checkAdminPermission(userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === "admin";
  }

  /**
   * Initialize credits for a new user (internal use)
   *
   * @param userId - User ID to initialize
   * @param initialCredits - Initial credit amount (default: 30)
   * @internal
   */
  async initializeCredits(userId: string, initialCredits: number = 30): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.from("report_credits").insert({
      user_id: userId,
      credits_available: initialCredits,
      credits_used: 0,
    });

    if (error && error.code !== "23505") {
      // Ignore unique constraint violation (user already has credits)
      throw new Error(`Failed to initialize credits: ${error.message}`);
    }

    // Record event
    await supabase.from("report_credit_events").insert({
      user_id: userId,
      event_type: "granted",
      credits_amount: initialCredits,
      reason: "Initial signup bonus",
      delta: initialCredits,
    });
  }
}
