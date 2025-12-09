"use client";

import { useState } from "react";
import Link from "next/link";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/lib/i18n";

export default function SecuritySection() {
  const { user, authMethod, oauthProviders, supabase, resetPassword } = useSupabaseAuth();
  const { t } = useLanguage();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  const hasPassword = authMethod === "password";
  const hasGoogle = oauthProviders.some((p) => p.provider === "google");

  const handleResetPassword = async () => {
    if (!user?.email) return;

    setSendingResetEmail(true);
    setMessage(null);

    try {
      const result = await resetPassword(user.email);

      if (result.success) {
        setMessage({
          type: "success",
          text: t("account.security.resetEmailSent"),
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || t("account.security.resetEmailError"),
        });
      }
    } catch (error) {
      console.error("Failed to send reset email:", error);
      setMessage({
        type: "error",
        text: t("account.security.resetEmailError"),
      });
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handleLinkGoogle = async () => {
    if (!supabase) return;

    setMessage(null);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
      });

      if (error) {
        console.error("Failed to link Google:", error);
        setMessage({ type: "error", text: error.message || t("account.security.linkError") });
        return;
      }

      setMessage({ type: "success", text: t("account.security.linkSuccess") });

      // Refresh the page after a short delay to update the connected accounts list
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Failed to link Google:", error);
      setMessage({ type: "error", text: t("account.security.linkError") });
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!user || !supabase) return;

    // Check if user has password before unlinking
    if (!hasPassword) {
      setMessage({
        type: "error",
        text: t("account.security.unlinkWarning")
      });
      return;
    }

    if (!confirm(t("account.security.unlinkConfirm"))) {
      return;
    }

    setUnlinkingProvider(true);
    setMessage(null);

    try {
      const { data: identities } = await supabase.auth.getUserIdentities();
      const googleIdentity = identities?.identities?.find((i) => i.provider === "google");

      if (!googleIdentity) {
        throw new Error("Google identity not found");
      }

      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);

      if (error) throw error;

      setMessage({ type: "success", text: t("account.security.unlinkSuccess") });

      // Refresh the page after a short delay
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Failed to unlink Google:", error);
      setMessage({ type: "error", text: t("account.security.unlinkError") });
    } finally {
      setUnlinkingProvider(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("account.security.title")}</h2>
        <p className="mt-1 text-sm text-subtle">{t("account.security.description")}</p>
      </div>

      {message && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-green-500/20 bg-green-500/10 text-green-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Password Section */}
      <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">{t("account.security.password")}</h3>
            <p className="mt-1 text-sm text-subtle">
              {hasPassword
                ? t("account.security.passwordSet")
                : t("account.security.passwordNotSet")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={sendingResetEmail}
            className="px-4 py-2 rounded-lg border border-[var(--stroke-soft)] text-sm font-medium hover:bg-[var(--bg-base)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingResetEmail
              ? t("common.sending")
              : hasPassword
                ? t("account.security.resetPassword")
                : t("account.security.setPassword")}
          </button>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold">{t("account.security.connectedAccounts")}</h3>
          <p className="mt-1 text-sm text-subtle">{t("account.security.connectedAccountsDescription")}</p>
        </div>

        <div className="space-y-3">
          {/* Google */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-base)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Google</p>
                {hasGoogle && oauthProviders.find((p) => p.provider === "google") && (
                  <p className="text-xs text-subtle">
                    {t("account.security.connectedAt", {
                      date: new Date(
                        oauthProviders.find((p) => p.provider === "google")!.connected_at
                      ).toLocaleDateString(),
                    })}
                  </p>
                )}
              </div>
            </div>

            {hasGoogle ? (
              <button
                type="button"
                onClick={handleUnlinkGoogle}
                disabled={unlinkingProvider}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unlinkingProvider ? t("common.processing") : t("account.security.disconnect")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogle}
                className="px-4 py-2 rounded-lg border border-[var(--stroke-soft)] text-sm font-medium hover:bg-[var(--bg-base)] transition-colors"
              >
                {t("account.security.connect")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication (Future) */}
      <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-4 opacity-60">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">{t("account.security.twoFactor")}</h3>
            <p className="mt-1 text-sm text-subtle">{t("account.security.twoFactorDescription")}</p>
          </div>
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-lg border border-[var(--stroke-soft)] text-sm font-medium cursor-not-allowed"
          >
            {t("common.comingSoon")}
          </button>
        </div>
      </div>
    </div>
  );
}
