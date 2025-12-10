import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/auth/password-validator";
import { handleApiError } from "@/lib/api/error-handler";
import { validateEmail, sanitizeString, validateInteger } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);

    // 1. Verify authentication
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
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const adminUserId = user.id;

    const body = await request.json();
    const { email: rawEmail, password, display_name: rawDisplayName, full_name: rawFullName, role: newUserRole, plan, initial_credits } =
      body;

    // Validate and sanitize email
    let email: string;
    try {
      email = validateEmail(rawEmail);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid email" }, { status: 400 });
    }

    // Validate required fields
    if (!password) {
      return NextResponse.json({ error: "密码为必填项" }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.errors.join(", ") }, { status: 400 });
    }

    // Sanitize text inputs
    const display_name = rawDisplayName ? sanitizeString(rawDisplayName, 100) : null;
    const full_name = rawFullName ? sanitizeString(rawFullName, 100) : null;

    // Validate role if provided
    const validRoles = ["user", "admin", "super_admin"];
    if (newUserRole && !validRoles.includes(newUserRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Validate plan if provided
    const validPlans = ["free", "pro", "ultra"];
    if (plan && !validPlans.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Validate initial_credits if provided
    let creditsToGrant: number;
    if (initial_credits !== undefined) {
      try {
        creditsToGrant = validateInteger(initial_credits, 0, 10000);
      } catch (error) {
        return NextResponse.json({ error: "Invalid initial credits" }, { status: 400 });
      }
    } else {
      const planCredits: Record<string, number> = {
        free: 40,
        pro: 600,
        ultra: 3000,
      };
      creditsToGrant = planCredits[plan || "free"] || 40;
    }

    // 2. 创建用户
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: display_name || null,
        full_name: full_name || null,
      },
    });

    if (createError) {
      console.error("Create user error:", createError);
      // Don't expose internal error details to client
      return NextResponse.json({ error: "创建用户失败" }, { status: 400 });
    }

    // 3. 更新 profiles 表
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        display_name: display_name || null,
        name: full_name || null,
        role: newUserRole || "user",
        plan: plan || "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // 不阻断流程，因为用户已创建
    }

    // 4. 初始化积分 (使用 report_credits 表)
    const { error: creditsError } = await supabaseAdmin.from("report_credits").insert({
      user_id: userData.user.id,
      credits_available: creditsToGrant,
      credits_used: 0,
    });

    if (creditsError) {
      console.error("Credits init error:", creditsError);
      // 不阻断流程，因为用户已创建
    }

    // 5. Log admin action
    await supabaseAdmin.from("audit_logs").insert({
      user_id: adminUserId,
      action: "user_create",
      resource_type: "profiles",
      resource_id: userData.user.id,
      details: {
        email,
        role: newUserRole || "user",
        plan: plan || "free",
        credits_granted: creditsToGrant,
      },
    });

    return NextResponse.json({
      success: true,
      user: userData.user,
      credits_granted: creditsToGrant,
    });
  } catch (error: unknown) {
    console.error("Create user API error:", error);
    // Use standardized error handler that doesn't leak sensitive info
    return handleApiError(error);
  }
}
