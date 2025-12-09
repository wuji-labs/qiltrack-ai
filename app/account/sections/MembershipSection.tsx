"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useMembershipTier } from "@/hooks/useMembershipTier";
import { useLanguage } from "@/lib/i18n";

export default function MembershipSection() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const membership = useMembershipTier();
  const { t } = useLanguage();
  const [reportCredits, setReportCredits] = useState<{
    credits_available: number;
    credits_used: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCredits = async () => {
      try {
        const response = await fetch("/api/report/credits");
        if (response.ok) {
          const data = await response.json();
          setReportCredits({
            credits_available: data.credits?.remaining_credits ?? 0,
            credits_used: 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch credits:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "free":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-sm font-medium border border-slate-500/20">
            <span>⚪</span>
            Free
          </span>
        );
      case "pro":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-sm font-medium border border-amber-500/20">
            <span>💎</span>
            Pro
          </span>
        );
      case "ultra":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-sm font-medium border border-purple-500/20">
            <span>👑</span>
            Ultra
          </span>
        );
      default:
        return null;
    }
  };

  const getTierFeatures = (tier: string) => {
    switch (tier) {
      case "free":
        return [
          t("account.membership.features.free.reports"),
          t("account.membership.features.free.basicAnalysis"),
          t("account.membership.features.free.exports"),
        ];
      case "pro":
        return [
          t("account.membership.features.pro.reports"),
          t("account.membership.features.pro.advancedAnalysis"),
          t("account.membership.features.pro.priority"),
          t("account.membership.features.pro.exports"),
        ];
      case "ultra":
        return [
          t("account.membership.features.ultra.unlimited"),
          t("account.membership.features.ultra.aiPowered"),
          t("account.membership.features.ultra.dedicated"),
          t("account.membership.features.ultra.api"),
          t("account.membership.features.ultra.customBranding"),
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("account.membership.title")}</h2>
        <p className="mt-1 text-sm text-subtle">{t("account.membership.description")}</p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-[var(--stroke-soft)] bg-gradient-to-br from-[var(--bg-layer)] to-[var(--bg-base)] p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold">{t("account.membership.currentPlan")}</h3>
              {getTierBadge(membership.tier)}
            </div>
            {membership.isActive && membership.expiresAt && (
              <p className="mt-2 text-sm text-subtle">
                {t("account.membership.expiresAt", {
                  date: new Date(membership.expiresAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                })}
              </p>
            )}
          </div>
          {membership.isFree ? (
            <Link
              href="/pricing"
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(251,146,60,0.3)] hover:scale-105 transition-transform"
            >
              {t("account.membership.upgrade")}
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg border border-[var(--stroke-soft)] text-sm font-medium hover:bg-[var(--bg-base)] transition-colors"
            >
              {t("account.membership.manage")}
            </Link>
          )}
        </div>

        <div className="h-px bg-[var(--stroke-soft)]" />

        <div>
          <p className="text-sm font-medium mb-3">{t("account.membership.planFeatures")}</p>
          <ul className="space-y-2">
            {getTierFeatures(membership.tier).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-subtle">
                <span className="text-[var(--accent-emerald)] mt-0.5">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Credits Balance */}
      <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">{t("account.membership.creditsBalance")}</h3>
            <p className="mt-1 text-sm text-subtle">{t("account.membership.creditsDescription")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-base)] p-4">
            <p className="text-sm text-subtle">{t("account.membership.availableCredits")}</p>
            <p className="mt-2 text-3xl font-bold text-[var(--accent-emerald)]">
              {loading ? "..." : reportCredits?.credits_available ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-base)] p-4">
            <p className="text-sm text-subtle">{t("account.membership.monthlyQuota")}</p>
            <p className="mt-2 text-3xl font-bold text-[var(--color-foreground)]">
              {membership.tier === "free" ? "30" : membership.tier === "pro" ? "300" : "∞"}
            </p>
          </div>
        </div>

        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm text-[var(--accent-emerald)] hover:underline"
        >
          {t("account.membership.getMoreCredits")}
          <span>→</span>
        </Link>
      </div>

      {/* Billing History */}
      {!membership.isFree && (
        <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold">{t("account.membership.billingHistory")}</h3>
              <p className="mt-1 text-sm text-subtle">
                {t("account.membership.billingHistoryDescription")}
              </p>
            </div>
          </div>

          <div className="text-center py-8 text-sm text-subtle">
            {t("account.membership.noBillingHistory")}
          </div>
        </div>
      )}
    </div>
  );
}
