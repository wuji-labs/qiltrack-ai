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
    const tierStyles = {
      free: {
        // 深邃的深蓝灰色调，专业稳重
        bg: "from-[#1a1f2e] via-[#1e2436] to-[#141820]",
        border: "border-slate-600/30",
        accent: "text-slate-300",
        badge: "bg-slate-700/80 text-slate-200",
        glow1: "bg-slate-500/8",
        glow2: "bg-slate-400/5",
        pattern: "opacity-[0.03]",
      },
      pro: {
        // 高级金色渐变，奢华感
        bg: "from-[#1f1a14] via-[#2a2318] to-[#1a1610]",
        border: "border-amber-600/30",
        accent: "text-amber-200",
        badge: "bg-gradient-to-r from-amber-600/90 to-amber-500/90 text-amber-50",
        glow1: "bg-amber-500/10",
        glow2: "bg-amber-400/8",
        pattern: "opacity-[0.04]",
      },
      ultra: {
        // 尊贵紫金渐变，顶级会员
        bg: "from-[#1a1424] via-[#201830] to-[#14101c]",
        border: "border-purple-500/30",
        accent: "text-purple-200",
        badge: "bg-gradient-to-r from-purple-600/90 to-violet-500/90 text-purple-50",
        glow1: "bg-purple-500/12",
        glow2: "bg-violet-400/8",
        pattern: "opacity-[0.05]",
      },
    };

    const tier = auth.planLabel?.toLowerCase() as keyof typeof tierStyles;
    const styles = tierStyles[tier] || tierStyles.free;

    return (
      <div className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-gradient-to-br ${styles.bg} p-5`}>
        {/* 高级背景装饰 - 多层光晕效果 */}
        <div className="pointer-events-none absolute inset-0">
          {/* 主光晕 */}
          <div
            className={`absolute -right-16 -top-16 h-48 w-48 rounded-full ${styles.glow1} blur-3xl`}
            aria-hidden
          />
          <div
            className={`absolute -left-12 -bottom-8 h-40 w-40 rounded-full ${styles.glow2} blur-3xl`}
            aria-hidden
          />
          {/* 细微纹理图案 */}
          <div
            className={`absolute inset-0 ${styles.pattern}`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
        </div>

        <div className="relative">
          {/* 顶部：套餐标识 */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs uppercase tracking-[0.2em] ${styles.accent}`}>
              Qiltrack AI
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${styles.badge}`}>
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
