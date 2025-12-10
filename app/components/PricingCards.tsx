"use client";

import { useState, memo } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/lib/i18n";

export type PlanKey = "free" | "pro" | "ultra";
export type BillingCycle = "monthly" | "annual";

export type Plan = {
  key: PlanKey;
  name: string;
  badge: string;
  monthlyPrice: number;
  annualPrice: number;
  highlight?: boolean;
  popular?: boolean;
  isFree?: boolean;
};

// Plan configuration without translated text
export const planConfigs: Plan[] = [
  {
    key: "free",
    name: "Free",
    badge: "FREE",
    monthlyPrice: 0,
    annualPrice: 0,
    isFree: true,
  },
  {
    key: "pro",
    name: "Pro",
    badge: "PRO",
    monthlyPrice: 14.99,
    annualPrice: 9.99,
    highlight: true,
    popular: true,
  },
  {
    key: "ultra",
    name: "Ultra",
    badge: "ULTRA",
    monthlyPrice: 44.99,
    annualPrice: 29.99,
  },
];

// Hook to get translated plan data
export function useTranslatedPlans() {
  const { t } = useLanguage();

  return planConfigs.map((plan) => ({
    ...plan,
    credits: t(`pricing.plan.${plan.key}.feature1` as any),
    description: t(`pricing.plan.${plan.key}.caption` as any),
    features: plan.key === "free"
      ? [
          t("pricing.plan.free.feature1" as any),
          t("pricing.plan.free.feature2" as any),
          t("pricing.plan.free.feature3" as any),
          t("pricing.plan.free.feature4" as any),
          t("pricing.plan.free.feature5" as any),
        ]
      : plan.key === "pro"
      ? [
          t("pricing.plan.pro.feature1" as any),
          t("pricing.plan.pro.feature2" as any),
          t("pricing.plan.pro.feature3" as any),
          t("pricing.plan.pro.feature4" as any),
          t("pricing.plan.pro.feature5" as any),
        ]
      : [
          t("pricing.plan.ultra.feature1" as any),
          t("pricing.plan.ultra.feature2" as any),
          t("pricing.plan.ultra.feature3" as any),
          t("pricing.plan.ultra.feature4" as any),
          t("pricing.plan.ultra.feature5" as any),
          t("pricing.plan.ultra.feature6" as any),
          t("pricing.plan.ultra.feature7" as any),
        ],
  }));
}

// Keep legacy export for backward compatibility
export const plans = planConfigs;

// Billing Toggle Component
export function BillingToggle({
  billingCycle,
  onChange,
}: {
  billingCycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={`text-sm font-medium cursor-pointer transition-colors ${
          billingCycle === "monthly" ? "text-foreground" : "text-dim"
        }`}
        onClick={() => onChange("monthly")}
      >
        {t("pricing.billing.monthly" as any)}
      </span>

      <button
        type="button"
        onClick={() => onChange(billingCycle === "annual" ? "monthly" : "annual")}
        className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          background: billingCycle === "annual" ? "var(--accent-emerald)" : "var(--bg-layer)",
          border: "1px solid var(--stroke-soft)",
        }}
        aria-label="Toggle billing cycle"
      >
        <span
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform"
          style={{
            transform: billingCycle === "annual" ? "translateX(30px)" : "translateX(4px)",
          }}
        />
      </button>

      <span
        className={`text-sm font-medium cursor-pointer transition-colors ${
          billingCycle === "annual" ? "text-foreground" : "text-dim"
        }`}
        onClick={() => onChange("annual")}
      >
        {t("pricing.billing.annual" as any)}
      </span>

      <span
        className="ml-2 px-3 py-1 rounded-full text-xs font-bold"
        style={{
          background: "rgba(251, 146, 60, 0.15)",
          color: "#fb923c",
          border: "1px solid rgba(251, 146, 60, 0.3)",
        }}
      >
        {t("pricing.billing.save33" as any)}
      </span>
    </div>
  );
}

// Extended plan type with translated content
type TranslatedPlan = Plan & {
  credits?: string;
  description?: string;
  features?: string[];
};

// Pricing Card Component
function PricingCard({
  plan,
  billingCycle,
  onSubscribe,
  loading,
  isAuthenticated,
}: {
  plan: TranslatedPlan;
  billingCycle: BillingCycle;
  onSubscribe: (key: PlanKey) => void;
  loading: boolean;
  isAuthenticated: boolean;
}) {
  const { t } = useLanguage();

  const getDisplayPrice = () => {
    if (plan.isFree) return "$0";
    return billingCycle === "annual"
      ? `$${plan.annualPrice.toFixed(2)}`
      : `$${plan.monthlyPrice.toFixed(2)}`;
  };

  const getOriginalPrice = () => {
    if (plan.isFree || billingCycle === "monthly") return null;
    return `$${plan.monthlyPrice.toFixed(2)}`;
  };

  const getSavingsPercent = () => {
    if (plan.isFree) return 0;
    return Math.round((1 - plan.annualPrice / plan.monthlyPrice) * 100);
  };

  const getButtonText = () => {
    if (loading) return t("auth.form.loading" as any);
    if (plan.isFree) return isAuthenticated ? t("pricing.plan.free.cta" as any) : t("pricing.plan.free.cta" as any);
    return t(`pricing.plan.${plan.key}.cta` as any);
  };

  return (
    <article
      className={`rounded-3xl p-6 sm:p-8 transition-all duration-200 flex flex-col ${
        plan.highlight
          ? "relative border-2 shadow-[0_20px_50px_rgba(91,224,176,0.25)]"
          : "border"
      }`}
      style={{
        background: "var(--bg-layer)",
        borderColor: plan.highlight ? "var(--accent-emerald)" : "var(--stroke-soft)",
        transform: plan.highlight ? "scale(1.02)" : undefined,
      }}
    >
      {plan.popular && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-[0.24em]"
          style={{ background: "var(--accent-emerald)", color: "#04110c" }}
        >
          {t("pricing.plan.pro.badge" as any)}
        </div>
      )}

      <div className="mb-6">
        <div
          className="inline-block px-3 py-1 rounded-full text-xs uppercase tracking-[0.24em] mb-4"
          style={{
            background: plan.isFree
              ? "rgba(107, 114, 128, 0.2)"
              : plan.highlight
                ? "rgba(91, 224, 176, 0.2)"
                : "rgba(139, 92, 246, 0.2)",
            color: plan.isFree
              ? "#9ca3af"
              : plan.highlight
                ? "var(--accent-emerald)"
                : "#a78bfa",
            border: `1px solid ${
              plan.isFree
                ? "rgba(107, 114, 128, 0.4)"
                : plan.highlight
                  ? "rgba(91, 224, 176, 0.4)"
                  : "rgba(139, 92, 246, 0.4)"
            }`,
          }}
        >
          {plan.badge}
        </div>
        <h3
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: "var(--color-foreground)" }}
        >
          {plan.name}
        </h3>
        <p className="text-sm text-subtle leading-relaxed">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="text-4xl sm:text-5xl font-bold"
            style={{
              color: plan.isFree
                ? "var(--text-dim)"
                : plan.highlight
                  ? "var(--accent-emerald)"
                  : "#a78bfa",
            }}
          >
            {getDisplayPrice()}
          </span>
          {!plan.isFree && <span className="text-base text-subtle">{t("pricing.perMonth" as any)}</span>}
        </div>
        {getOriginalPrice() && (
          <p className="text-sm text-dim">
            <span className="line-through opacity-60">{getOriginalPrice()}{t("pricing.perMonth" as any)}</span>
            <span className="ml-2 text-orange-400 font-medium">{t("pricing.save" as any, { percent: String(getSavingsPercent()) })}</span>
          </p>
        )}
        <p className="text-sm font-medium text-dim mt-2">{plan.credits}</p>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {(plan.features || []).map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-dim">
            <span
              className="flex-shrink-0 mt-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: plan.isFree
                  ? "rgba(107, 114, 128, 0.2)"
                  : plan.highlight
                    ? "rgba(91, 224, 176, 0.2)"
                    : "rgba(139, 92, 246, 0.2)",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke={
                    plan.isFree
                      ? "#9ca3af"
                      : plan.highlight
                        ? "var(--accent-emerald)"
                        : "#a78bfa"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSubscribe(plan.key)}
        disabled={loading}
        className={`mt-auto w-full py-3.5 rounded-full text-sm font-bold uppercase tracking-[0.15em] transition-all duration-200 ${
          plan.highlight ? "btn-gradient" : "btn-ghost"
        }`}
        style={{
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {getButtonText()}
      </button>

      {!plan.isFree && (
        <p className="mt-3 text-xs text-center text-subtle">{t("pricing.noCreditCard" as any)}</p>
      )}
    </article>
  );
}

// Main PricingCards Component
export function PricingCards({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { isAuthenticated } = useSupabaseAuth();
  const { t } = useLanguage();
  const translatedPlans = useTranslatedPlans();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  const handleSubscribe = async (plan: PlanKey) => {
    if (plan === "free") {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      router.push("/account");
      return;
    }

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
      console.error("[Pricing] checkout error", error);
      alert(t("error.submit.generic" as any));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className={className}>
      {/* Billing Toggle */}
      <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-3 lg:gap-8 mt-12">
        {translatedPlans.map((plan) => (
          <PricingCard
            key={plan.key}
            plan={plan}
            billingCycle={billingCycle}
            onSubscribe={handleSubscribe}
            loading={loadingPlan === plan.key}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(PricingCards);
