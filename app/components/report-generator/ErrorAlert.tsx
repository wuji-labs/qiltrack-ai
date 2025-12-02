"use client";

import { type ErrorState, type AuthInfo } from "./types";

type ErrorAlertProps = {
  errorState: ErrorState | null;
  auth: AuthInfo;
  isQuotaExhausted: boolean;
  onDismiss: () => void;
  onRequireLogin: () => void;
  onRefreshQuota: () => Promise<void>;
  onViewPricing: () => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

export function ErrorAlert({
  errorState,
  auth,
  isQuotaExhausted,
  onDismiss,
  onRequireLogin,
  onRefreshQuota,
  onViewPricing,
  t,
}: ErrorAlertProps) {
  if (!errorState) return null;

  if (errorState.type === "unauthorized") {
    return (
      <div className="rounded-2xl border border-amber-400/50 bg-amber-500/10 px-4 py-3 text-base text-amber-50 shadow-[0_10px_35px_rgba(251,191,36,0.18)] space-y-2">
        <div className="flex items-start gap-3">
          <span aria-hidden>⚠️</span>
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.24em] text-amber-200">
              {t("alert.error.title")}
            </p>
            <p className="text-amber-50">{errorState.message}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onDismiss();
              onRequireLogin();
            }}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            {t("quota.action.login")}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 px-4 py-2 text-sm text-amber-50 transition hover:border-amber-200 hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            {t("quota.action.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (errorState.type === "quota") {
    return (
      <div className="rounded-2xl border border-amber-400/50 bg-amber-500/10 px-4 py-3 text-base text-amber-50 shadow-[0_10px_35px_rgba(251,191,36,0.18)] space-y-3">
        <div className="flex items-start gap-3">
          <span aria-hidden>⏳</span>
          <div className="flex-1 space-y-1">
            <p className="text-sm uppercase tracking-[0.24em] text-amber-200">
              {t("generator.alert.quota")}
            </p>
            <p className="text-sm text-amber-100/80">
              {t("report.quota.remaining")} {Math.max(0, auth.remainingQuota).toString()}
            </p>
          </div>
          {isQuotaExhausted && auth.isAuthenticated && (
            <span className="rounded-full border border-amber-300/60 bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-50">
              {t("quota.badge.exhausted")}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefreshQuota}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            {t("quota.action.refresh")}
          </button>
          <button
            type="button"
            onClick={onViewPricing}
            className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 px-4 py-2 text-sm text-amber-50 transition hover:border-amber-200 hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            {t("quota.action.upgrade")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-base text-amber-100 flex items-center gap-2 shadow-[0_10px_35px_rgba(251,191,36,0.18)]">
      <span aria-hidden>⚠️</span>
      <div className="flex-1">{errorState.message}</div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full border border-amber-300/60 px-3 py-1 text-xs text-amber-50 transition hover:border-amber-200 hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
      >
        {t("quota.action.retry")}
      </button>
    </div>
  );
}
