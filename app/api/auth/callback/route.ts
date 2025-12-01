import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const tokenHash = requestUrl.searchParams.get("token_hash");

  // Log callback invocation for debugging
  console.log("[AUTH] Callback invoked:", {
    hasCode: !!code,
    type,
    hasTokenHash: !!tokenHash,
    url: requestUrl.toString(),
  });

  // Detect password recovery: MUST have BOTH type=recovery AND token_hash
  // Magic links and signup confirmations may have token_hash without type=recovery
  // For password recovery, keep the hash fragment (access_token/refresh_token) by forwarding via client-side redirect.
  // A server 302 would drop the hash, so we return a tiny HTML that preserves it.
  const isRecovery = type === "recovery" && tokenHash !== null;

  if (isRecovery) {
    console.log("[AUTH] Recovery flow detected, preserving hash");
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Password recovery</title>
          <script>
            (function() {
              var search = window.location.search || "";
              var hash = window.location.hash || "";
              var target = "/account/reset-password" + search + hash;
              window.location.replace(target);
            })();
          </script>
        </head>
        <body style="background:#020617;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
          <div>Redirecting to reset password...</div>
        </body>
      </html>
    `;
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: async () => cookieStore,
    });

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[AUTH] Code exchange failed:", error);
        return NextResponse.redirect(
          new URL("/login?error=auth_code_exchange_failed", requestUrl.origin)
        );
      }

      console.log("[AUTH] Code exchange successful");

      // Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email) {
        console.log("[AUTH] Initializing profile for user:", user.id);
        // Call RPC to initialize profile and credits atomically
        try {
          const { error: rpcError } = await supabase.rpc("fn_initialize_profile", {
            p_user_id: user.id,
            p_email: user.email,
          } as never);

          if (rpcError) {
            console.error("[AUTH] Failed to initialize profile:", rpcError);
            // Don't fail the login, just log the error
          } else {
            console.log("[AUTH] Profile initialized successfully");
          }
        } catch (err) {
          console.error("[AUTH] Exception calling fn_initialize_profile:", err);
          // Don't fail the login
        }
      }

      // If this is a password recovery callback, redirect to change password page
      if (type === "recovery") {
        console.log("[AUTH] Redirecting to change password page");
        return NextResponse.redirect(new URL("/account/change-password?type=recovery", requestUrl.origin));
      }

      console.log("[AUTH] Redirecting to homepage");
      return NextResponse.redirect(new URL("/", requestUrl.origin));
    } catch (error) {
      console.error("[AUTH] Session exchange error:", error);
      return NextResponse.redirect(
        new URL("/login?error=session_exchange_error", requestUrl.origin)
      );
    }
  }

  console.log("[AUTH] No code provided, redirecting to login");
  return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
}
