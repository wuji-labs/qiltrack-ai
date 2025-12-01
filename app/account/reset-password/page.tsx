"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/lib/i18n";
import { parseRecoveryTokens, hasRecoveryTokens } from "@/lib/auth/parseRecoveryTokens";

type Status = "verifying" | "success" | "error";

/**
 * Reset Password Redirect Page
 *
 * Handles Supabase recovery links that return tokens in URL hash (#access_token / #code).
 * On success, stores session and redirects to /account/change-password?type=recovery.
 */
export default function ResetPasswordRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useSupabaseAuth();
  const { t } = useLanguage();

  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const resolveRecovery = async () => {
			try {
				const hash = typeof window !== "undefined" ? window.location.hash : "";
				const tokens = parseRecoveryTokens({ searchParams, hash });

				// Missing all required parameters - show link expired
				if (!hasRecoveryTokens(tokens)) {
					setStatus("error");
					setErrorMessage(t("auth.resetPassword.linkExpired"));
					return;
				}

				// Attempt session restoration in priority order
				if (tokens.code) {
					const { error } = await supabase.auth.exchangeCodeForSession(tokens.code);
					if (error) throw error;
				} else if (tokens.accessToken && tokens.refreshToken) {
					const { error } = await supabase.auth.setSession({
						access_token: tokens.accessToken,
						refresh_token: tokens.refreshToken,
					});
					if (error) throw error;
				} else if (tokens.tokenHash) {
					const { error } = await supabase.auth.verifyOtp({
						type: "recovery",
						token_hash: tokens.tokenHash,
					});
					if (error) throw error;
				}

				setStatus("success");
				router.replace("/account/change-password?type=recovery");
			} catch (err) {
				console.error("Password recovery session error:", err);
				setStatus("error");
				// Prioritize expired link message for Supabase-specific expiration errors
				const errObj = err as { code?: string; message?: string };
				const msg = errObj?.message?.toLowerCase() || "";
				const isExpired =
					errObj?.code === "otp_expired" ||
					msg.includes("expired") ||
					msg.includes("invalid or expired");
				setErrorMessage(isExpired ? t("auth.resetPassword.linkExpired") : t("auth.error.generic"));
			}
		};

    void resolveRecovery();
  }, [router, searchParams, supabase, t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 font-bold tracking-[0.16em] text-emerald-200 shadow-lg">
            IA
          </div>
          <h1 className="text-2xl font-semibold">
            {t("auth.resetPassword.title") || "Reset Password"}
          </h1>
          <p className="text-sm text-slate-400">
            {status === "error"
              ? errorMessage
              : t("auth.resetPassword.redirecting") || "Please wait while we redirect you..."}
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] p-8 space-y-4">
          <div className="flex flex-col items-center gap-4">
            {/* Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
              <div
                className={`absolute inset-0 border-4 ${
                  status === "error" ? "border-amber-400" : "border-emerald-400"
                } rounded-full border-t-transparent ${status === "error" ? "" : "animate-spin"}`}
              ></div>
            </div>

            {/* Status Text */}
            <div className="text-center space-y-2">
              <p className="text-base text-slate-300 font-medium">
                {status === "error" ? errorMessage : t("auth.resetPassword.description")}
              </p>
              {status !== "error" && (
                <p className="text-sm text-slate-500">{t("auth.resetPassword.emailSent")}</p>
              )}
            </div>
          </div>

          {status === "error" && (
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/login?view=reset-password"
                className="text-sm text-emerald-300 hover:text-emerald-200 underline"
              >
                {t("auth.resetPassword.backToSignin")}
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center">
          <Link className="text-emerald-300 hover:underline" href="/legal/privacy">
            Privacy Policy
          </Link>
          {" 鈥?"}
          <Link className="text-emerald-300 hover:underline" href="/legal/terms">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
