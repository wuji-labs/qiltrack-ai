"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { BillingToggle, plans, type BillingCycle, type Plan, type PlanKey } from "@/app/components/PricingCards";

// Feature comparison data
const comparisonFeatures = [
  {
    category: "积分配额",
    features: [
      { name: "初始积分", free: "30", pro: "30", ultra: "30" },
      { name: "月度积分", free: "0", pro: "300", ultra: "1,500" },
      { name: "每日签到", free: "5", pro: "15", ultra: "30" },
      { name: "报告额度", free: "30", pro: "30", ultra: "25" },
      { name: "积分保存", free: "-", pro: "1 个月", ultra: "3 个月" },
    ],
  },
  {
    category: "基础功能",
    features: [
      { name: "报告生成", free: true, pro: true, ultra: true },
      { name: "生成速度", free: "Standard", pro: "2x Priority", ultra: "4x Express" },
      { name: "DOCX 导出", free: false, pro: true, ultra: true },
      { name: "PDF 导出", free: false, pro: false, ultra: true },
      { name: "批量生成", free: "1 份", pro: "3 份", ultra: "10 份" },
      { name: "报告留存", free: "7 天", pro: "90 天", ultra: "永久" },
    ],
  },
  {
    category: "高级功能",
    features: [
      { name: "自定义模板", free: false, pro: false, ultra: true },
      { name: "API 访问", free: false, pro: false, ultra: true },
      { name: "Webhook", free: false, pro: false, ultra: true },
    ],
  },
  {
    category: "服务支持",
    features: [
      { name: "响应时间", free: "48 小时", pro: "24 小时", ultra: "4 小时" },
      { name: "支持渠道", free: "社区", pro: "邮件", ultra: "专属客服" },
      { name: "会员标识", free: false, pro: true, ultra: true },
    ],
  },
];

export default function PricingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useSupabaseAuth();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual"); // 默认年付

  // 从 URL 参数恢复状态（登录后重定向回来时）
  useEffect(() => {
    const planParam = searchParams.get("plan") as PlanKey | null;
    const billingParam = searchParams.get("billingCycle") as BillingCycle | null;

    if (billingParam && (billingParam === "monthly" || billingParam === "annual")) {
      setBillingCycle(billingParam);
    }

    if (isAuthenticated && planParam && (planParam === "pro" || planParam === "ultra")) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      handleSubscribe(planParam);
    }
  }, [isAuthenticated, searchParams]);

  const handleSubscribe = async (plan: PlanKey) => {
    if (plan === "free") {
      if (!isAuthenticated) {
        const params = new URLSearchParams({
          redirect: "/pricing",
        });
        router.push(`/login?${params.toString()}`);
      } else {
        router.push("/account");
      }
      return;
    }

    try {
      setLoadingPlan(plan);
      const planData = plans[plan][billingCycle];
      if (!planData.checkoutUrl) {
        // 预留后端发起结账的入口
        router.push(`/login?redirect=/pricing&plan=${plan}&billingCycle=${billingCycle}`);
        return;
      }
      window.location.href = planData.checkoutUrl;
    } finally {
      setLoadingPlan(null);
    }
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <span className="text-emerald-400">Included</span>
      ) : (
        <span className="text-slate-500">—</span>
      );
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <p className="text-emerald-300 uppercase tracking-[0.2em] text-xs">Plans & Pricing</p>
          <h1 className="text-4xl font-semibold tracking-tight">Find the right report plan</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Flexible tiers for teams generating AI-driven investment reports at scale.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center">
          <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(plans).map((key) => {
            const planKey = key as PlanKey;
            const plan = plans[planKey];
            const planData = plan[billingCycle] as Plan;
            const isPopular = planKey === "pro";
            return (
              <div
                key={planKey}
                className={`relative rounded-3xl border p-6 bg-slate-900/70 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] ${
                  isPopular ? "border-emerald-500/50" : "border-slate-800"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 text-slate-900 text-xs font-semibold px-3 py-1 shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-white">{plan.title}</h3>
                  <p className="text-sm text-slate-400">{plan.subtitle}</p>
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    {planData.price === 0 ? "Free" : `$${planData.price}`}
                  </span>
                  {planData.price !== 0 && (
                    <span className="text-sm text-slate-400">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  )}
                </div>

                  {planData.price !== 0 && (
                    <p className="text-xs text-emerald-200 mt-2">{planData.savings}</p>
                  )}

                <button
                  onClick={() => handleSubscribe(planKey)}
                  disabled={loadingPlan === planKey}
                  className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    loadingPlan === planKey
                      ? "bg-slate-700 text-slate-300 cursor-wait"
                      : isPopular
                        ? "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                        : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  }`}
                >
                  {loadingPlan === planKey ? "Processing..." : plan.cta}
                </button>

                <ul className="mt-6 space-y-3 text-sm text-slate-200">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] space-y-4">
          <h3 className="text-xl font-semibold text-white">Compare plans</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-200">
              <thead>
                <tr className="text-left">
                  <th className="py-2 pr-4">Features</th>
                  <th className="py-2 px-4">Free</th>
                  <th className="py-2 px-4">Pro</th>
                  <th className="py-2 px-4">Ultra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {comparisonFeatures.map((group) => (
                  <tr key={group.category}>
                    <td className="py-3 pr-4 font-medium text-slate-100">{group.category}</td>
                    <td className="py-3 px-4 space-y-2">
                      {group.features.map((f) => (
                        <div key={f.name}>{renderFeatureValue(f.free)}</div>
                      ))}
                    </td>
                    <td className="py-3 px-4 space-y-2">
                      {group.features.map((f) => (
                        <div key={f.name}>{renderFeatureValue(f.pro)}</div>
                      ))}
                    </td>
                    <td className="py-3 px-4 space-y-2">
                      {group.features.map((f) => (
                        <div key={f.name}>{renderFeatureValue(f.ultra)}</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
