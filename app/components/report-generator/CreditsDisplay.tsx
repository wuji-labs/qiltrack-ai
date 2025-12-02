"use client";

import { type AuthInfo } from "./types";

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
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/85 p-4 sm:p-5">
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
      <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
        <div className="space-y-3 flex-1">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">{t("hero.quota")}</p>
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
            {auth.isAuthenticated
              ? t("quota.card.heading", { plan: auth.planLabel })
              : t("quota.banner.title")}
          </h3>
          {auth.isAuthenticated && isQuotaExhausted && (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-50">
              {t("quota.badge.exhausted")}
            </span>
          )}
          {auth.isAuthenticated && (
            <p className="text-sm text-subtle">
              {t("quota.card.email", { email: auth.userEmail ?? t("auth.session.fallback") })}
            </p>
          )}
          <div className="text-3xl font-bold text-[var(--accent-emerald)]">
            {auth.isAuthenticated
              ? t("quota.card.count", { count: auth.remainingQuota.toString() })
              : t("quota.banner.description")}
          </div>
          <p className="text-xs text-subtle/80">
            {auth.isAuthenticated ? t("quota.card.note") : t("quota.banner.hint.register")}
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-40 flex-shrink-0">
          <button
            type="button"
            onClick={auth.isAuthenticated ? onRefreshSession : onRequireLogin}
            className="btn-gradient px-4 py-2 text-sm font-semibold shadow-[0_12px_32px_rgba(91,224,176,0.26)]"
          >
            {auth.isAuthenticated ? t("quota.card.refreshCta") : t("cta.preview")}
          </button>
          <button
            type="button"
            onClick={() =>
              document
                .querySelector("#generator")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="btn-ghost px-4 py-2 text-sm"
          >
            {t("quota.card.exampleCta")}
          </button>
        </div>
      </div>
    </div>
  );
}
