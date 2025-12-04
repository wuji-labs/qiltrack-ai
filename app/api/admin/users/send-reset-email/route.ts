import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContextFromRequest, isAdmin } from "@/app/api/_utils/supabase";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId: adminUserId, role } = await getAuthContextFromRequest(request);

    if (!adminUserId || !isAdmin(role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "缺少 email" }, { status: 400 });
    }

    // 使用Supabase Admin API发送密码重置邮件
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account/change-password`,
    });

    if (error) {
      console.error("Send reset email error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 记录审计日志
    await supabaseAdmin.from("audit_logs").insert({
      user_id: adminUserId,
      action: "password_reset_email_sent",
      table_name: "profiles",
      record_id: adminUserId,
      details: { target_email: email },
    });

    return NextResponse.json({
      success: true,
      message: "密码重置邮件已发送"
    });
  } catch (error: unknown) {
    console.error("Send reset email API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "发送重置邮件失败" },
      { status: 500 }
    );
  }
}
