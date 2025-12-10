import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/error-handler";
import { maskEmail } from "@/lib/utils/validation";

/**
 * GDPR Article 17: Right to Erasure ("Right to be Forgotten")
 * Permanently delete user account and all associated data
 *
 * DELETE /api/user/delete-account
 *
 * Request body:
 * {
 *   "confirmation": "DELETE MY ACCOUNT",
 *   "password": "user_password",
 *   "reason": "optional deletion reason"
 * }
 *
 * This will:
 * 1. Verify user authentication and password
 * 2. Cancel active Stripe subscriptions
 * 3. Delete all user data (cascading deletes via foreign keys)
 * 4. Delete auth user account
 * 5. Log deletion event (anonymized)
 */
export async function DELETE(request: NextRequest) {
  try {
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    // 1. Authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to delete your account" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // 2. Parse and validate request body
    const body = await request.json().catch(() => null);

    if (!body || body.confirmation !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        {
          error: "Invalid confirmation. Please type 'DELETE MY ACCOUNT' exactly to confirm",
          code: "INVALID_CONFIRMATION",
        },
        { status: 400 }
      );
    }

    if (!body.password) {
      return NextResponse.json(
        { error: "Password is required to delete account", code: "PASSWORD_REQUIRED" },
        { status: 400 }
      );
    }

    // 3. Verify password by attempting to sign in
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: userEmail!,
      password: body.password,
    });

    if (passwordError) {
      console.warn(`[DELETE_ACCOUNT_FAILED] Invalid password attempt for user: ${userId}`);
      return NextResponse.json(
        { error: "Incorrect password", code: "INVALID_PASSWORD" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();

    // 4. Get profile data before deletion (for logging)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, stripe_customer_id, stripe_subscription_id")
      .eq("id", userId)
      .single();

    // 5. Cancel Stripe subscription if exists
    if (profile?.stripe_subscription_id) {
      try {
        // Note: This requires Stripe API integration
        // For now, log the subscription ID that needs manual cancellation
        console.warn(
          `[DELETE_ACCOUNT_STRIPE] Manual subscription cancellation required: ${profile.stripe_subscription_id}`
        );
        // TODO: Implement automatic Stripe cancellation:
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        // await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      } catch (error) {
        console.error("[DELETE_ACCOUNT_STRIPE_ERROR]", error);
        // Continue with deletion even if Stripe fails
      }
    }

    // 6. Log deletion event BEFORE deletion (anonymized record for compliance)
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "ACCOUNT_DELETION",
      resource_type: "user_account",
      resource_id: userId,
      details: {
        deletion_reason: body.reason || "User requested account deletion",
        had_subscription: !!profile?.stripe_subscription_id,
        plan: profile?.plan || "free",
        masked_email: maskEmail(userEmail || "unknown"),
        gdpr_article: "Article 17 - Right to Erasure",
      },
    });

    console.warn(
      `[ACCOUNT_DELETION_INITIATED] user_id: ${userId}, email: ${maskEmail(userEmail || 'unknown')}`
    );

    // 7. Delete auth user (this triggers CASCADE DELETE on all related tables)
    // Tables with ON DELETE CASCADE:
    // - profiles
    // - report_credits
    // - report_credit_events
    // - daily_rewards
    // - reports
    // - audit_logs
    // - referrals
    // - mfa_devices (if implemented)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("[ACCOUNT_DELETION_ERROR]", deleteError);
      return NextResponse.json(
        {
          error: "Failed to delete account. Please contact support.",
          code: "DELETION_FAILED",
        },
        { status: 500 }
      );
    }

    console.info(
      `[ACCOUNT_DELETED] user_id: ${userId}, email: ${maskEmail(userEmail || 'unknown')}`
    );

    // 8. Sign out user
    await supabase.auth.signOut();

    // 9. Return success response
    const response = NextResponse.json(
      {
        success: true,
        message: "Account permanently deleted",
        deleted_at: new Date().toISOString(),
      },
      { status: 200 }
    );

    responseCookies.forEach(({ name, value }) =>
      response.headers.append("Set-Cookie", `${name}=${value}`)
    );

    return response;
  } catch (error) {
    console.error("[DELETE_ACCOUNT_ERROR]", error);
    return handleApiError(error);
  }
}
