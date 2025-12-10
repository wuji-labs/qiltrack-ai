import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { validateUUID, sanitizeString } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "需要登录" }, { status: 401 });
    }

    // 用 service role 获取当前用户角色（绕过 RLS）
    const supabaseAdmin = createServiceRoleClient();
    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = adminProfile?.role;
    if (role !== "super_admin" && role !== "admin") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { userId: rawUserId, role: newRole, plan, display_name: rawDisplayName, full_name: rawFullName } = await request.json();

    // Validate userId format
    let userId: string;
    try {
      userId = validateUUID(rawUserId);
    } catch (error) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Validate role if provided
    const validRoles = ["user", "admin", "super_admin"];
    if (newRole && !validRoles.includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Validate plan if provided
    const validPlans = ["free", "pro", "ultra"];
    if (plan && !validPlans.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Sanitize text inputs
    const display_name = rawDisplayName !== undefined ? sanitizeString(rawDisplayName, 100) : undefined;
    const full_name = rawFullName !== undefined ? sanitizeString(rawFullName, 100) : undefined;

    // 准备更新数据
    const updateData: {
      role?: string;
      plan?: string;
      display_name?: string;
      full_name?: string;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    // 只有 super_admin 才能设置 admin 或 super_admin 角色
    if (newRole) {
      if ((newRole === "admin" || newRole === "super_admin") && role !== "super_admin") {
        return NextResponse.json(
          { error: "只有超级管理员才能设置管理员或超级管理员角色" },
          { status: 403 }
        );
      }
      updateData.role = newRole;
    }
    if (plan) updateData.plan = plan;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (full_name !== undefined) updateData.full_name = full_name;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      console.error("Update user error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "user_update",
      resource_type: "profiles",
      resource_id: userId,
      details: { role: newRole, plan },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Update user API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新用户失败" },
      { status: 500 }
    );
  }
}
