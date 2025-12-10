"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

/**
 * GDPR/CCPA Cookie Consent Banner
 *
 * Compliance Requirements:
 * - GDPR Article 7: Consent must be freely given, specific, informed, and unambiguous
 * - ePrivacy Directive: Users must consent before non-essential cookies
 * - CCPA: Users must have clear option to opt-out
 *
 * Cookie Categories:
 * - Essential: Required for site functionality (authentication, security)
 * - Analytics: Usage tracking (Vercel Analytics, Sentry)
 * - Marketing: Third-party advertising (currently not used)
 */

interface CookiePreferences {
  essential: boolean; // Always true (required)
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_COOKIE_NAME = "qiltrack_cookie_consent";
const CONSENT_VERSION = "1.0"; // Increment when cookie policy changes

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(CONSENT_COOKIE_NAME);

    if (!consent) {
      // Show banner after short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      try {
        const parsed = JSON.parse(consent);
        // Re-show banner if consent version changed
        if (parsed.version !== CONSENT_VERSION) {
          setShowBanner(true);
        } else {
          applyConsent(parsed.preferences);
        }
      } catch (error) {
        // Invalid consent format, show banner
        setShowBanner(true);
      }
    }
  }, []);

  const applyConsent = (prefs: CookiePreferences) => {
    // Apply analytics consent
    if (prefs.analytics) {
      // Enable Vercel Analytics
      if (typeof window !== "undefined" && (window as any).va) {
        (window as any).va("event", "consent_granted", { category: "analytics" });
      }

      // Enable Sentry if configured
      if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.init({ enabled: true });
      }
    } else {
      // Disable analytics
      if (typeof window !== "undefined" && (window as any).va) {
        (window as any).va("event", "consent_denied", { category: "analytics" });
      }

      // Disable Sentry
      if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.close();
      }
    }

    // Marketing cookies (currently not used)
    if (prefs.marketing) {
      // Future: Enable marketing pixels
    }
  };

  const saveConsent = (prefs: CookiePreferences) => {
    const consent = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      preferences: prefs,
    };

    localStorage.setItem(CONSENT_COOKIE_NAME, JSON.stringify(consent));
    applyConsent(prefs);
    setShowBanner(false);

    // Log consent event
    console.info("[COOKIE_CONSENT]", prefs);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🍪</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cookie Preferences
                </h3>
              </div>

              {!showDetails ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    We use cookies to enhance your experience, analyze site traffic, and provide
                    personalized features. By clicking "Accept All", you consent to our use of
                    cookies.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleAcceptAll}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md font-medium transition-colors"
                    >
                      Reject All
                    </button>
                    <button
                      onClick={() => setShowDetails(true)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md font-medium transition-colors"
                    >
                      Customize
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Read our{" "}
                    <a href="/privacy" className="underline hover:text-blue-600">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a href="/cookie-policy" className="underline hover:text-blue-600">
                      Cookie Policy
                    </a>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Choose which cookies you want to accept:
                  </p>

                  <div className="space-y-3">
                    {/* Essential Cookies */}
                    <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="mt-1 h-4 w-4 text-blue-600 rounded opacity-50"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Essential Cookies
                          <span className="ml-2 text-xs text-gray-500">(Always Active)</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Required for authentication, security, and basic site functionality.
                        </p>
                      </div>
                    </label>

                    {/* Analytics Cookies */}
                    <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                        className="mt-1 h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Analytics Cookies
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Help us understand how visitors use our site. Includes Vercel Analytics
                          and Sentry error tracking.
                        </p>
                      </div>
                    </label>

                    {/* Marketing Cookies */}
                    <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({ ...preferences, marketing: e.target.checked })
                        }
                        className="mt-1 h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Marketing Cookies
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Currently not used. Reserved for future personalized advertising features.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={handleSavePreferences}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                    >
                      Save Preferences
                    </button>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md font-medium transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to access cookie consent status
 * Usage: const { analytics, marketing } = useCookieConsent();
 */
export function useCookieConsent(): CookiePreferences {
  const [consent, setConsent] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const storedConsent = localStorage.getItem(CONSENT_COOKIE_NAME);
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);
        setConsent(parsed.preferences);
      } catch (error) {
        console.error("[COOKIE_CONSENT] Failed to parse consent", error);
      }
    }
  }, []);

  return consent;
}
