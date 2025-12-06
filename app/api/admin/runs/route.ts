import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];

    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    const userId = session.user.id;

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      const response = NextResponse.json(
        { error: "Failed to verify admin status" },
        { status: 500 }
      );
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    const isAdmin =
      (profile as { plan?: string; email?: string }).plan === "admin" ||
      (profile as { plan?: string; email?: string }).email?.endsWith("@qiltrack.com");

    if (!isAdmin) {
      const response = NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
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
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));
      query = query.lte("created_at", cutoffDate.toISOString());
    }

    if (isFeaturedParam !== null) {
      query = query.eq("is_featured", isFeaturedParam === "true");
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data: runs, error: queryError, count } = await query;

    if (queryError) {
      console.error("Failed to fetch report runs:", queryError);
      const response = NextResponse.json({ error: "Failed to fetch report runs" }, { status: 500 });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    const response = NextResponse.json({
      runs: runs || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize),
      },
    });

    responseCookies.forEach(({ name, value }) => {
      response.headers.append("Set-Cookie", `${name}=${value}`);
    });

    return response;
  } catch (err) {
    console.error("Admin runs list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
