import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Initialize response headers for cookie writeback
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];

    // Get Supabase server client with cookie handling
    const supabase = createServerClient(
      (name: string) => {
        const cookieValue = request.cookies.get(name)?.value;
        return cookieValue ? { value: cookieValue } : undefined;
      },
      (cookies) => {
        responseCookies.push(...cookies);
      }
    );

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
    const pageSize = Math.min(50, parseInt(url.searchParams.get("limit") || "10"));
    const offset = (page - 1) * pageSize;

    // Query report history with RLS (automatically filtered by user_id via RLS)
    const { data: reports, error: queryError, count } = await supabase
      .from("report_runs")
      .select("id, symbol, created_at, status", { count: "exact" })
      .eq("user_id", userId)
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

    const response = NextResponse.json({
      reports: reports || [],
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
