import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 30; // 30 minutes

export async function GET(request: NextRequest) {
  try {
    // Initialize response headers for cookie writeback
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];

    // Get Supabase server client with cookie handling
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

    // Get pagination params
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10")));
    const offset = (page - 1) * pageSize;

    // Query report history with RLS (automatically filtered by user_id via RLS)
    const { data: reports, error: queryError, count } = await supabase
      .from("report_runs")
      .select("id, symbol, created_at, status, markdown_path, docx_path, mode", { count: "exact" })
      .eq("user_id", userId as never)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (queryError) {
      console.error("Failed to fetch report history:", queryError);
      const response = NextResponse.json(
        { error: "Failed to fetch report history" },
        { status: 500 }
      );
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    let resultReports = reports || [];

    try {
      const serviceClient = createServiceRoleClient();
      const mapWithSignedUrls = async () => {
        if (!reports?.length) return [];
        return Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reports.map(async (report: any) => {
            const docxSigned =
              report.docx_path
                ? await serviceClient.storage
                    .from("report-assets")
                    .createSignedUrl(report.docx_path, SIGNED_URL_TTL_SECONDS)
                : null;
            const markdownSigned =
              report.markdown_path
                ? await serviceClient.storage
                    .from("report-assets")
                    .createSignedUrl(report.markdown_path, SIGNED_URL_TTL_SECONDS)
                : null;

            return {
              ...report,
              docx_signed_url: docxSigned?.data?.signedUrl ?? null,
              markdown_signed_url: markdownSigned?.data?.signedUrl ?? null,
            };
          })
        );
      };
      resultReports = await mapWithSignedUrls();
    } catch (signError) {
      console.warn("Failed to sign report history downloads", signError);
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

    responseCookies.forEach(({ name, value }) => {
      response.headers.append("Set-Cookie", `${name}=${value}`);
    });

    return response;
  } catch (err) {
    console.error("Report history error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
