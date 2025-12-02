"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/lib/i18n";

export default function ChangePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, authMethod, oauthProviders } = useSupabaseAuth();
  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if this is a password recovery flow
  // User is in recovery mode if they have a "type=recovery" parameter
  // (passed from callback route after successful code exchange)
  const isPasswordRecovery = searchParams.get("type") === "recovery";

  // Redirect if not authenticated (unless it's password recovery)
  useEffect(() => {
    if (!isAuthenticated && !isPasswordRecovery) {
      router.push("/login");
    }
  }, [isAuthenticated, isPasswordRecovery, router]);

  // Check if user uses OAuth (no password to change)
  const isOAuthUser = authMethod === "oauth" && oauthProviders.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation for password recovery (no current password needed)
    if (isPasswordRecovery) {
      if (!newPassword || !confirmPassword) {
        setError(t("password.error.allFieldsRequired") || "All fields are required");
        return;
      }

      if (newPassword.length < 8) {
        setError(t("password.error.tooShort") || "New password must be at least 8 characters");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError(t("password.error.mismatch") || "New passwords do not match");
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newPassword,
            isRecovery: true,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || t("password.error.failed") || "Failed to change password");
          return;
        }

        setSuccess(true);
        setNewPassword("");
        setConfirmPassword("");

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (err) {
        console.error("Password reset error:", err);
        setError(t("password.error.network") || "Network error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal password change (requires current password)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("password.error.allFieldsRequired") || "All fields are required");
      return;
    }

    if (newPassword.length < 8) {
      setError(t("password.error.tooShort") || "New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("password.error.mismatch") || "New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("password.error.failed") || "Failed to change password");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to account page after 2 seconds
      setTimeout(() => {
        router.push("/account");
      }, 2000);
    } catch (err) {
      console.error("Password change error:", err);
      setError(t("password.error.network") || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated && !isPasswordRecovery) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 font-bold tracking-[0.16em] text-emerald-200 shadow-lg">
            IA
          </div>
          <h1 className="text-2xl font-semibold">
            {isPasswordRecovery
              ? t("auth.resetPassword.title") || "Reset Password"
              : t("password.title") || "Change Password"}
          </h1>
          <p className="text-sm text-slate-400">
            {isPasswordRecovery
              ? t("auth.resetPassword.subtitle") || "Set your new password"
              : t("password.subtitle") || "Update your account password"}
          </p>
        </div>

        {/* Success/Error Banner */}
        {(success || error) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              success
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                : "border-amber-500/50 bg-amber-500/10 text-amber-100"
            }`}
            role="status"
          >
            {success ? (
              <>✓ {t("password.success") || "Password changed successfully! Redirecting..."}</>
            ) : (
              error
            )}
          </div>
        )}

        {/* OAuth User Notice */}
        {isOAuthUser && !isPasswordRecovery && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-emerald-400 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-slate-100">
                  {t("password.oauth.title") || "OAuth Account"}
                </h3>
                <p className="text-sm text-slate-400">
                  {t("password.oauth.message") ||
                    `You're signed in with ${oauthProviders.map((p) => p.provider).join(", ")}. OAuth accounts don't have passwords.`}
                </p>
              </div>
            </div>
            <Link
              href="/account"
              className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              ← {t("password.oauth.backToAccount") || "Back to Account"}
            </Link>
          </div>
        )}

        {/* Password Change Form */}
        {!isOAuthUser && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] p-6 space-y-4">
              {/* Current Password - Only show for logged-in users changing password */}
              {!isPasswordRecovery && (
                <div className="space-y-2">
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-slate-300"
                  >
                    {t("password.currentPassword") || "Current Password"}
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
              )}

              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="new-password" className="block text-sm font-medium text-slate-300">
                  {t("password.newPassword") || "New Password"}
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <p className="text-xs text-slate-500">
                  {t("password.hint") || "At least 8 characters"}
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-slate-300"
                >
                  {t("password.confirmPassword") || "Confirm New Password"}
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-600 transition-colors ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading
                  ? t("auth.form.loading") || "Updating..."
                  : isPasswordRecovery
                    ? t("auth.resetPassword.submit") || "Reset Password"
                    : t("password.submit") || "Update Password"}
              </button>

              {/* Back Link */}
              <div className="text-center">
                <Link
                  href={isPasswordRecovery ? "/login" : "/account"}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  ←{" "}
                  {isPasswordRecovery
                    ? t("auth.backToLogin") || "Back to Login"
                    : t("password.backToAccount") || "Back to Account"}
                </Link>
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center">
          <Link className="text-emerald-300 hover:underline" href="/legal/privacy">
            Privacy Policy
          </Link>
          {" • "}
          <Link className="text-emerald-300 hover:underline" href="/legal/terms">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
