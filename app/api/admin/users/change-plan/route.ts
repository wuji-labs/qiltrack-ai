import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";

const PLAN_CONFIGS = {
  free: { name: "免费版", quota: 60, price: 0 },
  pro: { name: "月费版", quota: 300, price: 14.99 },
  annual: { name: "年费版", quota: 600, price: 119.99 },
};

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
    const { userId, newPlan, grantCredits = true } = body;

    if (!userId || !newPlan) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    if (!PLAN_CONFIGS[newPlan as keyof typeof PLAN_CONFIGS]) {
      return NextResponse.json({ error: "无效的套餐类型" }, { status: 400 });
    }

    // 获取用户当前信息
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const oldPlan = currentUser.plan || "free";
    const planConfig = PLAN_CONFIGS[newPlan as keyof typeof PLAN_CONFIGS];

    // 更新用户套餐
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        plan: newPlan,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Update plan failed:", updateError);
      return NextResponse.json({ error: "更新套餐失败" }, { status: 500 });
    }

    // 如果需要授予积分
    if (grantCredits && planConfig.quota > 0) {
      const { data: credits } = await supabaseAdmin
        .from("report_credits")
        .select("credits_available")
        .eq("user_id", userId)
        .single();

      const currentCredits = credits?.credits_available || 0;

      const { error: creditUpdateError } = await supabaseAdmin
        .from("report_credits")
        .upsert({
          user_id: userId,
          credits_available: currentCredits + planConfig.quota,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (creditUpdateError) {
        console.error("Update credits failed:", creditUpdateError);
      }

      await supabaseAdmin.from("report_credit_events").insert({
        user_id: userId,
        event_type: "granted",
        delta: planConfig.quota,
        reason: `套餐升级: ${PLAN_CONFIGS[oldPlan as keyof typeof PLAN_CONFIGS]?.name || oldPlan} -> ${planConfig.name}`,
      });
    }

    // 记录审计日志
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "CHANGE_PLAN",
      resource_type: "user",
      resource_id: userId,
      details: {
        old_plan: oldPlan,
        new_plan: newPlan,
        credits_granted: grantCredits ? planConfig.quota : 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `套餐已更改为 ${planConfig.name}`,
      creditsGranted: grantCredits ? planConfig.quota : 0,
    });
  } catch (error) {
    console.error("Change plan error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}
