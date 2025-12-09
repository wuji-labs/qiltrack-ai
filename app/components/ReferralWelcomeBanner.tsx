"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

/**
 * 邀请欢迎横幅
 * 当用户通过邀请链接访问时显示
 */
export function ReferralWelcomeBanner() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    const referrer = searchParams.get("referrer");

    if (ref && referrer) {
      setReferrerName(decodeURIComponent(referrer));
      setVisible(true);

      // 10秒后自动隐藏
      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!visible || !referrerName) {
    return null;
  }

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-full px-4 animate-slide-down">
      <div className="rounded-2xl border border-[var(--accent-emerald)]/30 bg-gradient-to-br from-emerald-950/95 to-emerald-900/95 backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(16,185,129,0.3)]">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-emerald)]/20 border border-[var(--accent-emerald)]/30">
            <span className="text-2xl">🎁</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--accent-emerald)] mb-1">
              {t("referral.welcome.title")}
            </h3>
            <p className="text-sm text-emerald-200/90 mb-3">
              {t("referral.welcome.message", { name: referrerName })}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-300/80">
              <span className="inline-flex items-center gap-1">
                <span>✨</span>
                <span>{t("referral.welcome.benefit1")}</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <span>🎯</span>
                <span>{t("referral.welcome.benefit2")}</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 text-emerald-400/60 hover:text-emerald-300 transition-colors"
            aria-label="关闭"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
