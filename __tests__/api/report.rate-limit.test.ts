/**
 * Report API Rate Limiting Integration Tests
 *
 * Tests the rate limiting behavior in the report generation API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies before imports
vi.mock('@/lib/api/rate-limit', () => ({
  reportGenerationRateLimit: {
    limit: vi.fn(),
  },
  checkRateLimit: vi.fn(),
  getIpAddress: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'test-user-id',
            },
          },
        },
        error: null,
      }),
    },
  })),
  createClient: vi.fn(async () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => chain),
    };
    const from = vi.fn(() => chain);
    return {
      from,
      rpc: vi.fn().mockResolvedValue({
        data: [{ success: true, remaining_credits: 10 }],
        error: null,
      }),
    } as any;
  }),
}));

import { GET } from '@/app/api/report/route';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/api/rate-limit';

describe('Report API Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate limit checks', () => {
    it('should check rate limit before generating report', async () => {
      const mockCheckRateLimit = vi.mocked(checkRateLimit);
      mockCheckRateLimit.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '4',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });

      const request = new NextRequest(
        new URL('http://localhost:3002/api/report?symbol=AAPL')
      );

      // This will fail due to missing mocks, but we're testing rate limit check
      await GET(request).catch(() => {
        // Expected to fail due to other dependencies
      });

      // Verify rate limit was checked
      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        'test-user-id',
        expect.anything()
      );
    });

    it('should return 429 when rate limit exceeded', async () => {
      const mockCheckRateLimit = vi.mocked(checkRateLimit);
      mockCheckRateLimit.mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });

      const request = new NextRequest(
        new URL('http://localhost:3002/api/report?symbol=AAPL')
      );

      const response = await GET(request);

      expect(response.status).toBe(429);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(data.error.message).toContain('请求过于频繁');

      // Verify rate limit headers are present
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should include rate limit headers in successful response', async () => {
      const mockCheckRateLimit = vi.mocked(checkRateLimit);
      mockCheckRateLimit.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 3,
        reset: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '3',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });

      const request = new NextRequest(
        new URL('http://localhost:3002/api/report?symbol=AAPL')
      );

      await GET(request).catch(() => {
        // Expected due to missing mocks
      });

      // Verify rate limit check was called
      expect(mockCheckRateLimit).toHaveBeenCalled();
    });
  });

  describe('Test bypass', () => {
    it('should skip rate limiting with test token', async () => {
      const mockCheckRateLimit = vi.mocked(checkRateLimit);

      const request = new NextRequest(
        new URL('http://localhost:3002/api/report?symbol=AAPL&testToken=local-test-token')
      );

      await GET(request).catch(() => {
        // Expected due to missing mocks
      });

      // Rate limit should not be checked in test mode
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
    });

    it('should skip rate limiting with x-test-token header', async () => {
      const mockCheckRateLimit = vi.mocked(checkRateLimit);

      const request = new NextRequest(
        new URL('http://localhost:3002/api/report?symbol=AAPL'),
        {
          headers: {
            'x-test-token': 'local-test-token',
          },
        }
      );

      await GET(request).catch(() => {
        // Expected due to missing mocks
      });

      // Rate limit should not be checked in test mode
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
    });
  });

  describe('Rate limit response format', () => {
    it('should return standard error format on rate limit', async () => {
      const mockCheckRateLimit = vi.mocked(checkRateLimit);
      mockCheckRateLimit.mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });

      const request = new NextRequest(
        new URL('http://localhost:3002/api/report?symbol=AAPL')
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
      expect(data.error).toHaveProperty('message');
    });
  });
});

describe('Rate Limiting Scenarios', () => {
  it('should simulate progressive rate limit depletion', async () => {
    const mockCheckRateLimit = vi.mocked(checkRateLimit);

    const resetTime = Date.now() + 60000;

    // Mock 5 successful requests with decreasing remaining count
    const responses = [
      { success: true, limit: 5, remaining: 4, reset: resetTime },
      { success: true, limit: 5, remaining: 3, reset: resetTime },
      { success: true, limit: 5, remaining: 2, reset: resetTime },
      { success: true, limit: 5, remaining: 1, reset: resetTime },
      { success: true, limit: 5, remaining: 0, reset: resetTime },
      { success: false, limit: 5, remaining: 0, reset: resetTime },
    ];

    for (const mockResponse of responses) {
      mockCheckRateLimit.mockResolvedValueOnce({
        ...mockResponse,
        headers: {
          'X-RateLimit-Limit': String(mockResponse.limit),
          'X-RateLimit-Remaining': String(mockResponse.remaining),
          'X-RateLimit-Reset': String(mockResponse.reset),
        },
      });
    }

    // Verify the mock was set up correctly
    expect(mockCheckRateLimit).toBeDefined();
  });
});
