import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: async () => cookieStore,
    });

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Code exchange failed:", error);
        return NextResponse.redirect(
          new URL("/login?error=auth_code_exchange_failed", requestUrl.origin)
        );
      }

      // Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email) {
        // Call RPC to initialize profile and credits atomically
        const { error: rpcError } = await supabase.rpc("fn_initialize_profile", {
          p_user_id: user.id,
          p_email: user.email,
        } as never);

        if (rpcError) {
          console.error("Failed to initialize profile:", rpcError);
          // Don't fail the login, just log the error
        }
      }

      // If this is a password recovery callback, redirect to change password page
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/account/change-password", requestUrl.origin));
      }

      return NextResponse.redirect(new URL("/", requestUrl.origin));
    } catch (error) {
      console.error("Session exchange error:", error);
      return NextResponse.redirect(
        new URL("/login?error=session_exchange_error", requestUrl.origin)
      );
    }
  }

  return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
}
