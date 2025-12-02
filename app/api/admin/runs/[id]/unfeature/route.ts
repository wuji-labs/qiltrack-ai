import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/runs/[id]/unfeature
 * Remove featured status from a report (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      (profile as { plan?: string; email?: string }).email?.endsWith("@investor.ai");

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

    const { id: runId } = await params;

    // TODO: is_featured field not in database yet
    // const { error: updateError } = await supabase
    //   .from("report_runs")
    //   .update({ is_featured: false })
    //   .eq("id", runId);

    // if (updateError) {
    //   console.error("Failed to unfeature report:", updateError);
    //   const response = NextResponse.json({ error: "Failed to unfeature report" }, { status: 500 });
    //   responseCookies.forEach(({ name, value }) => {
    //     response.headers.append("Set-Cookie", `${name}=${value}`);
    //   });
    //   return response;
    // }

    // Temporary: just return success without updating
    const response = NextResponse.json({ success: true, run_id: runId, message: "Unfeature flag not implemented yet" });
    responseCookies.forEach(({ name, value }) => {
      response.headers.append("Set-Cookie", `${name}=${value}`);
    });
    return response;
  } catch (err) {
    console.error("Unfeature report error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
