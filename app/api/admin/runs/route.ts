import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/auth/admin";

/**
 * GET /api/admin/runs
 * List all report runs (admin only)
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - older_than_days: Filter reports older than N days (optional)
 * - is_featured: Filter by featured status (optional)
 *
 * Returns:
 * - runs: Array of report run records
 * - pagination: {page, pageSize, total, pages}
 */
export async function GET(request: NextRequest) {
  try {
    // 使用统一的 requireAdmin() 进行管理员权限验证
    // 这比使用邮箱域名验证更安全，基于数据库的 role 字段
    const authResult = await requireAdmin();

    // 检查是否为错误响应
    if (isAuthError(authResult)) {
      return authResult;
    }

    // 已验证为管理员（super_admin/admin/editor）
    const { userId } = authResult;

    // 使用 service role client 进行数据查询（绕过RLS）
    const supabase = createServiceRoleClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * pageSize;
    const olderThanDays = searchParams.get("older_than_days");
    const isFeaturedParam = searchParams.get("is_featured");

    // Build query
    let query = supabase
      .from("report_runs")
      .select(
        "id, user_id, symbol, created_at, status, is_featured, language, mode, markdown_path, docx_path, pdf_path, reused_from_run_id",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays, 10));
      query = query.lte("created_at", cutoffDate.toISOString());
    }

    if (isFeaturedParam !== null) {
      query = query.eq("is_featured", isFeaturedParam === "true");
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data: runs, error: queryError, count } = await query;

    if (queryError) {
      console.error("Failed to fetch report runs:", queryError);
      return NextResponse.json({ error: "Failed to fetch report runs" }, { status: 500 });
    }

    return NextResponse.json({
      runs: runs || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (err) {
    console.error("Admin runs list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
