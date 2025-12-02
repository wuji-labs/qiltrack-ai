/**
 * Tests for Redis Cache Module
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-assign-module-variable */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GeneratedReport } from '@/lib/core/reports/types';

// Mock Redis
vi.mock('@upstash/redis', () => {
  const mockData = new Map<string, any>();

  return {
    Redis: vi.fn().mockImplementation(() => ({
      get: vi.fn(async (key: string) => mockData.get(key) || null),
      set: vi.fn(async (key: string, value: any) => {
        mockData.set(key, value);
        return 'OK';
      }),
      setex: vi.fn(async (key: string, _ttl: number, value: any) => {
        mockData.set(key, value);
        return 'OK';
      }),
      del: vi.fn(async (...keys: string[]) => {
        keys.forEach((key) => mockData.delete(key));
        return keys.length;
      }),
      incr: vi.fn(async (key: string) => {
        const current = mockData.get(key) || 0;
        const next = current + 1;
        mockData.set(key, next);
        return next;
      }),
      keys: vi.fn(async (pattern: string) => {
        const regex = new RegExp(
          '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
        );
        return Array.from(mockData.keys()).filter((key) => regex.test(key));
      }),
      // Expose mockData for test cleanup
      __mockData: mockData,
    })),
  };
});

// Set up environment variables for tests
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

describe('MarketDataCache', () => {
  let MarketDataCache: any;

  beforeEach(async () => {
    // Clear module cache and reimport
    vi.resetModules();
    const mod = await import('@/lib/cache/redis');
    MarketDataCache = mod.MarketDataCache;
  });

  it('should return null for cache miss', async () => {
    const cache = new MarketDataCache();
    const result = await cache.get('AAPL');
    expect(result).toBeNull();
  });

  it('should cache and retrieve market data', async () => {
    const cache = new MarketDataCache();
    const testData = {
      symbol: 'AAPL',
      price: 150.0,
      volume: 1000000,
    };

    await cache.set('AAPL', testData);
    const result = await cache.get('AAPL');

    expect(result).toEqual(testData);
  });

  it('should invalidate cache', async () => {
    const cache = new MarketDataCache();
    const testData = { symbol: 'AAPL', price: 150.0 };

    await cache.set('AAPL', testData);
    await cache.invalidate('AAPL');

    const result = await cache.get('AAPL');
    expect(result).toBeNull();
  });
});

describe('ReportCache', () => {
  let ReportCache: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/cache/redis');
    ReportCache = mod.ReportCache;
  });

  it('should cache and retrieve reports', async () => {
    const cache = new ReportCache();
    const testReport: GeneratedReport = {
      content: '# Test Report',
      marketData: {
        symbol: 'AAPL',
        profile: { name: 'Apple Inc.' },
        quote: { c: 150.0 },
        metrics: {},
        news: [],
      },
      metadata: {
        symbol: 'AAPL',
        language: 'en',
        tone: 'baseline',
        generatedAt: new Date().toISOString(),
        generationTimeMs: 1000,
      },
    };

    await cache.set(
      { symbol: 'AAPL', language: 'en', tone: 'baseline' },
      testReport
    );

    const result = await cache.get({
      symbol: 'AAPL',
      language: 'en',
      tone: 'baseline',
    });

    expect(result).toBeDefined();
    expect(result?.content).toBe('# Test Report');
    expect(result?.metadata.symbol).toBe('AAPL');
  });

  it('should return null for expired cache', async () => {
    const cache = new ReportCache();

    // Create a report with old timestamp (8 days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8);

    const oldReport: GeneratedReport = {
      content: '# Old Report',
      marketData: {
        symbol: 'AAPL',
        profile: { name: 'Apple Inc.' },
        quote: { c: 150.0 },
        metrics: {},
        news: [],
      },
      metadata: {
        symbol: 'AAPL',
        language: 'en',
        tone: 'baseline',
        generatedAt: oldDate.toISOString(),
        generationTimeMs: 1000,
      },
    };

    await cache.set(
      { symbol: 'AAPL', language: 'en', tone: 'baseline' },
      oldReport
    );

    const result = await cache.get({
      symbol: 'AAPL',
      language: 'en',
      tone: 'baseline',
    });

    expect(result).toBeNull();
  });

  it('should generate different keys for different parameters', async () => {
    const cache = new ReportCache();
    const report1: GeneratedReport = {
      content: '# Report EN',
      marketData: {
        symbol: 'AAPL',
        profile: {},
        quote: {},
        metrics: {},
        news: [],
      },
      metadata: {
        symbol: 'AAPL',
        language: 'en',
        tone: 'baseline',
        generatedAt: new Date().toISOString(),
        generationTimeMs: 1000,
      },
    };

    const report2: GeneratedReport = {
      ...report1,
      content: '# Report ZH',
      metadata: {
        ...report1.metadata,
        language: 'zh-Hans',
      },
    };

    await cache.set({ symbol: 'AAPL', language: 'en', tone: 'baseline' }, report1);
    await cache.set({ symbol: 'AAPL', language: 'zh-Hans', tone: 'baseline' }, report2);

    const result1 = await cache.get({ symbol: 'AAPL', language: 'en', tone: 'baseline' });
    const result2 = await cache.get({ symbol: 'AAPL', language: 'zh-Hans', tone: 'baseline' });

    expect(result1?.content).toBe('# Report EN');
    expect(result2?.content).toBe('# Report ZH');
  });

  it('should invalidate all reports for a symbol', async () => {
    const cache = new ReportCache();
    const baseReport: GeneratedReport = {
      content: '# Test',
      marketData: {
        symbol: 'AAPL',
        profile: {},
        quote: {},
        metrics: {},
        news: [],
      },
      metadata: {
        symbol: 'AAPL',
        language: 'en',
        tone: 'baseline',
        generatedAt: new Date().toISOString(),
        generationTimeMs: 1000,
      },
    };

    // Cache multiple variations
    await cache.set({ symbol: 'AAPL', language: 'en', tone: 'baseline' }, baseReport);
    await cache.set({ symbol: 'AAPL', language: 'zh-Hans', tone: 'baseline' }, baseReport);
    await cache.set({ symbol: 'AAPL', language: 'en', tone: 'buffett' }, baseReport);

    // Invalidate all AAPL reports
    await cache.invalidateSymbol('AAPL');

    // All should be null
    const result1 = await cache.get({ symbol: 'AAPL', language: 'en', tone: 'baseline' });
    const result2 = await cache.get({ symbol: 'AAPL', language: 'zh-Hans', tone: 'baseline' });
    const result3 = await cache.get({ symbol: 'AAPL', language: 'en', tone: 'buffett' });

    expect(result1).toBeNull();
    expect(result2).toBeNull();
    expect(result3).toBeNull();
  });
});

describe('CacheMetrics', () => {
  let CacheMetrics: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/cache/redis');
    CacheMetrics = mod.CacheMetrics;
  });

  it('should track cache hits and misses', async () => {
    const metrics = new CacheMetrics();
    const { MarketDataCache } = await import('@/lib/cache/redis');
    const cache = new MarketDataCache();

    // Simulate cache miss
    await cache.get('AAPL');

    // Simulate cache hit
    await cache.set('AAPL', { price: 150 });
    await cache.get('AAPL');

    const stats = await metrics.getStats('market_data');

    expect(stats.hits).toBeGreaterThan(0);
    expect(stats.misses).toBeGreaterThan(0);
    expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    expect(stats.hitRate).toBeLessThanOrEqual(100);
  });

  it('should calculate hit rate correctly', async () => {
    const metrics = new CacheMetrics();
    const { MarketDataCache } = await import('@/lib/cache/redis');
    const cache = new MarketDataCache();

    // Reset stats
    await metrics.resetStats();

    // Simulate 3 hits and 1 miss = 75% hit rate
    await cache.set('AAPL', { price: 150 });
    await cache.get('AAPL'); // hit
    await cache.get('AAPL'); // hit
    await cache.get('AAPL'); // hit
    await cache.get('TSLA'); // miss

    const stats = await metrics.getStats('market_data');

    expect(stats.hits).toBe(3);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(75);
  });

  it('should reset statistics', async () => {
    const metrics = new CacheMetrics();
    const { MarketDataCache } = await import('@/lib/cache/redis');
    const cache = new MarketDataCache();

    // Generate some stats
    await cache.get('AAPL');
    await cache.set('AAPL', { price: 150 });
    await cache.get('AAPL');

    // Reset
    await metrics.resetStats();

    const stats = await metrics.getStats('market_data');

    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.hitRate).toBe(0);
  });

  it('should get all stats', async () => {
    const metrics = new CacheMetrics();

    const allStats = await metrics.getAllStats();

    expect(allStats).toHaveProperty('marketData');
    expect(allStats).toHaveProperty('report');
    expect(allStats.marketData).toHaveProperty('hits');
    expect(allStats.marketData).toHaveProperty('misses');
    expect(allStats.marketData).toHaveProperty('hitRate');
    expect(allStats.report).toHaveProperty('hits');
    expect(allStats.report).toHaveProperty('misses');
    expect(allStats.report).toHaveProperty('hitRate');
  });
});
