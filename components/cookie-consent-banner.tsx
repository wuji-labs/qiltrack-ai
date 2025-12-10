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
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm" />

      {/* Cookie banner - Modern compact design like GitHub/Stripe */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 sm:px-6">
        <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {!showDetails ? (
            // Simple view - GitHub style
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    We use cookies
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    We use essential cookies to make our site work. With your consent, we may also use non-essential cookies to improve user experience and analyze website traffic.{" "}
                    <a
                      href="/legal/privacy"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Learn more
                    </a>
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={handleAcceptAll}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                    >
                      Accept all
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                    >
                      Reject all
                    </button>
                    <button
                      onClick={() => setShowDetails(true)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                    >
                      Customize
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Detailed view - Stripe style
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cookie preferences
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We use cookies and similar technologies to provide, improve, and protect our services. Choose which types of cookies to allow:
                </p>

                <div className="space-y-3">
                  {/* Essential */}
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Essential cookies
                          </h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            Always active
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                          Required for authentication, security, and core site functionality. These cannot be disabled.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 opacity-50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer"
                       onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Analytics cookies
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                          Help us understand how you use our site. Includes anonymous usage statistics and error tracking (Vercel Analytics, Sentry).
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => {
                          e.stopPropagation();
                          setPreferences({ ...preferences, analytics: e.target.checked });
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Marketing */}
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer"
                       onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Marketing cookies
                          </h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            Coming soon
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                          Reserved for future personalized content and advertising features.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => {
                          e.stopPropagation();
                          setPreferences({ ...preferences, marketing: e.target.checked });
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                <a
                  href="/legal/privacy"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    Save preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
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
