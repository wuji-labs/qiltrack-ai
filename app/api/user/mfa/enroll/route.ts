import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/error-handler";
import {
  generateTOTPSecret,
  generateOTPAuthURL,
  generateBackupCodes,
  encrypt,
  hashBackupCode,
} from "@/lib/auth/mfa/totp";
import { sanitizeString } from "@/lib/utils/validation";

/**
 * MFA Enrollment - Step 1: Generate TOTP Secret
 *
 * POST /api/user/mfa/enroll
 *
 * Request body:
 * {
 *   "deviceName": "Google Authenticator on iPhone"
 * }
 *
 * Response:
 * {
 *   "deviceId": "uuid",
 *   "secret": "BASE32SECRET",
 *   "qrCodeUrl": "otpauth://totp/...",
 *   "backupCodes": ["XXXX-XXXX-XXXX", ...]
 * }
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
    const userEmail = session.user.email;

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const deviceName = body.deviceName
      ? sanitizeString(body.deviceName, 100)
      : "Authenticator App";

    // 3. Check if user already has 5+ devices (rate limit)
    const supabaseAdmin = createServiceRoleClient();
    const { count } = await supabaseAdmin
      // @ts-ignore - mfa_devices not in generated types yet
      .from("mfa_devices")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (count && count >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 MFA devices allowed per account", code: "MAX_DEVICES_REACHED" },
        { status: 400 }
      );
    }

    // 4. Generate TOTP secret
    const secret = generateTOTPSecret();

    // 5. Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(hashBackupCode);

    // 6. Encrypt secret and backup codes
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error(
        "ENCRYPTION_KEY not configured. Please set a 64-character hex key in environment variables"
      );
    }

    const secretEncrypted = encrypt(secret, encryptionKey);
    const backupCodesEncrypted = hashedBackupCodes.map((code) => encrypt(code, encryptionKey));

    // 7. Insert MFA device (unverified)
    const { data: device, error: insertError } = await supabaseAdmin
      // @ts-ignore - mfa_devices not in generated types yet
      .from("mfa_devices")
      .insert({
        user_id: userId,
        device_name: deviceName,
        device_type: "totp",
        secret_encrypted: secretEncrypted,
        backup_codes_encrypted: backupCodesEncrypted,
        is_active: false, // Not active until verified
        verified_at: null,
      })
      .select()
      .single();

    if (insertError || !device) {
      console.error("[MFA_ENROLL_ERROR]", insertError);
      return NextResponse.json(
        { error: "Failed to create MFA device", code: "DEVICE_CREATE_FAILED" },
        { status: 500 }
      );
    }

    // 8. Generate QR code URL
    const qrCodeUrl = generateOTPAuthURL(secret, userEmail || userId, "Qiltrack AI");

    // 9. Log enrollment attempt
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "MFA_ENROLL_INITIATED",
      resource_type: "mfa_devices",
      resource_id: device.id,
      details: {
        device_name: deviceName,
      },
    });

    console.info(`[MFA_ENROLL_INITIATED] user_id: ${userId}, device_id: ${device.id}`);

    // 10. Return secret and QR code (ONLY shown once!)
    const response = NextResponse.json(
      {
        success: true,
        deviceId: device.id,
        secret, // Plain text secret for manual entry
        qrCodeUrl,
        backupCodes, // Plain text backup codes (show only once!)
        message:
          "Save your backup codes in a secure location. You won't be able to see them again.",
      },
      { status: 200 }
    );

    responseCookies.forEach(({ name, value }) =>
      response.headers.append("Set-Cookie", `${name}=${value}`)
    );

    return response;
  } catch (error) {
    console.error("[MFA_ENROLL_ERROR]", error);
    return handleApiError(error);
  }
}
