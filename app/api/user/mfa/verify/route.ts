import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/error-handler";
import { verifyTOTPCode, decrypt } from "@/lib/auth/mfa/totp";
import { validateUUID } from "@/lib/utils/validation";

/**
 * MFA Enrollment - Step 2: Verify TOTP Code
 *
 * POST /api/user/mfa/verify
 *
 * Request body:
 * {
 *   "deviceId": "uuid",
 *   "code": "123456"
 * }
 *
 * This endpoint:
 * 1. Verifies the TOTP code
 * 2. Activates the MFA device
 * 3. Enables MFA for the user account
 */
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse and validate request body
    const body = await request.json().catch(() => null);

    if (!body || !body.deviceId || !body.code) {
      return NextResponse.json(
        { error: "Missing deviceId or code", code: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    let deviceId: string;
    try {
      deviceId = validateUUID(body.deviceId);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid device ID format", code: "INVALID_DEVICE_ID" },
        { status: 400 }
      );
    }

    const code = body.code.toString().replace(/\s/g, ""); // Remove whitespace

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Invalid code format. Must be 6 digits", code: "INVALID_CODE_FORMAT" },
        { status: 400 }
      );
    }

    // 3. Get device from database
    const supabaseAdmin = createServiceRoleClient();
    const { data: device, error: deviceError } = await supabaseAdmin
      // @ts-ignore - mfa_devices not in generated types yet
      .from("mfa_devices")
      .select("*")
      .eq("id", deviceId)
      .eq("user_id", userId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json(
        { error: "MFA device not found", code: "DEVICE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 4. Decrypt secret
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY not configured");
    }

    let secret: string;
    try {
      secret = decrypt((device as any).secret_encrypted, encryptionKey);
    } catch (error) {
      console.error("[MFA_DECRYPT_ERROR]", error);
      return NextResponse.json(
        { error: "Failed to decrypt device secret", code: "DECRYPT_FAILED" },
        { status: 500 }
      );
    }

    // 5. Verify TOTP code
    const isValid = verifyTOTPCode(secret, code, 1); // ±1 time window (90 seconds total)

    if (!isValid) {
      // Record failed attempt
      // @ts-ignore - fn_record_mfa_attempt not in generated types yet
      await supabaseAdmin.rpc("fn_record_mfa_attempt", {
        p_user_id: userId,
        p_device_id: deviceId,
        p_success: false,
        p_method: "totp",
        p_failure_reason: "invalid_code",
      });

      console.warn(`[MFA_VERIFY_FAILED] user_id: ${userId}, device_id: ${deviceId}`);

      return NextResponse.json(
        {
          error: "Invalid verification code. Please try again.",
          code: "INVALID_CODE",
        },
        { status: 400 }
      );
    }

    // 6. Activate device and enable MFA
    const { error: updateError } = await supabaseAdmin
      // @ts-ignore - mfa_devices not in generated types yet
      .from("mfa_devices")
      .update({
        is_active: true,
        verified_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        use_count: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (updateError) {
      console.error("[MFA_ACTIVATE_ERROR]", updateError);
      return NextResponse.json(
        { error: "Failed to activate MFA device", code: "ACTIVATE_FAILED" },
        { status: 500 }
      );
    }

    // 7. Update profile (trigger will auto-enable mfa_enabled)
    // But we explicitly set it here for certainty
    await supabaseAdmin
      .from("profiles")
      .update({
        mfa_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // 8. Record successful attempt
    // @ts-ignore - fn_record_mfa_attempt not in generated types yet
    await supabaseAdmin.rpc("fn_record_mfa_attempt", {
      p_user_id: userId,
      p_device_id: deviceId,
      p_success: true,
      p_method: "totp",
    });

    // 9. Log activation
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "MFA_ENABLED",
      resource_type: "mfa_devices",
      resource_id: deviceId,
      details: {
        device_name: (device as any).device_name,
      },
    });

    console.info(`[MFA_ENABLED] user_id: ${userId}, device_id: ${deviceId}`);

    // 10. Return success
    const response = NextResponse.json(
      {
        success: true,
        message: "MFA successfully enabled",
        mfaEnabled: true,
      },
      { status: 200 }
    );

    responseCookies.forEach(({ name, value }) =>
      response.headers.append("Set-Cookie", `${name}=${value}`)
    );

    return response;
  } catch (error) {
    console.error("[MFA_VERIFY_ERROR]", error);
    return handleApiError(error);
  }
}
