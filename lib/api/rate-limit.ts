/**
 * Rate limiting middleware using Upstash Redis
 *
 * @module lib/api/rate-limit
 *
 * Provides two types of rate limiting:
 * 1. Report Generation: 5 requests per minute per user
 * 2. Global API: 20 requests per second per IP
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Initialize Redis client from environment variables
 * Falls back to a mock implementation if Redis is not configured
 */
function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[RATE_LIMIT] Redis not configured, rate limiting disabled');
    return null;
  }

  return new Redis({
    url,
    token,
  });
}

const redis = createRedisClient();

/**
 * Report Generation Rate Limiter
 * - Limit: 5 requests per minute per user
 * - Sliding window algorithm
 * - Identifier: user_id
 */
export const reportGenerationRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:report',
    })
  : null;

/**
 * Global API Rate Limiter
 * - Limit: 20 requests per second per IP
 * - Sliding window algorithm
 * - Identifier: IP address
 */
export const globalRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 s'),
      analytics: true,
      prefix: 'ratelimit:global',
    })
  : null;

/**
 * Authentication Rate Limiter
 * - Limit: 5 requests per minute per IP
 * - Sliding window algorithm
 * - Identifier: IP address
 *
 * Protects against:
 * - Email bombing (sending verification emails to random addresses)
 * - Brute force login attempts
 * - Registration spam
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null;

/**
 * Rate limit response interface
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

/**
 * Check rate limit and return standardized response
 *
 * @param identifier - Unique identifier (user_id or IP address)
 * @param ratelimit - Ratelimit instance to use
 * @returns Rate limit result with headers
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit(userId, reportGenerationRateLimit);
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Rate limit exceeded' },
 *     { status: 429, headers: result.headers }
 *   );
 * }
 * ```
 */
export async function checkRateLimit(
  identifier: string,
  ratelimit: Ratelimit | null
): Promise<RateLimitResult> {
  // If rate limiting is disabled, allow all requests
  if (!ratelimit) {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      headers: {},
    };
  }

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    return {
      success,
      limit,
      remaining,
      reset,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    };
  } catch (error) {
    console.error('[RATE_LIMIT_ERROR]', error);

    // On error, allow the request to proceed (fail open)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      headers: {},
    };
  }
}

/**
 * Get IP address from request
 * Handles various proxy headers
 *
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getIpAddress(request: Request): string {
  const headers = new Headers(request.headers);

  // Check various headers in order of preference
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'unknown';
}
