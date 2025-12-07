"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useMembershipTier } from "@/hooks/useMembershipTier";
import { useLanguage } from "@/lib/i18n";
import { LANGUAGE_OPTIONS } from "@/lib/i18n-config";

type Preferences = {
  language: string;
  timezone: string;
  emailAlerts: boolean;
  saveHistory: boolean;
};

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get('success') === 'true';
  const { isAuthenticated, user, authMethod, oauthProviders, getReportCredits, signOut } =
    useSupabaseAuth();
  const membership = useMembershipTier();
  const { language, setLanguage, t } = useLanguage();
  const [prefs, setPrefs] = useState<Preferences>({
    language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emailAlerts: true,
    saveHistory: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [reportCredits, setReportCredits] = useState<{
    credits_available: number;
    credits_used: number;
  } | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentSuccess);

  // 清除 URL 中的 success 参数，避免刷新时重复显示
  useEffect(() => {
    if (paymentSuccess) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      // 5秒后自动隐藏成功提示
      const timer = setTimeout(() => setShowSuccessBanner(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess]);

  const PREF_KEY = "ia-account-preferences";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Preferences;
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore malformed data
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    setPrefs((prev) => (prev.language === language ? prev : { ...prev, language }));
  }, [language]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }, [prefs, loaded]);

  // Fetch real quota from /api/report/credits on component mount and auto-refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCredits = async () => {
      try {
        const response = await fetch("/api/report/credits");
        if (response.ok) {
          const data = await response.json();
          // Map API response to component state
          setReportCredits({
            credits_available: data.credits?.remaining_credits ?? 0,
            credits_used: 0, // For display; actual tracking is in Supabase
          });
        }
      } catch (err) {
        console.error("Failed to fetch credits:", err);
      }
    };

    // Fetch immediately
    fetchCredits();

    // Auto-refresh every 30 seconds to keep quota in sync
    const interval = setInterval(fetchCredits, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-6 text-center shadow-xl">
          <h1 className="text-2xl font-semibold">{t("account.page.title")}</h1>
          <p className="text-sm text-subtle">{t("account.page.loginPrompt")}</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full rounded-xl bg-[var(--accent-emerald)] py-2.5 text-base font-semibold text-slate-950 shadow-[0_12px_28px_rgba(91,224,176,0.28)] transition hover:brightness-105"
          >
            {t("account.page.signIn")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-xl border border-[var(--stroke-soft)] py-2.5 text-base text-dim hover:text-[var(--color-foreground)]"
          >
            {t("account.page.returnHome")}
          </button>
        </div>
      </div>
    );
  }

  const avatarInitial = user?.email ? user.email.charAt(0).toUpperCase() : "A";

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-6">
        <div className="flex items-center gap-3 text-sm text-subtle">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-3 py-1.5 hover:text-[var(--color-foreground)]"
          >
            <span className="text-base">←</span>
            {t("account.page.backLabel")}
          </Link>
          <span>{t("account.page.title")}</span>
        </div>

        <div className="rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] space-y-6">
          {/* 支付成功提示 */}
          {showSuccessBanner && (
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>订阅成功！</strong> 您的会员已激活，积分已到账。感谢您的支持！
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccessBanner(false)}
                className="text-emerald-300 hover:text-emerald-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="h-12 w-12 rounded-full bg-[var(--accent-emerald)]/20 border border-[var(--stroke-soft)] overflow-hidden flex items-center justify-center text-base font-semibold text-[var(--accent-emerald)]">
              {avatarInitial}
            </span>
            <div className="flex-1">
              <p className="text-lg font-semibold">{user?.email ?? t("auth.session.fallback")}</p>
              <p className="text-sm text-subtle">
                {t("account.page.planLabel")}:{" "}
                {membership.loading ? (
                  "..."
                ) : membership.tier === "free" ? (
                  "免费版"
                ) : membership.tier === "pro" ? (
                  <span className="text-amber-300">Pro 月费会员</span>
                ) : (
                  <span className="text-purple-300">年费会员</span>
                )}
                {membership.isActive && membership.expiresAt && (
                  <span className="text-xs ml-2 text-dim">
                    到期: {new Date(membership.expiresAt).toLocaleDateString("zh-CN")}
                  </span>
                )}
              </p>
            </div>
            {!membership.isFree && (
              <Link
                href="/pricing"
                className="rounded-xl border border-[var(--stroke-soft)] px-4 py-2 text-sm text-subtle hover:text-[var(--color-foreground)] hover:border-[var(--accent-emerald)]/50"
              >
                管理订阅
              </Link>
            )}
            {membership.isFree && (
              <Link
                href="/pricing"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(251,146,60,0.3)] hover:scale-105"
              >
                升级会员
              </Link>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-2">
              <p className="text-sm text-subtle">{t("account.page.remainingTitle")}</p>
              <p className="text-3xl font-bold text-[var(--accent-emerald)]">
                {reportCredits === null
                  ? "..."
                  : reportCredits.credits_available <= 0
                    ? 0
                    : reportCredits.credits_available}
              </p>
              <p className="text-sm text-dim">{t("account.page.remainingNote")}</p>
            </div>
            <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-2">
              <p className="text-sm text-subtle">{t("account.page.planSectionTitle")}</p>
              <p className="text-base text-[var(--color-foreground)]">
                {t("account.page.planStatus", { plan: "free" })}
              </p>
              <p className="text-sm text-dim">{t("account.page.planNote")}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-3">
              <p className="text-sm text-subtle">{t("account.page.languageLabel")}</p>
              <select
                value={prefs.language}
                onChange={(e) => {
                  setPrefs((prev) => ({ ...prev, language: e.target.value }));
                  setLanguage(e.target.value as typeof language);
                }}
                className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3 py-2 text-base text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="text-[var(--color-foreground)] bg-[var(--bg-base)]"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-subtle">{t("account.page.subtitle")}</p>
            </div>

            <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-3">
              <p className="text-sm text-subtle">{t("account.page.timezoneLabel")}</p>
              <input
                type="text"
                value={prefs.timezone}
                onChange={(e) => setPrefs((prev) => ({ ...prev, timezone: e.target.value }))}
                className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] px-3 py-2 text-base text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
              />
              <p className="text-xs text-subtle">{t("account.page.timezoneNote")}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-3">
              <p className="text-sm text-subtle">{t("account.page.notificationsLabel")}</p>
              <label className="flex items-center gap-3 text-sm text-[var(--color-foreground)]">
                <input
                  type="checkbox"
                  checked={prefs.emailAlerts}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, emailAlerts: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--accent-emerald)]"
                />
                <span>{t("account.page.emailAlerts")}</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-[var(--color-foreground)]">
                <input
                  type="checkbox"
                  checked={prefs.saveHistory}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, saveHistory: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--accent-emerald)]"
                />
                <span>{t("account.page.saveHistory")}</span>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">Report history</p>
              <p className="text-sm text-subtle">{t("account.page.saveHistory")}</p>
            </div>
            <Link
              href="/account/history"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-[var(--accent-emerald)] hover:text-[var(--color-foreground)]"
            >
              View history
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)]"
            >
              {t("account.page.returnHome")}
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-emerald)] px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(91,224,176,0.28)] hover:brightness-105"
            >
              {t("auth.account.signout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
