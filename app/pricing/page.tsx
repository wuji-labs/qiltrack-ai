"use client";

import { useState } from "react";

type PlanKey = "basic" | "pro";

type Plan = {
  key: PlanKey;
  name: string;
  price: string;
  credits: string;
  description: string;
};

const plans: Plan[] = [
  {
    key: "basic",
    name: "Basic",
    price: "$9/月",
    credits: "50 积分 / 月",
    description: "适合个人探索与周报输出，保留核心生成体验。",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$29/月",
    credits: "200 积分 / 月",
    description: "团队/高频使用场景，更多额度与优先支持。",
  },
];

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  const handleSubscribe = async (plan: PlanKey) => {
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
      alert("订阅链接创建失败，请稍后重试。");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-12 text-center">
        <p className="text-sm uppercase tracking-[0.32em] text-[var(--text-subtle)]">Pricing</p>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--color-foreground)]">选择合适的订阅</h1>
        <p className="mt-3 text-base text-[var(--text-subtle)]">
          支持随时升级或取消，结账由 Stripe 安全托管。
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.key}
            className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-8 shadow-[var(--shadow-soft)] backdrop-blur-[var(--blur-sm)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[var(--color-foreground)]">{plan.name}</h3>
              <span className="text-2xl font-bold text-[var(--accent-emerald)]">{plan.price}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-subtle)]">{plan.description}</p>
            <p className="mt-4 text-base font-medium text-[var(--text-dim)]">{plan.credits}</p>
            <button
              type="button"
              onClick={() => handleSubscribe(plan.key)}
              disabled={loadingPlan === plan.key}
              className="mt-8 w-full rounded-xl bg-[var(--accent-emerald)] px-4 py-3 text-center text-sm font-semibold text-[#051b12] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingPlan === plan.key ? "跳转中..." : "订阅"}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
