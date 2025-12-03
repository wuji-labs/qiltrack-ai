import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

const SIGNED_URL_TTL_SECONDS = 60 * 30; // 30 minutes

export async function GET(request: NextRequest) {
  try {
    // Get user session using the same approach as credits API
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.warn(`[UNAUTHORIZED_SESSION] error: ${sessionError?.message || "no session"}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get pagination params
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10")));
    const offset = (page - 1) * pageSize;

    // Query report history from report_posts table (where reports are actually saved)
    const {
      data: reports,
      error: queryError,
      count,
    } = await supabase
      .from("report_posts")
      .select(
        "id, symbol, created_at, status, slug, report_run_id, tone, lang",
        { count: "exact" }
      )
      .eq("user_id", userId as never)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (queryError) {
      console.error("Failed to fetch report history:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch report history" },
        { status: 500 }
      );
    }

    let resultReports = reports || [];

    // For report_posts table, we don't have file paths, but we can generate links to view the reports
    try {
      const mapReportPosts = async () => {
        if (!reports?.length) return [];
        return reports.map((report: any) => {
          return {
            ...report,
            // Map report_posts fields to expected history format
            mode: report.tone, // tone field maps to mode
            // Generate view links based on slug or report_run_id
            markdown_signed_url: report.slug ? `/reports/${report.slug}` : null,
            docx_signed_url: null, // No DOCX export for report_posts yet
            pdf_signed_url: null,  // No PDF export for report_posts yet
          };
        });
      };
      resultReports = await mapReportPosts();
    } catch (mapError) {
      console.warn("Failed to map report history", mapError);
      resultReports = reports || [];
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
