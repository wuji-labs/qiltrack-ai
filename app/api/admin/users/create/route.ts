import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 服务端Supabase客户端(使用Service Role Key)
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
    const { email, password, display_name, full_name, role, plan, quota_limit } = body;

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码为必填项" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    // 1. 创建用户
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: display_name || null,
        full_name: full_name || null,
      },
    });

    if (createError) {
      console.error("Create user error:", createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // 2. 更新profiles表
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        display_name: display_name || null,
        full_name: full_name || null,
        role: role || "user",
        plan: plan || "free",
        quota_limit: quota_limit || 10,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // 不抛出错误,因为用户已创建
    }

    // 3. 初始化积分
    const initialCredits = plan === "free" ? 3 : quota_limit || 10;
    const { error: creditsError } = await supabaseAdmin.from("report_credits").insert({
      user_id: userData.user.id,
      credits_available: initialCredits,
      credits_used: 0,
    });

    if (creditsError) {
      console.error("Credits init error:", creditsError);
      // 不抛出错误,因为用户已创建
    }

    return NextResponse.json({
      success: true,
      user: userData.user,
    });
  } catch (error: unknown) {
    console.error("Create user API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建用户失败" },
      { status: 500 }
    );
  }
}
