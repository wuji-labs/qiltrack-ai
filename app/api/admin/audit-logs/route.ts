import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin, isAuthError } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  // 认证检查
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "30", 10);
    const action = searchParams.get("action");
    const resourceType = searchParams.get("resourceType");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        profiles:user_id(email, display_name)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (action && action !== "all") {
      query = query.eq("action", action);
    }

    if (resourceType && resourceType !== "all") {
      query = query.eq("resource_type", resourceType);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Fetch audit logs error:", error);
      return NextResponse.json({ error: "获取日志失败" }, { status: 500 });
    }

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 认证检查
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { action, resourceType, resourceId, details, userId } = body;

    if (!action) {
      return NextResponse.json({ error: "缺少动作类型" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId || null,
      action,
      resource_type: resourceType || null,
      resource_id: resourceId || null,
      details: details || null,
    });

    if (error) {
      console.error("Insert audit log error:", error);
      return NextResponse.json({ error: "记录日志失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create audit log error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}
