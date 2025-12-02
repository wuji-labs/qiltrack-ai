import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContextFromRequest, isAdmin } from "@/app/api/_utils/supabase";
import { validatePassword } from "@/lib/auth/password-validator";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    // 1. Verify authentication and authorization
    const { userId: adminUserId, role } = await getAuthContextFromRequest(request);

    if (!adminUserId || !isAdmin(role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json({ error: "用户ID和密码为必填项" }, { status: 400 });
    }

    // 验证密码强度
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    // 2. Log admin action
    await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: adminUserId,
        action: "password_reset",
        resource_type: "profiles",
        resource_id: userId,
        details: { target_user_id: userId },
      });

    // 3. Reset password using Admin API
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      console.error("Reset password error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: unknown) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "重置密码失败" },
      { status: 500 }
    );
  }
}
