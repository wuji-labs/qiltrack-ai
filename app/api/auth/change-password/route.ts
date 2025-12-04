import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/auth/password-validator";

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

    // Parse request body first to check if this is a recovery flow
    const body = await request.json().catch(() => null);
    if (!body || !body.newPassword) {
      const response = NextResponse.json(
        { error: "Missing required fields", code: "invalid_payload" },
        { status: 400 }
      );
      responseCookies.forEach(({ name, value }) =>
        response.headers.append("Set-Cookie", `${name}=${value}`)
      );
      return response;
    }

    const { currentPassword, newPassword, isRecovery } = body;

    // For recovery flow, session might not be fully established yet
    // Supabase auth.updateUser() will use the recovery token from the session
    // For non-recovery flow, require valid session
    if (!isRecovery && (sessionError || !session?.user?.id)) {
      const response = NextResponse.json(
        { error: "Unauthorized", code: "unauthorized" },
        { status: 401 }
      );
      responseCookies.forEach(({ name, value }) =>
        response.headers.append("Set-Cookie", `${name}=${value}`)
      );
      return response;
    }

    // If not recovery mode, current password is required
    if (!isRecovery && !currentPassword) {
      const response = NextResponse.json(
        { error: "Current password is required", code: "invalid_payload" },
        { status: 400 }
      );
      responseCookies.forEach(({ name, value }) =>
        response.headers.append("Set-Cookie", `${name}=${value}`)
      );
      return response;
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      const response = NextResponse.json(
        { error: passwordValidation.errors.join(', '), code: "password_validation_failed" },
        { status: 400 }
      );
      responseCookies.forEach(({ name, value }) =>
        response.headers.append("Set-Cookie", `${name}=${value}`)
      );
      return response;
    }

    // Only verify current password if not in recovery mode
    if (!isRecovery) {
      // Get user email to verify current password
      const userEmail = session?.user?.email;
      if (!userEmail) {
        const response = NextResponse.json(
          { error: "User email not found", code: "user_email_missing" },
          { status: 400 }
        );
        responseCookies.forEach(({ name, value }) =>
          response.headers.append("Set-Cookie", `${name}=${value}`)
        );
        return response;
      }

      // Verify current password by attempting to sign in
      // This is the recommended way to verify password in Supabase
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (verifyError) {
        console.warn(
          `[PASSWORD_VERIFY_FAILED] user_id: ${session?.user?.id}, error: ${verifyError.message}`
        );
        const response = NextResponse.json(
          { error: "Current password is incorrect", code: "invalid_current_password" },
          { status: 401 }
        );
        responseCookies.forEach(({ name, value }) =>
          response.headers.append("Set-Cookie", `${name}=${value}`)
        );
        return response;
      }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error(
        `[PASSWORD_UPDATE_FAILED] user_id: ${session?.user?.id || 'recovery'}, error: ${updateError.message}`
      );
      const response = NextResponse.json(
        { error: "Failed to update password", code: "update_failed" },
        { status: 500 }
      );
      responseCookies.forEach(({ name, value }) =>
        response.headers.append("Set-Cookie", `${name}=${value}`)
      );
      return response;
    }

    console.info(`[PASSWORD_CHANGED] user_id: ${session?.user?.id || 'recovery'}`);


    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });

    responseCookies.forEach(({ name, value }) =>
      response.headers.append("Set-Cookie", `${name}=${value}`)
    );
    return response;
  } catch (err) {
    console.error("Change password API error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "internal_error" },
      { status: 500 }
    );
  }
}
