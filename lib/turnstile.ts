/**
 * Cloudflare Turnstile server-side verification
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes?: string[];
}

/**
 * Verify a Turnstile token server-side
 * @param token - The token received from the client
 * @param remoteIp - Optional IP address of the user
 * @returns Verification result
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn("Turnstile secret key is not configured");
    // In development, allow requests without verification
    if (process.env.NODE_ENV === "development") {
      return { success: true };
    }
    return { success: false, errorCodes: ["missing-secret-key"] };
  }

  if (!token) {
    return { success: false, errorCodes: ["missing-token"] };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error("Turnstile verification request failed:", response.status);
      return { success: false, errorCodes: ["request-failed"] };
    }

    const result: TurnstileVerifyResponse = await response.json();

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      errorCodes: result["error-codes"] ?? ["verification-failed"],
    };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, errorCodes: ["network-error"] };
  }
}

/**
 * Extract client IP from request headers
 * Supports common proxy headers
 */
export function getClientIp(headers: Headers): string | undefined {
  // Try CF-Connecting-IP first (Cloudflare)
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // Try X-Forwarded-For (common proxy header)
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // Get the first IP in the chain
    return xForwardedFor.split(",")[0].trim();
  }

  // Try X-Real-IP (nginx)
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  return undefined;
}

/**
 * Check if Turnstile is enabled (site key configured)
 */
export function isTurnstileEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}
