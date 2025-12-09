"use client";

import { useEffect, useState } from "react";
import { Language, DEFAULT_LANGUAGE } from "@/lib/i18n-config";

const DISMISSED_KEY = "qiltrack-language-prompt-dismissed";
const DETECTION_DELAY = 2000; // 2秒后显示提示，让用户先看到页面

/**
 * 检测浏览器语言
 */
function detectBrowserLanguage(): Language | null {
  if (typeof window === "undefined") return null;

  const locale = window.navigator.language.toLowerCase();

  // 日语
  if (locale.startsWith("ja")) return "ja";

  // 韩语
  if (locale.startsWith("ko")) return "ko";

  // 中文
  if (locale.startsWith("zh")) {
    // 繁体中文（台湾、香港、澳门）
    if (
      locale.includes("tw") ||
      locale.includes("hk") ||
      locale.includes("mo") ||
      locale.includes("hant")
    ) {
      return "zh-Hant";
    }
    // 简体中文
    return "zh-Hans";
  }

  // 英语（默认）
  if (locale.startsWith("en")) return "en";

  return null;
}

/**
 * 检查用户是否已经拒绝过语言切换提示
 */
function isDismissed(detectedLang: Language): boolean {
  if (typeof window === "undefined") return false;

  try {
    const dismissed = window.localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) return false;

    const dismissedLangs = JSON.parse(dismissed) as string[];
    return dismissedLangs.includes(detectedLang);
  } catch {
    return false;
  }
}

/**
 * 记录用户拒绝了某个语言的切换提示
 */
function markDismissed(detectedLang: Language): void {
  if (typeof window === "undefined") return;

  try {
    const dismissed = window.localStorage.getItem(DISMISSED_KEY);
    const dismissedLangs = dismissed ? JSON.parse(dismissed) : [];

    if (!dismissedLangs.includes(detectedLang)) {
      dismissedLangs.push(detectedLang);
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedLangs));
    }
  } catch (error) {
    console.error("Failed to save dismissed language:", error);
  }
}

/**
 * 自动检测设备语言并提示用户切换
 */
export function useLanguageDetection(currentLanguage: Language) {
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<Language | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 延迟检测，让用户先看到页面
    const timer = setTimeout(() => {
      const detected = detectBrowserLanguage();

      // 如果检测失败或检测到的语言与当前语言相同，不显示提示
      if (!detected || detected === currentLanguage) {
        return;
      }

      // 如果用户已经拒绝过这个语言的提示，不再显示
      if (isDismissed(detected)) {
        return;
      }

      // 显示提示
      setDetectedLanguage(detected);
      setShouldShowPrompt(true);
    }, DETECTION_DELAY);

    return () => clearTimeout(timer);
  }, [currentLanguage]);

  const dismissPrompt = () => {
    if (detectedLanguage) {
      markDismissed(detectedLanguage);
    }
    setShouldShowPrompt(false);
  };

  const acceptSwitch = () => {
    setShouldShowPrompt(false);
  };

  return {
    shouldShowPrompt,
    detectedLanguage,
    dismissPrompt,
    acceptSwitch,
  };
}
