/**
 * Performance Tests
 *
 * Tests for critical path performance:
 * - Report generation latency
 * - Credit operations throughput
 * - Cache hit rates
 * - Concurrent request handling
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ReportGenerator } from '@/lib/core/reports/generator';
import { CreditManager } from '@/lib/core/credits/manager';
import { marketDataCache, reportCache } from '@/lib/cache/redis';

// Performance thresholds
const THRESHOLDS = {
  REPORT_GENERATION_CACHED: 1000, // <1s for cached reports
  REPORT_GENERATION_UNCACHED: 35000, // <35s for fresh reports
  CREDIT_CHECK: 500, // <500ms for credit check
  CACHE_HIT: 200, // <200ms for cache hit
  CONCURRENT_REQUESTS: 10, // Handle 10 concurrent requests
};

describe('Performance Tests', () => {
  const testUserId = 'perf-test-user-' + Date.now();
  const testSymbol = 'AAPL';

  beforeAll(async () => {
    // Clear caches
    await marketDataCache.invalidate(testSymbol);
    await reportCache.invalidateSymbol(testSymbol);
  });

  describe('Report Generation Performance', () => {
    it('should generate report within threshold (uncached)', async () => {
      const generator = new ReportGenerator();

      const startTime = Date.now();

      const report = await generator.generate({
        symbol: testSymbol,
        userId: testUserId,
        language: 'zh-Hans',
        tone: 'baseline',
      });

      const duration = Date.now() - startTime;

      expect(report).toBeDefined();
      expect(report.content).toBeTruthy();
      expect(duration).toBeLessThan(THRESHOLDS.REPORT_GENERATION_UNCACHED);

      console.log(`[Performance] Uncached report generation: ${duration}ms`);
    }, 40000); // 40s timeout

    it('should return cached report within threshold', async () => {
      const generator = new ReportGenerator();

      // First generation (cached)
      await generator.generate({
        symbol: testSymbol,
        userId: testUserId,
        language: 'zh-Hans',
        tone: 'baseline',
      });

      // Second generation (should hit cache)
      const startTime = Date.now();

      const report = await generator.generate({
        symbol: testSymbol,
        userId: testUserId,
        language: 'zh-Hans',
        tone: 'baseline',
      });

      const duration = Date.now() - startTime;

      expect(report).toBeDefined();
      expect(duration).toBeLessThan(THRESHOLDS.REPORT_GENERATION_CACHED);

      console.log(`[Performance] Cached report generation: ${duration}ms`);
    }, 10000);
  });

  describe('Cache Performance', () => {
    it('should retrieve from cache within threshold', async () => {
      const testData = { symbol: testSymbol, price: 150 };

      // Write to cache
      await marketDataCache.set(testSymbol, testData);

      // Read from cache
      const startTime = Date.now();
      const cached = await marketDataCache.get(testSymbol);
      const duration = Date.now() - startTime;

      expect(cached).toEqual(testData);
      expect(duration).toBeLessThan(THRESHOLDS.CACHE_HIT);

      console.log(`[Performance] Cache hit: ${duration}ms`);
    });

    it('should handle cache miss gracefully', async () => {
      const nonExistentSymbol = 'NONEXISTENT' + Date.now();

      const startTime = Date.now();
      const cached = await marketDataCache.get(nonExistentSymbol);
      const duration = Date.now() - startTime;

      expect(cached).toBeNull();
      expect(duration).toBeLessThan(THRESHOLDS.CACHE_HIT);

      console.log(`[Performance] Cache miss: ${duration}ms`);
    });
  });

  describe('Credit Operations Performance', () => {
    it('should check credits within threshold', async () => {
      const manager = new CreditManager();

      const startTime = Date.now();

      try {
        await manager.getBalance(testUserId);
      } catch (error) {
        // May fail if user doesn't exist, that's ok
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(THRESHOLDS.CREDIT_CHECK);

      console.log(`[Performance] Credit check: ${duration}ms`);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent cache reads', async () => {
      const testData = { symbol: testSymbol, price: 150 };
      await marketDataCache.set(testSymbol, testData);

      const startTime = Date.now();

      // Simulate 10 concurrent reads
      const promises = Array(THRESHOLDS.CONCURRENT_REQUESTS)
        .fill(null)
        .map(() => marketDataCache.get(testSymbol));

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // All should succeed
      expect(results.every((r) => r !== null)).toBe(true);

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000);

      console.log(
        `[Performance] ${THRESHOLDS.CONCURRENT_REQUESTS} concurrent cache reads: ${duration}ms`
      );
    });

    it('should handle concurrent credit checks', async () => {
      const manager = new CreditManager();

      const startTime = Date.now();

      // Simulate 10 concurrent credit checks
      const promises = Array(THRESHOLDS.CONCURRENT_REQUESTS)
        .fill(null)
        .map(() =>
          manager.getBalance(testUserId).catch(() => 0) // Ignore errors
        );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(2000);

      console.log(
        `[Performance] ${THRESHOLDS.CONCURRENT_REQUESTS} concurrent credit checks: ${duration}ms`
      );
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform 100 cache operations
      for (let i = 0; i < 100; i++) {
        await marketDataCache.set(`TEST${i}`, { price: i });
        await marketDataCache.get(`TEST${i}`);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (<50MB for 100 ops)
      const maxIncreaseMB = 50 * 1024 * 1024;
      expect(memoryIncrease).toBeLessThan(maxIncreaseMB);

      console.log(
        `[Performance] Memory increase after 100 cache ops: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      );
    });
  });

  describe('Stress Test', () => {
    it('should maintain performance under load', async () => {
      const iterations = 50;
      const durations: number[] = [];

      // Perform 50 cache operations
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await marketDataCache.set(`STRESS${i}`, { price: i * 100 });
        await marketDataCache.get(`STRESS${i}`);

        const duration = Date.now() - startTime;
        durations.push(duration);
      }

      // Calculate statistics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];

      console.log(`[Performance] Stress test results (${iterations} iterations):`);
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  P95: ${p95Duration}ms`);
      console.log(`  Max: ${maxDuration}ms`);

      // P95 should be within threshold
      expect(p95Duration).toBeLessThan(THRESHOLDS.CACHE_HIT * 2);
    }, 30000);
  });
});

describe('Scalability Tests', () => {
  it('should scale linearly with cache size', async () => {
    const sizes = [10, 50, 100];
    const results: { size: number; duration: number }[] = [];

    for (const size of sizes) {
      // Clear cache
      await reportCache.invalidateSymbol('SCALE');

      // Populate cache
      for (let i = 0; i < size; i++) {
        await marketDataCache.set(`SCALE${i}`, { price: i });
      }

      // Measure retrieval time
      const startTime = Date.now();
      await marketDataCache.get(`SCALE${Math.floor(size / 2)}`);
      const duration = Date.now() - startTime;

      results.push({ size, duration });
    }

    console.log('[Performance] Scalability test:');
    results.forEach((r) => {
      console.log(`  ${r.size} entries: ${r.duration}ms`);
    });

    // Should maintain similar performance regardless of cache size
    const maxDuration = Math.max(...results.map((r) => r.duration));
    expect(maxDuration).toBeLessThan(THRESHOLDS.CACHE_HIT * 2);
  }, 30000);
});
