import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin, isAuthError, getAuthenticatedUser } from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  // 认证检查 - 批量操作需要 admin 或 super_admin
  const auth = await requireAdmin(["super_admin", "admin"]);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { userIds, action, params } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "缺少用户ID列表" }, { status: 400 });
    }

    // Limit batch size to prevent abuse and performance issues
    const MAX_BATCH_SIZE = 100;
    if (userIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `批量操作数量超过限制（最多${MAX_BATCH_SIZE}个用户）` },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json({ error: "缺少操作类型" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let success = 0;
    let failed = 0;

    switch (action) {
      case "change_plan":
        for (const userId of userIds) {
          try {
            const { error } = await supabase
              .from("profiles")
              .update({ plan: params.plan })
              .eq("id", userId);

            if (error) {
              failed++;
            } else {
              success++;
              await supabase.from("audit_logs").insert({
                user_id: userId,
                action: "CHANGE_PLAN",
                resource_type: "user",
                resource_id: userId,
                details: { new_plan: params.plan, batch: true },
              });
            }
          } catch {
            failed++;
          }
        }
        break;

      case "grant_credits":
        for (const userId of userIds) {
          try {
            const { data: current } = await supabase
              .from("report_credits")
              .select("credits_available")
              .eq("user_id", userId)
              .single();

            const currentCredits = current?.credits_available || 0;
            const amount = Number(params.amount);

            const { error } = await supabase
              .from("report_credits")
              .upsert({
                user_id: userId,
                credits_available: currentCredits + amount,
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id" });

            if (error) {
              failed++;
            } else {
              success++;
              await supabase.from("report_credit_events").insert({
                user_id: userId,
                event_type: "admin_grant",
                credits_amount: amount,
                reason: params.reason || "批量授予",
              });
            }
          } catch {
            failed++;
          }
        }
        break;

      case "change_role":
        for (const userId of userIds) {
          try {
            const { error } = await supabase
              .from("profiles")
              .update({ role: params.role })
              .eq("id", userId);

            if (error) {
              failed++;
            } else {
              success++;
              await supabase.from("audit_logs").insert({
                action: "UPDATE_USER",
                resource_type: "user",
                resource_id: userId,
                details: { new_role: params.role, batch: true },
              });
            }
          } catch {
            failed++;
          }
        }
        break;

      case "reset_credits":
        for (const userId of userIds) {
          try {
            const { error } = await supabase
              .from("report_credits")
              .upsert({
                user_id: userId,
                credits_available: Number(params.amount),
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id" });

            if (error) {
              failed++;
            } else {
              success++;
              await supabase.from("report_credit_events").insert({
                user_id: userId,
                event_type: "admin_reset",
                credits_amount: Number(params.amount),
                reason: "批量重置",
              });
            }
          } catch {
            failed++;
          }
        }
        break;

      default:
        return NextResponse.json({ error: "未知操作类型" }, { status: 400 });
    }

    // 记录批量操作审计日志
    await supabase.from("audit_logs").insert({
      action: "BATCH_OPERATION",
      resource_type: "batch",
      details: {
        operation: action,
        target_count: userIds.length,
        success_count: success,
        failed_count: failed,
        params,
      },
    });

    return NextResponse.json({
      success,
      failed,
      total: userIds.length,
    });
  } catch (error) {
    console.error("Batch operation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}
