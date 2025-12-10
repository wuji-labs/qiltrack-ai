/**
 * i18n Internationalization System
 * Provides multi-language support with type-safe translations
 */

import type { Language } from "@/lib/i18n-config";
import { DEFAULT_LANGUAGE } from "@/lib/i18n-config";

// Translation type from English translations (source of truth)
import enTranslations from "./translations/en.json";
import zhHansTranslations from "./translations/zh-Hans.json";

type Translations = typeof enTranslations;
type TranslationKey = keyof Translations;
type NestedTranslationKey<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedTranslationKey<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type I18nKey = NestedTranslationKey<Translations>;

// Translation dictionaries
const translations: Record<Language, Translations> = {
  en: enTranslations,
  "zh-Hans": zhHansTranslations as Translations,
  // Other languages use English as fallback for now
  ja: enTranslations,
  ko: enTranslations,
  "zh-Hant": zhHansTranslations as Translations, // Use simplified Chinese as fallback for traditional
};

/**
 * Get nested translation value by dot-notation key
 */
function getNestedTranslation(obj: any, path: string): string | undefined {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Translate a key to the specified language
 * @param key - Translation key in dot notation (e.g., "common.loading")
 * @param lang - Target language
 * @param params - Optional parameters for interpolation
 */
export function t(
  key: I18nKey,
  lang: Language = DEFAULT_LANGUAGE,
  params?: Record<string, string | number>
): string {
  const langDict = translations[lang] || translations[DEFAULT_LANGUAGE];
  let translation = getNestedTranslation(langDict, key);

  // Fallback to English if translation not found
  if (!translation && lang !== DEFAULT_LANGUAGE) {
    translation = getNestedTranslation(translations[DEFAULT_LANGUAGE], key);
  }

  // Final fallback to key itself
  if (!translation) {
    console.warn(`[i18n] Missing translation for key: ${key} (lang: ${lang})`);
    return key;
  }

  // Interpolate parameters
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      translation = translation!.replace(new RegExp(`{{${paramKey}}}`, "g"), String(value));
    });
  }

  return translation;
}

/**
 * Create a translation function bound to a specific language
 * Useful for server components and API routes
 */
export function createTranslator(lang: Language) {
  return (key: I18nKey, params?: Record<string, string | number>) => t(key, lang, params);
}

/**
 * Get all translations for a specific namespace
 * @param namespace - Top-level translation namespace (e.g., "common", "auth")
 * @param lang - Target language
 */
export function getNamespace<K extends TranslationKey>(
  namespace: K,
  lang: Language = DEFAULT_LANGUAGE
): Translations[K] {
  const langDict = translations[lang] || translations[DEFAULT_LANGUAGE];
  return langDict[namespace] || translations[DEFAULT_LANGUAGE][namespace];
}

/**
 * Check if a translation key exists
 */
export function hasTranslation(key: I18nKey, lang: Language = DEFAULT_LANGUAGE): boolean {
  const langDict = translations[lang] || translations[DEFAULT_LANGUAGE];
  return getNestedTranslation(langDict, key) !== undefined;
}

/**
 * Get available languages
 */
export function getAvailableLanguages(): Language[] {
  return Object.keys(translations) as Language[];
}

/**
 * Validate language code
 */
export function isValidLanguage(lang: string): lang is Language {
  return lang in translations;
}

/**
 * React hook for client-side translations
 * Usage: const t = useTranslation();
 */
export function useTranslation(lang?: Language) {
  // In a real React app, this would use React.useContext to get language from provider
  // For now, return a simple translator
  const currentLang = lang || DEFAULT_LANGUAGE;

  return {
    t: (key: I18nKey, params?: Record<string, string | number>) => t(key, currentLang, params),
    lang: currentLang,
  };
}

// Export translation types for type safety
export type { Translations, TranslationKey };
