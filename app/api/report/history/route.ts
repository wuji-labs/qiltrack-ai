import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Get user session using @supabase/ssr
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      console.warn(`[UNAUTHORIZED_SESSION] error: ${authError?.message || "no session"}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Get pagination params
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10")));
    const offset = (page - 1) * pageSize;

    // 使用 service role 查询报告（绕过 RLS 以确保能查到数据）
    const supabaseAdmin = createServiceRoleClient();

    // Query report history from report_posts table (where reports are actually saved)
    const {
      data: reports,
      error: queryError,
      count,
    } = await supabaseAdmin
      .from("report_posts")
      .select(
        "id, symbol, created_at, status, slug, report_run_id, tone, lang, user_id, author_id",
        { count: "exact" }
      )
      .or(`user_id.eq.${userId},author_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (queryError) {
      console.error("Failed to fetch report history:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch report history" },
        { status: 500 }
      );
    }

    // Keep a mutable list for mapped report history items
    let resultReports: Array<{
      id: string;
      symbol: string;
      created_at: string;
      status: string;
      slug: string | null;
      report_run_id: string | null;
      tone: string | null;
      lang: string | null;
      mode: string | null;
      markdown_signed_url: string | null;
      docx_signed_url: null;
      pdf_signed_url: null;
    }> = [];

    // For report_posts table, we don't have file paths, but we can generate links to view the reports
    if (reports?.length) {
      resultReports = reports
        .filter((report) => report.symbol && report.created_at && report.status)
        .map((report) => ({
          id: report.id,
          symbol: report.symbol!,
          created_at: report.created_at!,
          status: report.status!,
          slug: report.slug,
          report_run_id: report.report_run_id,
          tone: report.tone,
          lang: report.lang,
          // Map report_posts fields to expected history format
          mode: report.tone, // tone field maps to mode
          // Generate view links based on slug or report_run_id
          markdown_signed_url: report.slug ? `/reports/${report.slug}` : null,
          docx_signed_url: null, // No DOCX export for report_posts yet
          pdf_signed_url: null,  // No PDF export for report_posts yet
        }));
    }

    const response = NextResponse.json({
      reports: resultReports,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize),
      },
    });

    return response;
  } catch (err) {
    console.error("Report history error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
