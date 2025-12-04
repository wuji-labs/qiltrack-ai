"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type PlanKey = "free" | "pro" | "annual";

type Plan = {
  key: PlanKey;
  name: string;
  badge: string;
  price: string;
  period: string;
  credits: string;
  features: string[];
  description: string;
  highlight?: boolean;
  popular?: boolean;
  isFree?: boolean;
};

const plans: Plan[] = [
  {
    key: "free",
    name: "免费版",
    badge: "Free",
    price: "$0",
    period: "",
    credits: "60 初始积分",
    features: [
      "注册赠送 60 积分",
      "无月度配额",
      "基础报告生成",
      "标准响应时间",
      "社区支持",
    ],
    description: "适合尝试体验产品功能的新用户。",
    isFree: true,
  },
  {
    key: "pro",
    name: "月费版",
    badge: "月付",
    price: "$14.99",
    period: "/ 月",
    credits: "300 积分 / 月",
    features: [
      "300 月度积分",
      "每日签到 30 积分",
      "导出报告为 PDF",
      "批量生成支持",
      "优先客服响应",
    ],
    description: "适合定期需要投资分析的个人投资者。",
    highlight: true,
    popular: true,
  },
  {
    key: "annual",
    name: "年费版",
    badge: "年付",
    price: "$119.99",
    period: "/ 年",
    credits: "600 积分 / 月 + 200 bonus",
    features: [
      "600 月度积分 (相当于每月 $10)",
      "每日签到 30 积分",
      "赠送 200 奖励积分",
      "积分可滚存 3 个月",
      "全部 Pro 功能",
      "专属年费会员标识",
    ],
    description: "性价比最高,省 33%,适合长期用户。",
  },
];

// Feature comparison data
const comparisonFeatures = [
  {
    category: "积分配额",
    features: [
      { name: "初始积分", free: "60", pro: "60", annual: "60" },
      { name: "月度积分", free: "0", pro: "300", annual: "600" },
      { name: "奖励积分", free: "-", pro: "-", annual: "200" },
      { name: "每日签到", free: "10", pro: "30", annual: "30" },
      { name: "积分滚存", free: "-", pro: "1 个月", annual: "3 个月" },
    ],
  },
  {
    category: "核心功能",
    features: [
      { name: "报告生成", free: true, pro: true, annual: true },
      { name: "PDF 导出", free: false, pro: true, annual: true },
      { name: "批量生成", free: false, pro: true, annual: true },
      { name: "历史记录", free: "30 天", pro: "90 天", annual: "永久" },
      { name: "报告模板", free: "基础", pro: "全部", annual: "全部 + 定制" },
    ],
  },
  {
    category: "服务支持",
    features: [
      { name: "响应时间", free: "48 小时", pro: "24 小时", annual: "12 小时" },
      { name: "支持渠道", free: "社区", pro: "邮件 + 社区", annual: "优先专线" },
      { name: "专属标识", free: false, pro: false, annual: true },
      { name: "API 访问", free: false, pro: false, annual: "即将开放" },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useSupabaseAuth();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

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
        body: JSON.stringify({ plan }),
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
      alert("创建订阅失败,请稍后重试。");
    } finally {
      setLoadingPlan(null);
    }
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
          返回首页
        </button>
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-12 text-center space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.28em]" style={{ background: "var(--bg-layer)", border: "1px solid var(--stroke-soft)", color: "var(--accent-emerald)" }}>
            定价方案
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: "var(--color-foreground)" }}>
            选择适合您的套餐
          </h1>
          <p className="text-base sm:text-lg text-dim max-w-2xl mx-auto">
            所有套餐均支持随时取消,通过 Stripe 安全支付。注册即送初始积分。
          </p>
        </header>

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
                  最受欢迎
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
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl sm:text-5xl font-bold" style={{ color: plan.isFree ? "var(--text-dim)" : plan.highlight ? "var(--accent-emerald)" : "#a78bfa" }}>
                    {plan.price}
                  </span>
                  <span className="text-base text-subtle">{plan.period}</span>
                </div>
                <p className="text-sm font-medium text-dim">{plan.credits}</p>
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
                {loadingPlan === plan.key ? "处理中..." : plan.isFree ? (isAuthenticated ? "前往账户" : "免费注册") : isAuthenticated ? "订阅" : "登录后订阅"}
              </button>

              {plan.key === "annual" && (
                <p className="mt-3 text-xs sm:text-sm text-center text-subtle">
                  相比月付节省 <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>33%</span>
                </p>
              )}
            </article>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "var(--color-foreground)" }}>
            功能对比
          </h2>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--bg-layer)" }}>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-dim">功能</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-dim">免费版</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: "var(--accent-emerald)" }}>月费版</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: "#a78bfa" }}>年费版</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, idx) => (
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
                            {typeof feature.annual === "boolean" ? (
                              feature.annual ? (
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
                              feature.annual
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
            所有订阅均可随时取消。支付通过 Stripe 安全处理。
          </p>
          <p className="text-xs text-subtle">
            积分用于生成投资分析报告。不同报告类型消耗不同积分。
          </p>
        </div>
      </div>
    </main>
  );
}
