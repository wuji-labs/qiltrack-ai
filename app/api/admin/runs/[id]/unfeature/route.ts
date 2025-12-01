import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/runs/[id]/unfeature
 * Remove featured status from a report (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      const response = NextResponse.json({ error: "Failed to verify admin status" }, { status: 500 });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAdmin = (profile as any).plan === "admin" || (profile as any).email?.endsWith("@investor.ai");

    if (!isAdmin) {
      const response = NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    const runId = params.id;

    // Update the report to remove featured status
    const { error: updateError } = await supabase
      .from("report_runs")
      .update({ is_featured: false })
      .eq("id", runId);

    if (updateError) {
      console.error("Failed to unfeature report:", updateError);
      const response = NextResponse.json(
        { error: "Failed to unfeature report" },
        { status: 500 }
      );
      responseCookies.forEach(({ name, value }) => {
        response.headers.append("Set-Cookie", `${name}=${value}`);
      });
      return response;
    }

    const response = NextResponse.json({ success: true, run_id: runId });
    responseCookies.forEach(({ name, value }) => {
      response.headers.append("Set-Cookie", `${name}=${value}`);
    });
    return response;
  } catch (err) {
    console.error("Unfeature report error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
