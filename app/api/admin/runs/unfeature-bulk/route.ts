import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/runs/unfeature-bulk
 * Bulk unfeature reports (admin only)
 *
 * Body:
 * - older_than_days: Remove featured status for reports older than N days (required)
 *
 * Returns:
 * - affected_count: Number of reports unfeatured
 */
export async function POST(request: NextRequest) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAdmin =
      (profile as any).plan === "admin" || (profile as any).email?.endsWith("@investor.ai");

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

    // Parse request body
    const body = await request.json();
    const olderThanDays = body.older_than_days || 30;

    if (typeof olderThanDays !== "number" || olderThanDays < 1) {
      const response = NextResponse.json(
        { error: "Invalid older_than_days parameter" },
        { status: 400 }
      );
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Update reports older than cutoff
    const { data, error: updateError } = await supabase
      .from("report_runs")
      .update({ is_featured: false })
      .eq("is_featured", true)
      .lte("created_at", cutoffDate.toISOString())
      .select("id");

    if (updateError) {
      console.error("Failed to bulk unfeature reports:", updateError);
      const response = NextResponse.json(
        { error: "Failed to bulk unfeature reports" },
        { status: 500 }
      );
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    const affectedCount = data?.length || 0;

    const response = NextResponse.json({
      success: true,
      affected_count: affectedCount,
      older_than_days: olderThanDays,
    });
    responseCookies.forEach(({ name, value }) => {
      response.headers.append("Set-Cookie", `${name}=${value}`);
    });
    return response;
  } catch (err) {
    console.error("Bulk unfeature error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
