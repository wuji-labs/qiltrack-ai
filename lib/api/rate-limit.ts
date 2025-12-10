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
 * In-memory fallback rate limiter for when Redis is unavailable
 * Uses a simple sliding window algorithm with LRU eviction
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxKeys = 10000; // Prevent memory exhaustion

  limit(identifier: string, windowMs: number, maxRequests: number): { success: boolean; remaining: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request timestamps for this identifier
    let timestamps = this.requests.get(identifier) || [];

    // Remove expired timestamps (outside the window)
    timestamps = timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    const success = timestamps.length < maxRequests;

    if (success) {
      timestamps.push(now);
    }

    // Update the map
    this.requests.set(identifier, timestamps);

    // LRU eviction: if too many keys, remove oldest entries
    if (this.requests.size > this.maxKeys) {
      const firstKey = this.requests.keys().next().value;
      this.requests.delete(firstKey);
    }

    return {
      success,
      remaining: Math.max(0, maxRequests - timestamps.length),
    };
  }
}

const memoryLimiter = new InMemoryRateLimiter();

/**
 * Initialize Redis client from environment variables
 * Falls back to a mock implementation if Redis is not configured
 */
function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[RATE_LIMIT] Redis not configured, using in-memory fallback');
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
 * Password Change Rate Limiter
 * - Limit: 5 requests per hour per user
 * - Prevents brute force password attacks
 * - Identifier: user_id
 */
export const passwordChangeRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix: 'ratelimit:password-change',
    })
  : null;

/**
 * Admin Action Rate Limiter
 * - Limit: 20 requests per hour per admin
 * - Prevents abuse of admin operations
 * - Identifier: admin_user_id
 */
export const adminActionRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      analytics: true,
      prefix: 'ratelimit:admin-action',
    })
  : null;

/**
 * File Upload Rate Limiter
 * - Limit: 10 requests per hour per user
 * - Prevents storage exhaustion
 * - Identifier: user_id
 */
export const fileUploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'ratelimit:file-upload',
    })
  : null;

/**
 * Search API Rate Limiter
 * - Limit: 30 requests per minute per IP
 * - Prevents API quota exhaustion
 * - Identifier: IP address
 */
export const searchRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: 'ratelimit:search',
    })
  : null;

/**
 * Webhook Rate Limiter
 * - Limit: 100 requests per minute per IP
 * - Protects against webhook DDoS
 * - Identifier: IP address
 */
export const webhookRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:webhook',
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
 * @param fallbackConfig - Fallback configuration for in-memory limiter
 * @returns Rate limit result with headers
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit(userId, reportGenerationRateLimit, { windowMs: 60000, maxRequests: 5 });
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
  ratelimit: Ratelimit | null,
  fallbackConfig?: { windowMs: number; maxRequests: number }
): Promise<RateLimitResult> {
  // If rate limiting is disabled, use in-memory fallback
  if (!ratelimit) {
    if (!fallbackConfig) {
      console.warn('[RATE_LIMIT] No fallback config provided, using default: 20 req/min');
      fallbackConfig = { windowMs: 60000, maxRequests: 20 };
    }

    const { success, remaining } = memoryLimiter.limit(
      identifier,
      fallbackConfig.windowMs,
      fallbackConfig.maxRequests
    );

    const reset = Date.now() + fallbackConfig.windowMs;

    return {
      success,
      limit: fallbackConfig.maxRequests,
      remaining,
      reset,
      headers: {
        'X-RateLimit-Limit': fallbackConfig.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
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
    console.error('[RATE_LIMIT_ERROR] Redis failed, using in-memory fallback', error);

    // On error, use in-memory fallback instead of fail-open
    if (!fallbackConfig) {
      fallbackConfig = { windowMs: 60000, maxRequests: 20 };
    }

    const { success, remaining } = memoryLimiter.limit(
      identifier,
      fallbackConfig.windowMs,
      fallbackConfig.maxRequests
    );

    const reset = Date.now() + fallbackConfig.windowMs;

    return {
      success,
      limit: fallbackConfig.maxRequests,
      remaining,
      reset,
      headers: {
        'X-RateLimit-Limit': fallbackConfig.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
        'X-RateLimit-Fallback': 'memory',
      },
    };
  }
}

/**
 * Trusted proxy detection
 * Only accept X-Forwarded-For from known proxy providers
 */
const TRUSTED_PROXY_HEADERS = [
  'cf-connecting-ip',      // Cloudflare
  'x-vercel-forwarded-for', // Vercel
  'x-real-ip',             // Nginx
];

function isTrustedProxy(request: Request): boolean {
  const headers = new Headers(request.headers);

  // Check for Cloudflare
  if (headers.get('cf-ray')) return true;

  // Check for Vercel
  if (headers.get('x-vercel-id')) return true;

  // Check for other known headers
  return TRUSTED_PROXY_HEADERS.some(header => headers.has(header));
}

/**
 * Get IP address from request
 * Handles various proxy headers with security validation
 *
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getIpAddress(request: Request): string {
  const headers = new Headers(request.headers);

  // Priority 1: Cloudflare (most trusted)
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }

  // Priority 2: Vercel (trusted)
  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }

  // Priority 3: X-Real-IP (trusted reverse proxies)
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Priority 4: X-Forwarded-For (only if from trusted proxy)
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded && isTrustedProxy(request)) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // Take the FIRST IP (client's real IP)
    return forwarded.split(',')[0].trim();
  }

  // Fallback: If X-Forwarded-For exists but proxy is untrusted, reject it
  if (forwarded) {
    console.warn('[RATE_LIMIT] Untrusted X-Forwarded-For header rejected');
  }

  // Final fallback to a generic identifier
  return 'unknown';
}
