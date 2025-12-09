import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { appendCookies } from "@/lib/utils/cookie-helper";

/**
 * GET /api/report/popular
 * Get popular symbols ranked by generation count
 *
 * Query params:
 * - range: Time range in days (optional, default: 30)
 * - limit: Number of results to return (optional, default: 20)
 *
 * Returns:
 * - symbols: Array of {symbol, generation_count, latest_created_at}
 */
export async function GET(request: NextRequest) {
  try {
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];

    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get("range") || "30");
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

    // Call the database function to get popular symbols
    const { data, error } = await supabase.rpc("fn_get_popular_symbols", {
      p_range_days: range,
      p_limit: limit,
    });

    if (error) {
      console.error("Failed to fetch popular symbols:", error);
      const response = NextResponse.json(
        { error: "Failed to fetch popular symbols" },
        { status: 500 }
      );
      appendCookies(response, responseCookies);
      return response;
    }

    const response = NextResponse.json({
      symbols: data || [],
      range_days: range,
      limit,
    });

    appendCookies(response, responseCookies);

    return response;
  } catch (err) {
    console.error("Popular symbols error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
