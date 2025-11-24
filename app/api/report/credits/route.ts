import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Get Supabase server client
    const supabase = createServerClient({
      get: (name: string) => {
        const cookieValue = request.cookies.get(name)?.value;
        return cookieValue ? { value: cookieValue } : undefined;
      },
    });

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Query quota view (RLS-protected)
    const { data: quotaData, error: quotaError } = await supabase
      .from("v_user_quota")
      .select("user_id, remaining_credits")
      .eq("user_id", userId)
      .single();

    if (quotaError) {
      console.error("Failed to fetch quota:", quotaError);
      return NextResponse.json(
        { error: "Failed to fetch quota information" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      userId,
      credits: quotaData || {
        remaining_credits: 0,
      },
    });
  } catch (err) {
    console.error("Credits API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
