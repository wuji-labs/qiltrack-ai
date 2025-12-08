"use client";

import { useState, useEffect } from "react";
import { claimDailyReward, fetchDailyRewardStatus } from "@/lib/services/api";
import { useLanguage } from "@/lib/i18n";

interface DailyRewardButtonProps {
  onRewardClaimed?: (credits: number) => void;
  className?: string;
}

export function DailyRewardButton({ onRewardClaimed, className = "" }: DailyRewardButtonProps) {
  const { t } = useLanguage();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [dailyRewardAmount, setDailyRewardAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check daily reward status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await fetchDailyRewardStatus();
        setClaimed(status.hasClaimed);
        setStreak(status.streakCount);
        setDailyRewardAmount(status.dailyRewardAmount);
      } catch (err) {
        console.error("Failed to check daily reward status:", err);
        // On error, assume not claimed so user can try
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  const handleClaim = async () => {
    if (claimed) return;

    setClaiming(true);
    setError(null);

    try {
      const result = await claimDailyReward();

      if (result.success) {
        setClaimed(true);
        setStreak(result.streakCount || 0);

        // 通知父组件刷新积分
        if (onRewardClaimed) {
          onRewardClaimed(result.remainingCredits);
        }

        // 触发全局积分更新事件
        window.dispatchEvent(new CustomEvent("credits-updated", {
          detail: { credits: result.remainingCredits }
        }));
      } else {
        // Check if already claimed today
        if (result.message?.includes("already claimed") || result.message?.includes("已领取")) {
          setClaimed(true);
        } else {
          setError(result.message || "领取失败");
        }
      }
    } catch (err) {
      console.error("Failed to claim daily reward:", err);
      const errorMessage = err instanceof Error ? err.message : "网络错误，请稍后再试";
      // Check if already claimed
      if (errorMessage.includes("already claimed") || errorMessage.includes("已领取")) {
        setClaimed(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className={`daily-reward-card rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-5 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
            <div className="h-8 w-8 animate-pulse rounded-full bg-emerald-400/20"></div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-[var(--bg-layer)]"></div>
            <div className="h-3 w-32 animate-pulse rounded bg-[var(--bg-layer)]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`daily-reward-card rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-5 ${className}`}>
      <div className="flex items-center gap-4">
        {/* 礼物图标 */}
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
          <div className="absolute inset-0 rounded-xl bg-emerald-400/10 blur-xl"></div>
          <span className="relative text-3xl">{claimed ? "✅" : "🎁"}</span>
        </div>

        {/* 内容 */}
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">{t("dailyReward.title")}</h3>
          {streak > 0 && (
            <p className="text-xs text-subtle mt-0.5">
              {t("dailyReward.streak", { count: String(streak) })}
            </p>
          )}
          <p className={`text-sm mt-1 font-medium ${claimed ? "text-slate-400" : "text-emerald-300"}`}>
            {claimed
              ? t("dailyReward.claimed", { credits: String(dailyRewardAmount) })
              : t("dailyReward.canClaim", { credits: String(dailyRewardAmount) })}
          </p>
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
        </div>

        {/* 按钮 */}
        <button
          onClick={handleClaim}
          disabled={claiming || claimed}
          className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            claimed
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_28px_rgba(16,185,129,0.4)] hover:scale-105"
          }`}
        >
          {claiming ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t("dailyReward.claiming")}
            </span>
          ) : claimed ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t("dailyReward.alreadyClaimed")}
            </span>
          ) : (
            t("dailyReward.claimNow")
          )}
        </button>
      </div>
    </div>
  );
}

// 签到日历组件
interface DailyRewardCalendarProps {
  streak: number;
  className?: string;
}

export function DailyRewardCalendar({ streak, className = "" }: DailyRewardCalendarProps) {
  const { t } = useLanguage();
  const days = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className={`daily-reward-calendar ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-[var(--color-foreground)]">{t("dailyReward.calendar.title")}</h4>
        <span className="text-xs text-subtle">{t("dailyReward.calendar.thisWeek")}</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isCompleted = day <= streak;
          const isToday = day === streak;

          return (
            <div
              key={day}
              className={`relative flex flex-col items-center justify-center rounded-lg border p-2 transition-all duration-200 ${
                isCompleted
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-[var(--stroke-soft)] bg-[var(--bg-base)]"
              }`}
            >
              {isCompleted && (
                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <span className={`text-xs font-medium ${isCompleted ? "text-emerald-300" : "text-dim"}`}>
                {day}
              </span>

              {isToday && isCompleted && (
                <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>

      {streak >= 7 && (
        <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
          <p className="text-xs text-center text-emerald-300">
            {t("dailyReward.calendar.congrats")}
          </p>
        </div>
      )}
    </div>
  );
}
