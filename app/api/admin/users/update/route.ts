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
    const { userId: adminUserId, role } = await getAuthContextFromRequest(request);

    if (!adminUserId || !isAdmin(role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, display_name, full_name, role: newRole, plan } = body;

    if (!userId) {
      return NextResponse.json({ error: "用户ID为必填项" }, { status: 400 });
    }

    // 2. 更新profiles表 (不再包含 quota_limit)
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        display_name,
        name: full_name,
        role: newRole,
        plan,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Update user error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3. Log admin action
    await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: adminUserId,
        action: "user_update",
        resource_type: "profiles",
        resource_id: userId,
        details: {
          target_user_id: userId,
          display_name,
          full_name,
          role: newRole,
          plan,
        },
      });

    return NextResponse.json({
      success: true,
    });
  } catch (error: unknown) {
    console.error("Update user API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新用户失败" },
      { status: 500 }
    );
  }
}
