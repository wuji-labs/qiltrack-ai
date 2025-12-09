"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { LANGUAGE_OPTIONS } from "@/lib/i18n-config";

type Preferences = {
  language: string;
  timezone: string;
  emailNotifications: boolean;
  saveHistory: boolean;
  theme: "light" | "dark" | "system";
};

export default function PreferencesSection() {
  const { language, setLanguage, t } = useLanguage();
  const [prefs, setPrefs] = useState<Preferences>({
    language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emailNotifications: true,
    saveHistory: true,
    theme: "dark",
  });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  const PREF_KEY = "ia-account-preferences";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Preferences;
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore malformed data
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    setPrefs((prev) => (prev.language === language ? prev : { ...prev, language }));
  }, [language]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }, [prefs, loaded]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateLanguage = (newLang: string) => {
    setPrefs((prev) => ({ ...prev, language: newLang }));
    setLanguage(newLang as typeof language);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("account.preferences.title")}</h2>
        <p className="mt-1 text-sm text-subtle">{t("account.preferences.description")}</p>
      </div>

      {saved && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 text-green-400 p-3 text-sm">
          {t("account.preferences.saveSuccess")}
        </div>
      )}

      {/* Language & Region */}
      <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold">{t("account.preferences.languageRegion")}</h3>
          <p className="mt-1 text-sm text-subtle">
            {t("account.preferences.languageRegionDescription")}
          </p>
        </div>

        <div className="space-y-4">
          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("account.preferences.language")}</label>
            <select
              value={prefs.language}
              onChange={(e) => updateLanguage(e.target.value)}
              className="w-full rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-emerald)]"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-subtle">{t("account.preferences.languageHint")}</p>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("account.preferences.timezone")}</label>
            <input
              type="text"
              value={prefs.timezone}
              onChange={(e) => setPrefs((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-emerald)]"
            />
            <p className="text-xs text-subtle">{t("account.preferences.timezoneHint")}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold">{t("account.preferences.notifications")}</h3>
          <p className="mt-1 text-sm text-subtle">{t("account.preferences.notificationsDescription")}</p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={prefs.emailNotifications}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, emailNotifications: e.target.checked }))
              }
              className="mt-0.5 h-4 w-4 rounded border-[var(--stroke-soft)] bg-[var(--bg-base)] text-[var(--accent-emerald)] focus:ring-2 focus:ring-[var(--accent-emerald)] focus:ring-offset-0"
            />
            <div className="flex-1">
              <p className="text-sm font-medium group-hover:text-[var(--color-foreground)]">
                {t("account.preferences.emailNotifications")}
              </p>
              <p className="text-xs text-subtle mt-0.5">
                {t("account.preferences.emailNotificationsHint")}
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={prefs.saveHistory}
              onChange={(e) => setPrefs((prev) => ({ ...prev, saveHistory: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-[var(--stroke-soft)] bg-[var(--bg-base)] text-[var(--accent-emerald)] focus:ring-2 focus:ring-[var(--accent-emerald)] focus:ring-offset-0"
            />
            <div className="flex-1">
              <p className="text-sm font-medium group-hover:text-[var(--color-foreground)]">
                {t("account.preferences.saveHistory")}
              </p>
              <p className="text-xs text-subtle mt-0.5">{t("account.preferences.saveHistoryHint")}</p>
            </div>
          </label>
        </div>
      </div>

      {/* Appearance (Future) */}
      <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-4 opacity-60">
        <div>
          <h3 className="text-base font-semibold">{t("account.preferences.appearance")}</h3>
          <p className="mt-1 text-sm text-subtle">{t("account.preferences.appearanceDescription")}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("account.preferences.theme")}</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "light", label: t("account.preferences.themeLight"), icon: "☀️" },
              { value: "dark", label: t("account.preferences.themeDark"), icon: "🌙" },
              { value: "system", label: t("account.preferences.themeSystem"), icon: "💻" },
            ].map((theme) => (
              <button
                key={theme.value}
                type="button"
                disabled
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 cursor-not-allowed ${
                  prefs.theme === theme.value
                    ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald)]/10"
                    : "border-[var(--stroke-soft)] bg-[var(--bg-base)]"
                }`}
              >
                <span className="text-2xl">{theme.icon}</span>
                <span className="text-xs font-medium">{theme.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-subtle">{t("common.comingSoon")}</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg bg-[var(--accent-emerald)] text-sm font-semibold text-slate-950 shadow-[0_8px_16px_rgba(91,224,176,0.24)] hover:brightness-105 transition-all"
        >
          {saved ? t("common.saved") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
