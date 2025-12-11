"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTranslatedPlans, BillingToggle, type PlanKey, type BillingCycle, type Plan } from "@/app/components/PricingCards";
import { useLanguage } from "@/lib/i18n";
import { handleClientError } from "@/lib/client/error-handler";

// Feature comparison data - using translation keys
const getComparisonFeatures = (t: (key: string, vars?: Record<string, string>) => string) => [
  {
    category: t("pricing.comparison.category.credits" as any),
    features: [
      { name: t("pricing.comparison.feature.initialCredits" as any), free: "30", pro: "30", ultra: "30" },
      { name: t("pricing.comparison.feature.monthlyCredits" as any), free: "0", pro: "300", ultra: "1,500" },
      { name: t("pricing.comparison.feature.dailyCheckin" as any), free: "10", pro: "30", ultra: "60" },
      { name: t("pricing.comparison.feature.reportCost" as any), free: "30", pro: "30", ultra: "25" },
      { name: t("pricing.comparison.feature.creditRollover" as any), free: "-", pro: t("pricing.comparison.value.1month" as any), ultra: t("pricing.comparison.value.3months" as any) },
    ],
  },
  {
    category: t("pricing.comparison.category.core" as any),
    features: [
      { name: t("pricing.comparison.feature.reportGeneration" as any), free: true, pro: true, ultra: true },
      { name: t("pricing.comparison.feature.generationSpeed" as any), free: t("pricing.comparison.value.standard" as any), pro: t("pricing.comparison.value.priority" as any), ultra: t("pricing.comparison.value.express" as any) },
      { name: t("pricing.comparison.feature.docxExport" as any), free: false, pro: true, ultra: true },
      { name: t("pricing.comparison.feature.pdfExport" as any), free: false, pro: false, ultra: true },
      { name: t("pricing.comparison.feature.batchGeneration" as any), free: t("pricing.comparison.value.1report" as any), pro: t("pricing.comparison.value.3reports" as any), ultra: t("pricing.comparison.value.10reports" as any) },
      { name: t("pricing.comparison.feature.reportRetention" as any), free: t("pricing.comparison.value.7days" as any), pro: t("pricing.comparison.value.90days" as any), ultra: t("pricing.comparison.value.forever" as any) },
    ],
  },
  {
    category: t("pricing.comparison.category.advanced" as any),
    features: [
      { name: t("pricing.comparison.feature.customTemplates" as any), free: false, pro: false, ultra: true },
      { name: t("pricing.comparison.feature.apiAccess" as any), free: false, pro: false, ultra: true },
      { name: t("pricing.comparison.feature.webhook" as any), free: false, pro: false, ultra: true },
    ],
  },
  {
    category: t("pricing.comparison.category.support" as any),
    features: [
      { name: t("pricing.comparison.feature.responseTime" as any), free: t("pricing.comparison.value.48hours" as any), pro: t("pricing.comparison.value.24hours" as any), ultra: t("pricing.comparison.value.4hours" as any) },
      { name: t("pricing.comparison.feature.supportChannel" as any), free: t("pricing.comparison.value.community" as any), pro: t("pricing.comparison.value.email" as any), ultra: t("pricing.comparison.value.dedicated" as any) },
      { name: t("pricing.comparison.feature.memberBadge" as any), free: false, pro: true, ultra: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useSupabaseAuth();
  const { t } = useLanguage();
  const plans = useTranslatedPlans();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual"); // 默认年付

  const handleSubscribe = async (plan: PlanKey) => {
    // For free plan, just redirect to account page
    if (plan === "free") {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      router.push("/account");
      return;
    }

    // Require login first
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      setLoadingPlan(plan);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingCycle }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = (await response.json()) as { url?: string };

      if (!data?.url) {
        throw new Error("Missing checkout url");
      }

      window.location.href = data.url;
    } catch (error) {
      handleClientError(error, {
        message: "创建订阅失败，请稍后重试",
        description: "如问题持续，请联系客服",
        severity: "error",
        log: true,
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const getDisplayPrice = (plan: Plan) => {
    if (plan.isFree) return "$0";
    return billingCycle === "annual"
      ? `$${plan.annualPrice.toFixed(2)}`
      : `$${plan.monthlyPrice.toFixed(2)}`;
  };

  const getOriginalPrice = (plan: Plan) => {
    if (plan.isFree || billingCycle === "monthly") return null;
    return `$${plan.monthlyPrice.toFixed(2)}`;
  };

  const getSavingsPercent = (plan: Plan) => {
    if (plan.isFree) return 0;
    return Math.round((1 - plan.annualPrice / plan.monthlyPrice) * 100);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)", color: "var(--color-foreground)" }}>
      {/* Back Button */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-dim hover:text-foreground transition-colors"
          style={{ border: "1px solid var(--stroke-soft)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t("pricing.page.backHome" as any)}
        </button>
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 text-center space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.28em]" style={{ background: "var(--bg-layer)", border: "1px solid var(--stroke-soft)", color: "var(--accent-emerald)" }}>
            {t("pricing.page.badge" as any)}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {t("pricing.page.title" as any)}
          </h1>
          <p className="text-base sm:text-lg text-dim max-w-2xl mx-auto">
            {t("pricing.page.subtitle" as any)}
          </p>
        </header>

        {/* Billing Cycle Toggle */}
        <div className="mb-10">
          <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3 lg:gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan) => (
            <article
              key={plan.key}
              className={`glass-card p-6 sm:p-8 transition-all duration-200 flex flex-col ${
                plan.highlight
                  ? "relative border-2 shadow-[0_20px_50px_rgba(91,224,176,0.25)]"
                  : ""
              }`}
              style={{
                borderColor: plan.highlight ? "var(--accent-emerald)" : undefined,
                transform: plan.highlight ? "scale(1.05)" : undefined,
              }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-[0.24em]" style={{ background: "var(--accent-emerald)", color: "#04110c" }}>
                  {t("pricing.page.mostPopular" as any)}
                </div>
              )}

              <div className="mb-6">
                <div className="inline-block px-3 py-1 rounded-full text-xs uppercase tracking-[0.24em] mb-4" style={{ background: plan.isFree ? "rgba(107, 114, 128, 0.2)" : plan.highlight ? "rgba(91, 224, 176, 0.2)" : "rgba(139, 92, 246, 0.2)", color: plan.isFree ? "#9ca3af" : plan.highlight ? "var(--accent-emerald)" : "#a78bfa", border: `1px solid ${plan.isFree ? "rgba(107, 114, 128, 0.4)" : plan.highlight ? "rgba(91, 224, 176, 0.4)" : "rgba(139, 92, 246, 0.4)"}` }}>
                  {plan.badge}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-foreground)" }}>
                  {plan.name}
                </h3>
                <p className="text-sm text-subtle leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl sm:text-5xl font-bold" style={{ color: plan.isFree ? "var(--text-dim)" : plan.highlight ? "var(--accent-emerald)" : "#a78bfa" }}>
                    {getDisplayPrice(plan)}
                  </span>
                  {!plan.isFree && (
                    <span className="text-base text-subtle">{t("pricing.perMonth" as any)}</span>
                  )}
                </div>
                {/* Original price strikethrough for annual billing */}
                {getOriginalPrice(plan) && (
                  <p className="text-sm text-dim">
                    <span className="line-through opacity-60">{getOriginalPrice(plan)}{t("pricing.perMonth" as any)}</span>
                    <span className="ml-2 text-orange-400 font-medium">{t("pricing.save" as any, { percent: String(getSavingsPercent(plan)) })}</span>
                  </p>
                )}
                <p className="text-sm font-medium text-dim mt-2">{plan.credits}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-dim">
                    <span className="flex-shrink-0 mt-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: plan.isFree ? "rgba(107, 114, 128, 0.2)" : plan.highlight ? "rgba(91, 224, 176, 0.2)" : "rgba(139, 92, 246, 0.2)" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke={plan.isFree ? "#9ca3af" : plan.highlight ? "var(--accent-emerald)" : "#a78bfa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleSubscribe(plan.key)}
                disabled={loadingPlan === plan.key}
                className={`mt-auto w-full py-3.5 rounded-full text-sm font-bold uppercase tracking-[0.15em] transition-all duration-200 ${
                  plan.highlight
                    ? "btn-gradient"
                    : "btn-ghost"
                }`}
                style={{
                  opacity: loadingPlan === plan.key ? 0.7 : 1,
                  cursor: loadingPlan === plan.key ? "not-allowed" : "pointer",
                }}
              >
                {loadingPlan === plan.key
                  ? t("pricing.page.processing" as any)
                  : plan.isFree
                    ? (isAuthenticated ? t("pricing.page.goToAccount" as any) : t("pricing.page.freeSignup" as any))
                    : isAuthenticated
                      ? t("pricing.page.subscribe" as any, { plan: plan.name })
                      : t("pricing.page.loginToSubscribe" as any)}
              </button>

              {!plan.isFree && (
                <p className="mt-3 text-xs text-center text-subtle">
                  {t("pricing.noCreditCard" as any)}
                </p>
              )}
            </article>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "var(--color-foreground)" }}>
            {t("pricing.page.comparison.title" as any)}
          </h2>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--bg-layer)" }}>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-dim">{t("pricing.page.comparison.feature" as any)}</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-dim">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: "var(--accent-emerald)" }}>Pro</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: "#a78bfa" }}>Ultra</th>
                  </tr>
                </thead>
                <tbody>
                  {getComparisonFeatures(t).map((category, idx) => (
                    <>
                      <tr key={`category-${idx}`} style={{ background: "var(--bg-layer)", borderTop: "1px solid var(--stroke-soft)" }}>
                        <td colSpan={4} className="px-6 py-3 text-sm font-bold uppercase tracking-wider" style={{ color: "var(--accent-emerald)" }}>
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, featureIdx) => (
                        <tr key={`feature-${idx}-${featureIdx}`} className="border-t hover:bg-opacity-50 transition-colors" style={{ borderColor: "var(--stroke-soft)" }}>
                          <td className="px-6 py-4 text-sm" style={{ color: "var(--color-foreground)" }}>
                            {feature.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-center text-dim">
                            {typeof feature.free === "boolean" ? (
                              feature.free ? (
                                <svg className="inline-block" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="10" cy="10" r="10" fill="rgba(107, 114, 128, 0.2)"/>
                                  <path d="M14 7L8.5 12.5L6 10" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : (
                                <svg className="inline-block" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="10" cy="10" r="10" fill="rgba(107, 114, 128, 0.1)"/>
                                  <path d="M7 7L13 13M7 13L13 7" stroke="rgba(107, 114, 128, 0.5)" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              )
                            ) : (
                              feature.free
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-center" style={{ color: "var(--color-foreground)" }}>
                            {typeof feature.pro === "boolean" ? (
                              feature.pro ? (
                                <svg className="inline-block" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="10" cy="10" r="10" fill="rgba(91, 224, 176, 0.2)"/>
                                  <path d="M14 7L8.5 12.5L6 10" stroke="var(--accent-emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : (
                                <svg className="inline-block" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="10" cy="10" r="10" fill="rgba(107, 114, 128, 0.1)"/>
                                  <path d="M7 7L13 13M7 13L13 7" stroke="rgba(107, 114, 128, 0.5)" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              )
                            ) : (
                              feature.pro
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-center" style={{ color: "var(--color-foreground)" }}>
                            {typeof feature.ultra === "boolean" ? (
                              feature.ultra ? (
                                <svg className="inline-block" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="10" cy="10" r="10" fill="rgba(139, 92, 246, 0.2)"/>
                                  <path d="M14 7L8.5 12.5L6 10" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : (
                                <svg className="inline-block" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="10" cy="10" r="10" fill="rgba(107, 114, 128, 0.1)"/>
                                  <path d="M7 7L13 13M7 13L13 7" stroke="rgba(107, 114, 128, 0.5)" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              )
                            ) : (
                              feature.ultra
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-sm text-subtle">
            {t("pricing.page.footer.cancel" as any)}
          </p>
          <p className="text-xs text-subtle">
            {t("pricing.page.footer.credits" as any)}
          </p>
        </div>
      </div>
    </main>
  );
}
