/**
 * Rate Limiting Tests
 *
 * Tests for the rate limiting middleware using Upstash Redis
 */

import { describe, it, expect, vi } from 'vitest';
import {
  checkRateLimit,
  getIpAddress,
  reportGenerationRateLimit,
  globalRateLimit,
} from '@/lib/api/rate-limit';
import type { Ratelimit } from '@upstash/ratelimit';

// Mock Upstash Redis
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    // Mock Redis methods if needed
  })),
}));

describe('Rate Limit Utilities', () => {
  describe('getIpAddress', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('192.168.1.2');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should return "unknown" if no IP headers present', () => {
      const request = new Request('http://localhost');

      const ip = getIpAddress(request);
      expect(ip).toBe('unknown');
    });
  });

  describe('checkRateLimit', () => {
    it('should return success when rate limiting is disabled', async () => {
      const result = await checkRateLimit('test-user', null);

      expect(result.success).toBe(true);
      expect(result.headers).toEqual({});
    });

    it('should handle rate limiter errors gracefully (fail open)', async () => {
      const mockRateLimit = {
        limit: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
      };

      const result = await checkRateLimit('test-user', mockRateLimit as unknown as Ratelimit);

      expect(result.success).toBe(true);
      expect(result.headers).toEqual({});
    });

    it('should return rate limit headers on success', async () => {
      const mockRateLimit = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
          reset: Date.now() + 60000,
        }),
      };

      const result = await checkRateLimit('test-user', mockRateLimit as unknown as Ratelimit);

      expect(result.success).toBe(true);
      expect(result.headers).toHaveProperty('X-RateLimit-Limit', '5');
      expect(result.headers).toHaveProperty('X-RateLimit-Remaining', '4');
      expect(result.headers).toHaveProperty('X-RateLimit-Reset');
    });

    it('should return failure when rate limit exceeded', async () => {
      const mockRateLimit = {
        limit: vi.fn().mockResolvedValue({
          success: false,
          limit: 5,
          remaining: 0,
          reset: Date.now() + 60000,
        }),
      };

      const result = await checkRateLimit('test-user', mockRateLimit as unknown as Ratelimit);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('Rate Limiters Configuration', () => {
    it('should have report generation rate limiter configured or null', () => {
      // Should be null when Redis is not configured in test environment
      expect(reportGenerationRateLimit).toBeNull();
    });

    it('should have global rate limiter configured or null', () => {
      // Should be null when Redis is not configured in test environment
      expect(globalRateLimit).toBeNull();
    });
  });
});

describe('Rate Limiting Integration Scenarios', () => {
  describe('Report Generation Rate Limiting', () => {
    it('should allow 5 requests per minute per user', async () => {
      const mockRateLimit = {
        limit: vi.fn()
          .mockResolvedValueOnce({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 })
          .mockResolvedValueOnce({ success: true, limit: 5, remaining: 3, reset: Date.now() + 60000 })
          .mockResolvedValueOnce({ success: true, limit: 5, remaining: 2, reset: Date.now() + 60000 })
          .mockResolvedValueOnce({ success: true, limit: 5, remaining: 1, reset: Date.now() + 60000 })
          .mockResolvedValueOnce({ success: true, limit: 5, remaining: 0, reset: Date.now() + 60000 })
          .mockResolvedValueOnce({ success: false, limit: 5, remaining: 0, reset: Date.now() + 60000 }),
      };

      const userId = 'test-user-123';

      // Requests 1-5 should succeed
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(userId, mockRateLimit as unknown as Ratelimit);
        expect(result.success).toBe(true);
      }

      // Request 6 should fail
      const result = await checkRateLimit(userId, mockRateLimit as unknown as Ratelimit);
      expect(result.success).toBe(false);
    });

    it('should track different users independently', async () => {
      const mockRateLimit = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
          reset: Date.now() + 60000,
        }),
      };

      const user1 = await checkRateLimit('user-1', mockRateLimit as unknown as Ratelimit);
      const user2 = await checkRateLimit('user-2', mockRateLimit as unknown as Ratelimit);

      expect(user1.success).toBe(true);
      expect(user2.success).toBe(true);
      expect(mockRateLimit.limit).toHaveBeenCalledWith('user-1');
      expect(mockRateLimit.limit).toHaveBeenCalledWith('user-2');
    });
  });

  describe('Global API Rate Limiting', () => {
    it('should allow 20 requests per second per IP', async () => {
      const mockRateLimit = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 20,
          remaining: 19,
          reset: Date.now() + 1000,
        }),
      };

      const ipAddress = '192.168.1.1';

      // Simulate 20 requests
      for (let i = 0; i < 20; i++) {
        const result = await checkRateLimit(ipAddress, mockRateLimit as unknown as Ratelimit);
        expect(result.success).toBe(true);
      }

      expect(mockRateLimit.limit).toHaveBeenCalledTimes(20);
    });
  });

  describe('Error Scenarios', () => {
    it('should fail open on Redis connection error', async () => {
      const mockRateLimit = {
        limit: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      };

      const result = await checkRateLimit('test-user', mockRateLimit as unknown as Ratelimit);

      expect(result.success).toBe(true);
      expect(result.headers).toEqual({});
    });

    it('should fail open on timeout', async () => {
      const mockRateLimit = {
        limit: vi.fn().mockRejectedValue(new Error('ETIMEDOUT')),
      };

      const result = await checkRateLimit('test-user', mockRateLimit as unknown as Ratelimit);

      expect(result.success).toBe(true);
    });
  });
});
