import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * Get MFA Status and Devices
 *
 * GET /api/user/mfa/status
 *
 * Returns:
 * - MFA enabled status
 * - List of registered devices
 * - Whether MFA is enforced by admin
 */
export async function GET(request: NextRequest) {
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
    const supabaseAdmin = createServiceRoleClient();

    // 2. Get profile MFA status
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("mfa_enabled, mfa_enforced")
      .eq("id", userId)
      .single();

    // 3. Get MFA devices
    const { data: devices } = await supabaseAdmin
      .from("mfa_devices")
      .select("id, device_name, device_type, is_active, verified_at, last_used_at, use_count, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 4. Return status
    const response = NextResponse.json(
      {
        mfaEnabled: profile?.mfa_enabled || false,
        mfaEnforced: profile?.mfa_enforced || false,
        devices: devices || [],
        deviceCount: devices?.length || 0,
      },
      { status: 200 }
    );

    responseCookies.forEach(({ name, value }) =>
      response.headers.append("Set-Cookie", `${name}=${value}`)
    );

    return response;
  } catch (error) {
    console.error("[MFA_STATUS_ERROR]", error);
    return handleApiError(error);
  }
}
