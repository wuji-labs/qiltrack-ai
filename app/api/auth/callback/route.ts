import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore,
    });

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("交换 code 失败:", error);
        return NextResponse.redirect(
          new URL("/login?error=auth_code_exchange_failed", requestUrl.origin)
        );
      }

      // 获取当前用户
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 检查或创建用户 profile
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          });

          // 初始化报告积分
          await supabase.from("report_credits").insert({
            user_id: user.id,
            credits_available: 5, // 初始积分
            credits_used: 0,
          });
        }
      }

      return NextResponse.redirect(new URL("/", requestUrl.origin));
    } catch (error) {
      console.error("会话交换异常:", error);
      return NextResponse.redirect(
        new URL("/login?error=session_exchange_error", requestUrl.origin)
      );
    }
  }

  return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
}
