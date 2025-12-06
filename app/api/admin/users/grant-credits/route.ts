import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";

// Handles POST /api/admin/users/grant-credits for single-user credit adjustments

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

    const body = await request.json();
    const { userId, amount, reason } = body;

    const numericAmount = Number(amount);

    if (!userId || Number.isNaN(numericAmount)) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 获取当前积分
    const { data: current } = await supabaseAdmin
      .from("report_credits")
      .select("credits_available, credits_used")
      .eq("user_id", userId)
      .single();

    const currentCredits = current?.credits_available || 0;
    const creditsUsed = current?.credits_used || 0;
    const newCredits = currentCredits + numericAmount;

    if (newCredits < 0) {
      return NextResponse.json({ error: "积分不能为负数" }, { status: 400 });
    }

    // 更新积分
    const { error: updateError } = await supabaseAdmin
      .from("report_credits")
      .upsert({
        user_id: userId,
        credits_available: newCredits,
        credits_used: creditsUsed,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (updateError) {
      console.error("Update credits error:", updateError);
      return NextResponse.json({ error: "更新积分失败" }, { status: 500 });
    }

    // 记录积分事件
    const eventType = numericAmount > 0 ? "admin_grant" : "admin_deduct";
    await supabaseAdmin.from("report_credit_events").insert({
      user_id: userId,
      event_type: eventType,
      credits_amount: Math.abs(numericAmount),
      reason: reason || (numericAmount > 0 ? "管理员授予" : "管理员扣除"),
    });

    // 记录审计日志
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: numericAmount > 0 ? "GRANT_CREDITS" : "REVOKE_CREDITS",
      resource_type: "credits",
      resource_id: userId,
      details: { amount: numericAmount, reason, new_balance: newCredits },
    });

    return NextResponse.json({
      success: true,
      newBalance: newCredits,
    });
  } catch (error) {
    console.error("Grant credits error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}
