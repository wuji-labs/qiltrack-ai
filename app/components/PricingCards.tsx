"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export type PlanKey = "free" | "pro" | "ultra";
export type BillingCycle = "monthly" | "annual";

export type Plan = {
  key: PlanKey;
  name: string;
  badge: string;
  monthlyPrice: number;
  annualPrice: number;
  credits: string;
  features: string[];
  description: string;
  highlight?: boolean;
  popular?: boolean;
  isFree?: boolean;
};

export const plans: Plan[] = [
  {
    key: "free",
    name: "Free",
    badge: "FREE",
    monthlyPrice: 0,
    annualPrice: 0,
    credits: "40 初始积分",
    features: [
      "注册赠送 40 积分",
      "每日签到 10 积分",
      "在线查看报告",
      "标准响应时间",
      "社区支持",
    ],
    description: "适合尝试体验产品功能的新用户。",
    isFree: true,
  },
  {
    key: "pro",
    name: "Pro",
    badge: "PRO",
    monthlyPrice: 14.99,
    annualPrice: 9.99,
    credits: "600 初始积分",
    features: [
      "600 初始积分",
      "每日签到 30 积分",
      "导出报告为 DOCX",
      "批量生成 3 份",
      "优先 2x 速度",
      "报告留存 90 天",
    ],
    description: "适合定期需要投资分析的个人投资者。",
    highlight: true,
    popular: true,
  },
  {
    key: "ultra",
    name: "Ultra",
    badge: "ULTRA",
    monthlyPrice: 44.99,
    annualPrice: 29.99,
    credits: "3,000 初始积分",
    features: [
      "3,000 初始积分",
      "每日签到 60 积分",
      "导出 PDF + DOCX",
      "批量生成 10 份",
      "极速 4x 生成",
      "积分滚存 3 个月",
      "API 访问",
      "报告永久留存",
    ],
    description: "性价比最高，适合专业用户和团队。",
  },
];

// Billing Toggle Component
export function BillingToggle({
  billingCycle,
  onChange,
}: {
  billingCycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={`text-sm font-medium cursor-pointer transition-colors ${
          billingCycle === "monthly" ? "text-foreground" : "text-dim"
        }`}
        onClick={() => onChange("monthly")}
      >
        月度账单
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
        年度账单
      </span>

      <span
        className="ml-2 px-3 py-1 rounded-full text-xs font-bold"
        style={{
          background: "rgba(251, 146, 60, 0.15)",
          color: "#fb923c",
          border: "1px solid rgba(251, 146, 60, 0.3)",
        }}
      >
        年付节省 33%
      </span>
    </div>
  );
}

// Pricing Card Component
function PricingCard({
  plan,
  billingCycle,
  onSubscribe,
  loading,
  isAuthenticated,
}: {
  plan: Plan;
  billingCycle: BillingCycle;
  onSubscribe: (key: PlanKey) => void;
  loading: boolean;
  isAuthenticated: boolean;
}) {
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
    if (loading) return "处理中...";
    if (plan.isFree) return isAuthenticated ? "前往账户" : "免费注册";
    return isAuthenticated ? "登录后订阅" : "登录后订阅";
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
          最受欢迎
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
          {!plan.isFree && <span className="text-base text-subtle">/ 月</span>}
        </div>
        {getOriginalPrice() && (
          <p className="text-sm text-dim">
            <span className="line-through opacity-60">{getOriginalPrice()}/月</span>
            <span className="ml-2 text-orange-400 font-medium">省 {getSavingsPercent()}%</span>
          </p>
        )}
        <p className="text-sm font-medium text-dim mt-2">{plan.credits}</p>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
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
        <p className="mt-3 text-xs text-center text-subtle">无需信用卡即可体验 · 随时取消</p>
      )}
    </article>
  );
}

// Main PricingCards Component
export function PricingCards({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { isAuthenticated } = useSupabaseAuth();
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
      alert("创建订阅失败，请稍后重试。");
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
        {plans.map((plan) => (
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

export default PricingCards;
