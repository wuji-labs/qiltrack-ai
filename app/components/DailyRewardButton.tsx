"use client";

import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { claimDailyReward, fetchDailyRewardStatus } from "@/lib/services/api";
import { useLanguage } from "@/lib/i18n";
import confetti from "canvas-confetti";

interface DailyRewardButtonProps {
  onRewardClaimed?: (credits: number) => void;
  className?: string;
  isLoggedIn?: boolean;
}

function DailyRewardButtonComponent({ onRewardClaimed, className = "", isLoggedIn }: DailyRewardButtonProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [dailyRewardAmount, setDailyRewardAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(isLoggedIn);

  // Check daily reward status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await fetchDailyRewardStatus();
        setClaimed(status.hasClaimed);
        setStreak(status.streakCount);
        setDailyRewardAmount(status.dailyRewardAmount);
        setUserLoggedIn(true);
      } catch (err: any) {
        console.error("Failed to check daily reward status:", err);
        // If 401, user is not logged in
        if (err?.statusCode === 401) {
          setUserLoggedIn(false);
          setDailyRewardAmount(60); // Show max possible (Ultra tier)
        }
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  const translateErrorMessage = (errorMessage: string): string => {
    const msgLower = errorMessage.toLowerCase();

    // Check for specific error patterns
    if (msgLower.includes("unauthorized") || msgLower === "unauthorized") {
      return t("error.unauthorized" as any);
    }

    if (msgLower.includes("already claimed")) {
      return t("dailyReward.alreadyClaimedToday" as any);
    }

    if (errorMessage.includes("已领取") || errorMessage.includes("已領取")) {
      return t("dailyReward.alreadyClaimedToday" as any);
    }

    if (msgLower.includes("failed to claim daily reward")) {
      return t("error.claimFailed" as any);
    }

    if (msgLower.includes("internal server error") || msgLower.includes("server error")) {
      return t("error.internalError" as any);
    }

    if (msgLower.includes("network")) {
      return t("error.network" as any);
    }

    // If no specific pattern matches, return generic error
    return errorMessage || t("dailyReward.error" as any);
  };

  const handleSessionExpired = () => {
    setError(t("dailyReward.sessionExpired" as any));
    // Wait 1.5 seconds before refreshing to show the message
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleSignInClick = () => {
    // Redirect to login page
    router.push("/login");
  };

  const handleClaim = async () => {
    if (claimed) return;

    // If not logged in, prompt to sign in
    if (!userLoggedIn) {
      handleSignInClick();
      return;
    }

    setClaiming(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await claimDailyReward();

      if (result.success) {
        setClaimed(true);
        setStreak(result.streakCount || 0);

        // 🎊 触发彩带庆祝效果
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F49D6E', '#FFD275', '#000000']
        });

        // Show success message
        const successMsg = t("dailyReward.claimSuccess" as any, {
          credits: String(dailyRewardAmount),
          streak: String(result.streakCount || 0),
        });
        setSuccess(successMsg);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);

        // 通知父组件刷新积分
        if (onRewardClaimed) {
          onRewardClaimed(result.remainingCredits);
        }

        // 触发全局积分更新事件
        window.dispatchEvent(new CustomEvent("credits-updated", {
          detail: { credits: result.remainingCredits }
        }));
      } else {
        // Handle unsuccessful claim with specific message
        const msg = result.message?.toLowerCase() || "";

        if (msg.includes("already claimed") || result.message?.includes("已领取")) {
          setClaimed(true);
          // Don't show error for already claimed
        } else if (msg.includes("unauthorized")) {
          handleSessionExpired();
        } else {
          const translatedError = translateErrorMessage(result.message || "");
          setError(translatedError);
        }
      }
    } catch (err) {
      console.error("Failed to claim daily reward:", err);

      // Handle network or API errors
      if (err instanceof Error) {
        const errorMessage = err.message;
        const statusCode = (err as any).statusCode;

        // Check if session expired (401 Unauthorized)
        if (statusCode === 401 || errorMessage.toLowerCase().includes("unauthorized")) {
          handleSessionExpired();
          return;
        }

        // Check if already claimed
        const msgLower = errorMessage.toLowerCase();
        if (msgLower.includes("already claimed") || errorMessage.includes("已领取")) {
          setClaimed(true);
          return;
        }

        // Translate and display error
        const translatedError = translateErrorMessage(errorMessage);
        setError(translatedError);
      } else {
        setError(t("error.network" as any));
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

  // Not logged in state - attractive CTA
  if (!userLoggedIn) {
    return (
      <div className={`daily-reward-card rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-[var(--bg-layer)]/90 to-[var(--bg-layer)]/85 p-5 relative overflow-hidden ${className}`}>
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 animate-pulse"></div>

        <div className="relative flex items-center gap-4">
          {/* Eye-catching icon */}
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20">
            <div className="absolute inset-0 rounded-xl bg-emerald-400/20 blur-xl animate-pulse"></div>
            <span className="relative text-3xl animate-bounce">🎁</span>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-base font-bold text-[var(--color-foreground)] flex items-center gap-2">
              {t("dailyReward.notLoggedIn.title" as any)}
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                {t("dailyReward.notLoggedIn.description" as any, { credits: String(dailyRewardAmount) })}
              </span>
            </h3>
            <p className="text-xs text-subtle mt-1 flex items-center gap-1">
              <svg className="h-3 w-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t("dailyReward.notLoggedIn.features" as any)}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSignInClick}
            className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_28px_rgba(16,185,129,0.5)] hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {t("dailyReward.notLoggedIn.cta" as any)}
          </button>
        </div>
      </div>
    );
  }

  // Logged in state - normal UI
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
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">{t("dailyReward.title" as any)}</h3>
          {streak > 0 && (
            <p className="text-xs text-subtle mt-0.5">
              {t("dailyReward.streak" as any, { count: String(streak) })}
            </p>
          )}
          <p className={`text-sm mt-1 font-medium ${claimed ? "text-slate-400" : "text-emerald-300"}`}>
            {claimed
              ? t("dailyReward.claimed" as any, { credits: String(dailyRewardAmount) })
              : t("dailyReward.canClaim" as any, { credits: String(dailyRewardAmount) })}
          </p>
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
          {success && (
            <p className="text-xs text-emerald-300 mt-1">{success}</p>
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
              {t("dailyReward.claiming" as any)}
            </span>
          ) : claimed ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t("dailyReward.alreadyClaimed" as any)}
            </span>
          ) : (
            t("dailyReward.claimNow" as any)
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
        <h4 className="text-sm font-semibold text-[var(--color-foreground)]">{t("dailyReward.calendar.title" as any)}</h4>
        <span className="text-xs text-subtle">{t("dailyReward.calendar.thisWeek" as any)}</span>
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
            {t("dailyReward.calendar.congrats" as any)}
          </p>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const DailyRewardButton = memo(DailyRewardButtonComponent);
