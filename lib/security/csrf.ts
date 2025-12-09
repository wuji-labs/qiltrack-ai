/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * Provides token-based CSRF protection for state-changing API operations.
 *
 * @module lib/security/csrf
 */

import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_TOKEN_COOKIE_NAME = "csrf-token";
const CSRF_TOKEN_HEADER_NAME = "x-csrf-token";

/**
 * Generate a new CSRF token and store it in a cookie
 *
 * @returns The generated CSRF token
 *
 * @example
 * ```typescript
 * // In a page component
 * const csrfToken = await generateCsrfToken();
 *
 * // Pass to client for inclusion in API requests
 * <input type="hidden" name="csrfToken" value={csrfToken} />
 * ```
 */
export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const cookieStore = await cookies();

  cookieStore.set(CSRF_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return token;
}

/**
 * Validate a CSRF token from request header against stored cookie
 *
 * @param token - The CSRF token from request header
 * @returns True if token is valid, false otherwise
 *
 * @example
 * ```typescript
 * // In API route
 * export async function POST(request: Request) {
 *   const csrfToken = request.headers.get('x-csrf-token');
 *
 *   if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
 *     return NextResponse.json(
 *       { error: 'Invalid CSRF token' },
 *       { status: 403 }
 *     );
 *   }
 *
 *   // Continue processing...
 * }
 * ```
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  const cookieStore = await cookies();
  const storedToken = cookieStore.get(CSRF_TOKEN_COOKIE_NAME)?.value;

  if (!storedToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
}

/**
 * Get CSRF token from request header
 *
 * @param request - The Next.js request object
 * @returns The CSRF token or null if not present
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  return request.headers.get(CSRF_TOKEN_HEADER_NAME);
}

/**
 * Middleware helper to validate CSRF token
 * Returns error response if validation fails, null if validation passes
 *
 * @param request - The Next.js request object
 * @returns Error response or null
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const csrfError = await requireCsrfToken(request);
 *   if (csrfError) return csrfError;
 *
 *   // Continue processing...
 * }
 * ```
 */
export async function requireCsrfToken(request: Request) {
  const token = getCsrfTokenFromRequest(request);

  if (!token || !(await validateCsrfToken(token))) {
    const { NextResponse } = await import("next/server");
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    );
  }

  return null;
}
