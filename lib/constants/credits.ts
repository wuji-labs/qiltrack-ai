/**
 * Credits system constants
 * All credit-related values should be imported from here to ensure consistency
 */

export const CREDITS = {
  /** Initial credits for new free users */
  INITIAL_FREE: 30,

  /** Daily reward amount */
  DAILY_REWARD: 10,

  /** Credits consumed per report generation */
  REPORT_COST: 30,

  /** Monthly credits for Pro plan */
  PRO_MONTHLY: 300,

  /** Monthly credits for Ultra plan */
  ULTRA_MONTHLY: 1500,

  /** Low credit warning threshold */
  LOW_CREDIT_THRESHOLD: 5,
} as const;

export type CreditEventType =
  | "consumed"
  | "granted"
  | "daily_reward"
  | "subscription_reset"
  | "refund"
  | "admin_adjustment";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "canceled"
  | "trialing";

export type UserPlan = "free" | "pro" | "ultra";

export type UserRole =
  | "super_admin"
  | "admin"
  | "developer"
  | "editor"
  | "user"
  | "guest";

/** Admin roles that have elevated permissions */
export const ADMIN_ROLES: UserRole[] = ["super_admin", "admin", "editor"];

/** Check if a role has admin privileges */
export function isAdminRole(role: UserRole | string | null | undefined): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

/** Get plan credits limit */
export function getPlanCredits(plan: UserPlan): number {
  switch (plan) {
    case "pro":
      return CREDITS.PRO_MONTHLY;
    case "ultra":
      return CREDITS.ULTRA_MONTHLY;
    default:
      return CREDITS.INITIAL_FREE;
  }
}
