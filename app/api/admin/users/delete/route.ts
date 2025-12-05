import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin, isAuthError } from "@/lib/auth/admin";

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

export async function POST(request: NextRequest) {
  // 认证检查 - 只有 super_admin 和 admin 可以删除用户
  const auth = await requireAdmin(["super_admin", "admin"]);
  if (isAuthError(auth)) return auth;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId: targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    // 不能删除自己
    if (targetUserId === auth.userId) {
      return NextResponse.json({ error: "不能删除自己的账户" }, { status: 400 });
    }

    // 记录审计日志
    await supabaseAdmin.from("audit_logs").insert({
      user_id: auth.userId,
      action: "DELETE_USER",
      resource_type: "user",
      resource_id: targetUserId,
      details: { deleted_by: auth.email },
    });

    // 删除用户
    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (error) {
      console.error("Delete user error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete user API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除用户失败" },
      { status: 500 }
    );
  }
}
