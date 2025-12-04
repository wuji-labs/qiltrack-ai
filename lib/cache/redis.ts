/**
 * Redis Cache Module
 *
 * Provides caching functionality for:
 * - Market data (1 hour TTL)
 * - Report reuse (7 days TTL)
 * - Cache hit rate tracking
 */

import { Redis } from '@upstash/redis';
import type { GeneratedReport } from '@/lib/core/reports/types';

/**
 * Redis client instance
 * Only initialized if environment variables are present
 */
type RedisLike = {
  get<TData>(key: string): Promise<TData | null>;
  set(key: string, value: unknown): Promise<unknown>;
  setex(key: string, ttl: number, value: unknown): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
};

class InMemoryRedis implements RedisLike {
  private store = new Map<string, unknown>();

  async get<TData>(key: string): Promise<TData | null> {
    return this.store.has(key) ? (this.store.get(key) as TData) : null;
  }

  async set(key: string, value: unknown): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async setex(key: string, _ttl: number, value: unknown): Promise<'OK'> {
    return this.set(key, value);
  }

  async del(...keys: string[]) {
    let count = 0;
    keys.forEach((key) => {
      if (this.store.delete(key)) count += 1;
    });
    return count;
  }

  async incr(key: string) {
    const next = (this.store.get(key) as number | undefined) ?? 0;
    const value = next + 1;
    this.store.set(key, value);
    return value;
  }

  async keys(pattern: string) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }
}

let redis: RedisLike | null = null;

/**
 * Initialize Redis client
 */
function getRedisClient(): RedisLike | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === 'test') {
      redis = new InMemoryRedis();
      return redis;
    }
    console.warn('[Redis] Environment variables not set. Cache disabled.');
    return null;
  }

  try {
    redis = new Redis({
      url,
      token,
      automaticDeserialization: true,
    });
    console.info('[Redis] Client initialized successfully');
    return redis;
  } catch (error) {
    console.error('[Redis] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Cache key prefix to avoid conflicts
 */
const KEY_PREFIX = {
  MARKET_DATA: 'market:',
  REPORT: 'report:',
  METRICS: 'metrics:',
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
const TTL = {
  MARKET_DATA: 3600, // 1 hour
  REPORT: 604800, // 7 days
} as const;

/**
 * Cache statistics for tracking hit/miss rates
 */
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * Report cache parameters
 */
export interface ReportCacheParams {
  symbol: string;
  language: string;
  tone: string;
}

/**
 * Market Data Cache
 */
export class MarketDataCache {
  private redis: RedisLike | null;

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Get cached market data
   */
  async get(symbol: string): Promise<Record<string, unknown> | null> {
    if (!this.redis) return null;

    try {
      const key = `${KEY_PREFIX.MARKET_DATA}${symbol.toUpperCase()}`;
      const data = await this.redis.get(key);

      if (data) {
        await this.incrementHit('market_data');
        // Parse if string
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return parsed as Record<string, unknown>;
      } else {
        await this.incrementMiss('market_data');
        return null;
      }
    } catch (error) {
      console.error('[MarketDataCache] Get error:', error);
      return null;
    }
  }

  /**
   * Set market data cache
   */
  async set(symbol: string, data: Record<string, unknown>): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `${KEY_PREFIX.MARKET_DATA}${symbol.toUpperCase()}`;
      await this.redis.setex(key, TTL.MARKET_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('[MarketDataCache] Set error:', error);
    }
  }

  /**
   * Invalidate market data cache
   */
  async invalidate(symbol: string): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `${KEY_PREFIX.MARKET_DATA}${symbol.toUpperCase()}`;
      await this.redis.del(key);
    } catch (error) {
      console.error('[MarketDataCache] Invalidate error:', error);
    }
  }

  private async incrementHit(type: string): Promise<void> {
    if (!this.redis) return;
    const key = `${KEY_PREFIX.METRICS}${type}:hits`;
    await this.redis.incr(key).catch(() => {});
  }

  private async incrementMiss(type: string): Promise<void> {
    if (!this.redis) return;
    const key = `${KEY_PREFIX.METRICS}${type}:misses`;
    await this.redis.incr(key).catch(() => {});
  }
}

/**
 * Report Cache for reusing generated reports
 */
export class ReportCache {
  private redis: RedisLike | null;

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Generate cache key from report parameters
   */
  private getCacheKey(params: ReportCacheParams): string {
    const { symbol, language, tone } = params;
    return `${KEY_PREFIX.REPORT}${symbol.toUpperCase()}:${language}:${tone}`;
  }

  /**
   * Get cached report
   *
   * @param params - Report parameters
   * @returns Cached report or null if not found/expired
   */
  async get(params: ReportCacheParams): Promise<GeneratedReport | null> {
    if (!this.redis) return null;

    try {
      const key = this.getCacheKey(params);
      const cached = await this.redis.get(key);

      if (!cached) {
        await this.incrementMiss('report');
        return null;
      }

      // Parse cached data
      const cachedData = typeof cached === 'string' ? JSON.parse(cached) : cached;

      // Check if cache is still valid (7 days)
      const cachedAt = new Date(cachedData.metadata?.generatedAt);
      const now = new Date();
      const ageInDays = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (ageInDays > 7) {
        // Cache expired, delete it
        await this.redis.del(key);
        await this.incrementMiss('report');
        return null;
      }

      await this.incrementHit('report');
      return cachedData as GeneratedReport;
    } catch (error) {
      console.error('[ReportCache] Get error:', error);
      await this.incrementMiss('report');
      return null;
    }
  }

  /**
   * Set report cache
   *
   * @param params - Report parameters
   * @param report - Generated report
   */
  async set(params: ReportCacheParams, report: GeneratedReport): Promise<void> {
    if (!this.redis) return;

    try {
      const key = this.getCacheKey(params);
      await this.redis.setex(key, TTL.REPORT, JSON.stringify(report));
    } catch (error) {
      console.error('[ReportCache] Set error:', error);
    }
  }

  /**
   * Invalidate report cache
   */
  async invalidate(params: ReportCacheParams): Promise<void> {
    if (!this.redis) return;

    try {
      const key = this.getCacheKey(params);
      await this.redis.del(key);
    } catch (error) {
      console.error('[ReportCache] Invalidate error:', error);
    }
  }

  /**
   * Invalidate all reports for a symbol
   */
  async invalidateSymbol(symbol: string): Promise<void> {
    if (!this.redis) return;

    try {
      // In production, use SCAN instead of KEYS for better performance
      const pattern = `${KEY_PREFIX.REPORT}${symbol.toUpperCase()}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('[ReportCache] InvalidateSymbol error:', error);
    }
  }

  private async incrementHit(type: string): Promise<void> {
    if (!this.redis) return;
    const key = `${KEY_PREFIX.METRICS}${type}:hits`;
    await this.redis.incr(key).catch(() => {});
  }

  private async incrementMiss(type: string): Promise<void> {
    if (!this.redis) return;
    const key = `${KEY_PREFIX.METRICS}${type}:misses`;
    await this.redis.incr(key).catch(() => {});
  }
}

/**
 * Cache Metrics Service
 *
 * Tracks and reports cache performance
 */
export class CacheMetrics {
  private redis: RedisLike | null;

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Get cache statistics for a specific type
   */
  async getStats(type: 'market_data' | 'report'): Promise<CacheStats> {
    if (!this.redis) {
      return { hits: 0, misses: 0, hitRate: 0 };
    }

    try {
      const hitsKey = `${KEY_PREFIX.METRICS}${type}:hits`;
      const missesKey = `${KEY_PREFIX.METRICS}${type}:misses`;

      const [hits, misses] = await Promise.all([
        this.redis.get(hitsKey),
        this.redis.get(missesKey),
      ]);

      const hitsCount = typeof hits === 'number' ? hits : 0;
      const missesCount = typeof misses === 'number' ? misses : 0;
      const total = hitsCount + missesCount;
      const hitRate = total > 0 ? (hitsCount / total) * 100 : 0;

      return {
        hits: hitsCount,
        misses: missesCount,
        hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimals
      };
    } catch (error) {
      console.error('[CacheMetrics] GetStats error:', error);
      return { hits: 0, misses: 0, hitRate: 0 };
    }
  }

  /**
   * Get all cache statistics
   */
  async getAllStats(): Promise<{
    marketData: CacheStats;
    report: CacheStats;
  }> {
    const [marketData, report] = await Promise.all([
      this.getStats('market_data'),
      this.getStats('report'),
    ]);

    return { marketData, report };
  }

  /**
   * Reset cache statistics
   */
  async resetStats(): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = [
        `${KEY_PREFIX.METRICS}market_data:hits`,
        `${KEY_PREFIX.METRICS}market_data:misses`,
        `${KEY_PREFIX.METRICS}report:hits`,
        `${KEY_PREFIX.METRICS}report:misses`,
      ];

      await this.redis.del(...keys);
    } catch (error) {
      console.error('[CacheMetrics] ResetStats error:', error);
    }
  }
}

/**
 * Singleton instances for convenience
 */
export const marketDataCache = new MarketDataCache();
export const reportCache = new ReportCache();
export const cacheMetrics = new CacheMetrics();
