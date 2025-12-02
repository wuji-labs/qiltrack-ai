import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContextFromRequest, isAdmin } from "@/app/api/_utils/supabase";

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
    const { userId, role } = await getAuthContextFromRequest(request);

    if (!userId || !isAdmin(role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "用户ID为必填项" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === targetUserId) {
      return NextResponse.json({ error: "不能删除自己的账户" }, { status: 400 });
    }

    // 2. Log admin action
    await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: userId,
        action: "user_delete",
        resource_type: "profiles",
        resource_id: targetUserId,
        details: { target_user_id: targetUserId },
      });

    // 3. Delete user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (error) {
      console.error("Delete user error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: unknown) {
    console.error("Delete user API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除用户失败" },
      { status: 500 }
    );
  }
}
