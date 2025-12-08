"use client";

import { type AuthInfo } from "./types";
import Link from "next/link";

type CreditsDisplayProps = {
  auth: AuthInfo;
  isQuotaExhausted: boolean;
  onRefreshSession: () => Promise<void>;
  onRequireLogin: () => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

export function CreditsDisplay({
  auth,
  isQuotaExhausted,
  onRefreshSession,
  onRequireLogin,
  t,
}: CreditsDisplayProps) {
  // 已登录状态 - 显示会员卡风格
  if (auth.isAuthenticated) {
    const tierColors = {
      free: {
        bg: "from-slate-800/90 to-slate-900/90",
        border: "border-slate-600/50",
        accent: "text-slate-300",
        badge: "bg-slate-700 text-slate-300",
      },
      pro: {
        bg: "from-amber-900/40 to-amber-950/60",
        border: "border-amber-500/40",
        accent: "text-amber-300",
        badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
      },
      ultra: {
        bg: "from-purple-900/40 to-purple-950/60",
        border: "border-purple-500/40",
        accent: "text-purple-300",
        badge: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
      },
    };

    const tier = auth.planLabel?.toLowerCase() as keyof typeof tierColors;
    const colors = tierColors[tier] || tierColors.free;

    return (
      <div className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-5`}>
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/3 blur-2xl"
            aria-hidden
          />
        </div>

        <div className="relative">
          {/* 顶部：套餐标识 */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs uppercase tracking-[0.2em] ${colors.accent}`}>
              Qiltrack AI
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
              {auth.planLabel || "Free"}
            </span>
          </div>

          {/* 积分余额 */}
          <div className="mb-4">
            <p className="text-xs text-subtle mb-1">{t("quota.card.balance")}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[var(--color-foreground)]">
                {auth.remainingQuota}
              </span>
              <span className="text-sm text-subtle">{t("quota.card.unit")}</span>
            </div>
          </div>

          {/* 积分耗尽提示 */}
          {isQuotaExhausted && (
            <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
              <p className="text-xs text-amber-300">{t("quota.badge.exhausted")}</p>
            </div>
          )}

          {/* 用户邮箱 */}
          <p className="text-xs text-subtle truncate mb-4">
            {auth.userEmail || t("auth.session.fallback")}
          </p>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Link
              href="/pricing"
              className="flex-1 text-center btn-gradient px-4 py-2.5 text-sm font-semibold rounded-xl"
            >
              {t("quota.card.upgradeCta")}
            </Link>
            <button
              type="button"
              onClick={() =>
                document
                  .querySelector("#generator")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="flex-1 btn-ghost px-4 py-2.5 text-sm rounded-xl"
            >
              {t("quota.card.generateCta")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 未登录状态 - 引导注册
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/85 p-5">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div
          className="absolute -left-6 top-2 h-28 w-28 rounded-full bg-[var(--accent-emerald)]/18 blur-[90px]"
          aria-hidden
        />
        <div
          className="absolute right-0 bottom-0 h-36 w-36 rounded-full bg-[var(--accent-blue)]/14 blur-[110px]"
          aria-hidden
        />
      </div>

      <div className="relative">
        {/* 标题 */}
        <h3 className="text-xl font-bold text-[var(--color-foreground)] mb-2">
          {t("quota.banner.title")}
        </h3>

        {/* 描述 */}
        <p className="text-2xl font-bold text-[var(--accent-emerald)] mb-3">
          {t("quota.banner.description")}
        </p>

        {/* 提示 */}
        <p className="text-sm text-subtle mb-5">
          {t("quota.banner.hint.register")}
        </p>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onRequireLogin}
            className="flex-1 btn-gradient px-5 py-3 text-base font-semibold shadow-[0_12px_32px_rgba(91,224,176,0.26)]"
          >
            {t("cta.preview")}
          </button>
          <button
            type="button"
            onClick={() =>
              document
                .querySelector("#generator")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="flex-1 btn-ghost px-5 py-3 text-base"
          >
            {t("quota.card.exampleCta")}
          </button>
        </div>
      </div>
    </div>
  );
}
