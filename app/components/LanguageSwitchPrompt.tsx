"use client";

import { useEffect, useState } from "react";
import { Language, LANGUAGE_LABEL } from "@/lib/i18n-config";

interface LanguageSwitchPromptProps {
  currentLanguage: Language;
  detectedLanguage: Language;
  onSwitch: () => void;
  onDismiss: () => void;
}

export function LanguageSwitchPrompt({
  currentLanguage,
  detectedLanguage,
  onSwitch,
  onDismiss,
}: LanguageSwitchPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 添加入场动画延迟
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleSwitch = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onSwitch();
    }, 200);
  };

  const text = getPromptTextInTargetLanguage(detectedLanguage);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] sm:w-auto max-w-2xl transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
      role="alert"
      aria-live="polite"
    >
      {/* 主容器 */}
      <div className="relative bg-[var(--bg-base)]/95 backdrop-blur-xl border border-[var(--stroke-soft)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* 图标 - 桌面端显示 */}
          <div className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 items-center justify-center shadow-lg">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </div>

          {/* 文本和按钮 */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
            {/* 提示文本 */}
            <p className="text-sm sm:text-base text-[var(--color-foreground)] flex-shrink min-w-0">
              {text.message}
            </p>

            {/* 按钮组 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleSwitch}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 active:scale-95 whitespace-nowrap"
              >
                {text.switchButton}
              </button>

              {/* 关闭按钮 */}
              <button
                type="button"
                onClick={handleDismiss}
                className="w-9 h-9 rounded-lg text-[var(--color-subtle)] hover:text-[var(--color-foreground)] hover:bg-[var(--bg-layer)] transition-all duration-200 flex items-center justify-center flex-shrink-0"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
      </div>
    </div>
  );
}

// 使用目标语言显示提示文本（而不是当前语言）
function getPromptTextInTargetLanguage(detectedLang: Language) {
  const detectedLabel = LANGUAGE_LABEL[detectedLang];

  const texts: Record<Language, { message: string; switchButton: string }> = {
    en: {
      message: `We detected you might prefer English`,
      switchButton: `Switch to English`,
    },
    ja: {
      message: `日本語の方が適している可能性があります`,
      switchButton: `日本語に切り替える`,
    },
    ko: {
      message: `한국어가 더 적합할 수 있습니다`,
      switchButton: `한국어로 변경`,
    },
    "zh-Hant": {
      message: `我們偵測到您可能更適合使用 繁體中文`,
      switchButton: `切換到 繁體中文`,
    },
    "zh-Hans": {
      message: `我们检测到您可能更适合使用 简体中文`,
      switchButton: `切换到 简体中文`,
    },
  };

  return texts[detectedLang] || texts.en;
}
