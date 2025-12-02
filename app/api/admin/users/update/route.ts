import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, display_name, full_name, role, plan, quota_limit } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "用户ID为必填项" },
        { status: 400 }
      );
    }

    // 更新profiles表
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        display_name,
        full_name,
        role,
        plan,
        quota_limit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Update user error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Update user API error:", error);
    return NextResponse.json(
      { error: error.message || "更新用户失败" },
      { status: 500 }
    );
  }
}
