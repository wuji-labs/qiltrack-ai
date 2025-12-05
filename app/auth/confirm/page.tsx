"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useLanguage } from "@/lib/i18n";

/**
 * Universal auth confirmation handler
 *
 * This page handles:
 * - Magic link confirmation (type=magiclink)
 * - Password reset confirmation (type=recovery)
 * - Email confirmation (type=signup)
 *
 * It uses Supabase client to verify the OTP token
 */

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!tokenHash || !type) {
      // Missing parameters, redirect to login with error
      router.push("/login?error=invalid_confirmation_link");
      return;
    }

    const supabase = createClientComponentClient();

    async function verifyToken() {
      try {
        console.log("[AUTH CONFIRM] Verifying token:", { type, tokenHash: tokenHash?.substring(0, 20) + "..." });

        // For magic link, verify using verifyOtp
        if (type === "magiclink" || type === "signup") {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash!,
            type: type === "signup" ? "signup" : "magiclink",
          });

          if (error) {
            console.error("[AUTH CONFIRM] Verification failed:", error);
            setError(error.message);
            setTimeout(() => router.push("/login?error=" + encodeURIComponent(error.message)), 2000);
            return;
          }

          if (data.session) {
            console.log("[AUTH CONFIRM] Verification successful, user logged in");
            // Redirect to home
            router.push("/");
            return;
          }
        }

        // For password recovery, verify token and redirect to change-password page
        if (type === "recovery") {
          console.log("[AUTH CONFIRM] Recovery flow, verifying token");

          // Verify the recovery token
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash!,
            type: "recovery",
          });

          if (error) {
            console.error("[AUTH CONFIRM] Recovery verification failed:", error);
            setError(error.message);
            setTimeout(() => router.push("/login?error=" + encodeURIComponent(error.message)), 2000);
            return;
          }

          if (data.session) {
            console.log("[AUTH CONFIRM] Recovery token verified, session established");
            // Redirect to change-password page with recovery flag
            router.push("/account/change-password?type=recovery");
            return;
          }
        }

        // Unknown type
        setError("Unknown confirmation type: " + type);
        setTimeout(() => router.push("/login"), 2000);

      } catch (err) {
        console.error("[AUTH CONFIRM] Exception:", err);
        setError("Verification failed: " + (err as Error).message);
        setTimeout(() => router.push("/login"), 2000);
      }
    }

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center">
      <div className="text-center space-y-4">
        {!error ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-emerald)] mx-auto"></div>
            <p className="text-base text-subtle">{t("auth.confirm.verifying")}</p>
            <p className="text-sm text-dim">{t("auth.confirm.pleaseWait")}</p>
          </>
        ) : (
          <>
            <div className="text-red-500 text-4xl">✗</div>
            <p className="text-base text-red-400">{t("auth.confirm.failed")}</p>
            <p className="text-sm text-dim">{error}</p>
            <p className="text-xs text-subtle">{t("auth.confirm.redirecting")}</p>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-emerald)] mx-auto"></div>
        <p className="text-base text-subtle">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthConfirmContent />
    </Suspense>
  );
}
