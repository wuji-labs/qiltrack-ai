/**
 * Authentication Rate Limit Check API
 *
 * This endpoint checks if the client IP is within rate limits
 * before allowing authentication operations that trigger emails.
 *
 * @module app/api/auth/check-rate-limit
 */

import { NextResponse } from 'next/server';
import { authRateLimit, checkRateLimit, getIpAddress } from '@/lib/api/rate-limit';

export const runtime = 'edge';

/**
 * POST /api/auth/check-rate-limit
 *
 * Checks rate limit for authentication operations.
 * Should be called before sending verification emails, password reset emails, etc.
 *
 * @returns 200 if within limits, 429 if rate limited
 */
export async function POST(request: Request) {
  const ip = getIpAddress(request);

  const result = await checkRateLimit(ip, authRateLimit);

  if (!result.success) {
    return NextResponse.json(
      {
        error: '请求过于频繁，请稍后再试',
        code: 'rate_limited',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: result.headers,
      }
    );
  }

  return NextResponse.json(
    {
      success: true,
      remaining: result.remaining,
    },
    {
      headers: result.headers,
    }
  );
}
