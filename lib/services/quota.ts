/**
 * Quota service - encapsulates report credit consumption logic
 * Handles RPC calls to Supabase fn_consume_report_credit with test mode bypass
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

export interface ConsumeQuotaResult {
  success: boolean;
  remainingCredits?: number;
  error?: string;
  mode: "test" | "production";
}

/**
 * Consume a report credit for the given user
 * @param userId User ID from Supabase auth
 * @param testMode If true, bypass actual deduction (for testing)
 * @returns Result with remaining credits or error
 */
export async function consumeReportCredit(
  userId: string,
  testMode: boolean = false
): Promise<ConsumeQuotaResult> {
  if (testMode) {
    // Test mode: write audit log but don't deduct credits
    return {
      success: true,
      remainingCredits: 999, // Mock remaining
      mode: "test",
    };
  }

  try {
    const supabase = createServiceRoleClient();

    // Call RPC to consume credit atomically
    const { data, error } = await supabase.rpc("fn_consume_report_credit", {
      p_user_id: userId,
    });

    if (error) {
      return {
        success: false,
        error: `Failed to consume credit: ${error.message}`,
        mode: "production",
      };
    }

    return {
      success: true,
      remainingCredits: data?.remaining_credits ?? 0,
      mode: "production",
    };
  } catch (err) {
    return {
      success: false,
      error: `Quota service error: ${err instanceof Error ? err.message : "Unknown error"}`,
      mode: "production",
    };
  }
}

/**
 * Get current user's remaining credits without consuming
 * @param userId User ID from Supabase auth
 */
export async function getRemainingCredits(userId: string): Promise<number> {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("v_user_quota")
      .select("remaining_credits")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.error("Failed to fetch quota:", error);
      return 0;
    }

    return data.remaining_credits ?? 0;
  } catch (err) {
    console.error("Quota fetch error:", err);
    return 0;
  }
}

/**
 * Write audit log for report generation
 * Used for test mode and production tracking
 */
export async function writeReportAudit(
  userId: string,
  symbol: string,
  mode: "test" | "production",
  status: "success" | "failed"
) {
  try {
    const supabase = createServiceRoleClient();

    await supabase.from("report_credit_events").insert({
      user_id: userId,
      event_type: "report_generated",
      metadata: {
        symbol,
        mode,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
    // Don't throw - audit logging failure shouldn't break report generation
  }
}
