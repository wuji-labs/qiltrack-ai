const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export const turnstileSiteKey = siteKey;

/**
 * Whether Turnstile is configured for the current runtime.
 * Falls back to disabled when env variables are missing to avoid blocking local dev.
 */
export function isTurnstileEnabled() {
  return Boolean(siteKey);
}
