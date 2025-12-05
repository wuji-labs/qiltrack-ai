import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin, isAuthError } from "@/lib/auth/admin";

const PLAN_PRICES = {
  free: 0,
  pro: 14.99,
  annual: 119.99 / 12, // 月均价
};

export async function GET() {
  // 认证检查
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 获取各套餐用户数
    const { data: profiles } = await supabase
      .from("profiles")
      .select("plan");

    const planCounts: Record<string, number> = {
      free: 0,
      pro: 0,
      annual: 0,
    };

    profiles?.forEach((p: { plan: string }) => {
      const plan = p.plan || "free";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    // 计算MRR
    let mrr = 0;
    mrr += planCounts.pro * PLAN_PRICES.pro;
    mrr += planCounts.annual * PLAN_PRICES.annual;

    // 获取活跃订阅数
    const { count: activeSubscriptions } = await supabase
      .from("billing_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // 获取订阅列表
    const { data: subscriptions, count: total } = await supabase
      .from("billing_subscriptions")
      .select(`
        *,
        profiles:user_id(email, display_name, plan)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100);

    return NextResponse.json({
      summary: {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(mrr * 12 * 100) / 100,
        activeSubscriptions: activeSubscriptions || 0,
        totalUsers: profiles?.length || 0,
        planDistribution: planCounts,
      },
      subscriptions: subscriptions || [],
      total: total || 0,
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}
