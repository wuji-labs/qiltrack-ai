/**
 * Market Data Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketDataService } from '@/lib/services/market-data';

global.fetch = vi.fn();

describe('MarketDataService', () => {
  let service: MarketDataService;

  beforeEach(() => {
    service = new MarketDataService();
    vi.clearAllMocks();
  });

  describe('fetchCompanyData', () => {
    it('should fetch complete company data', async () => {
      const mockResponses = {
        profile: { name: 'Apple Inc.', ticker: 'AAPL' },
        quote: { c: 150.0, h: 152.0, l: 148.0 },
        metrics: { peRatio: 25.5 },
        news: [{ headline: 'Apple announces new product' }],
      };

      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('profile')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponses.profile),
          });
        }
        if (url.includes('quote')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponses.quote),
          });
        }
        if (url.includes('metric')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponses.metrics),
          });
        }
        if (url.includes('news')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockResponses.news[0]]),
          });
        }
      });

      const data = await service.fetchCompanyData('AAPL');

      expect(data.profile).toBeDefined();
      expect(data.quote).toBeDefined();
      expect(data.metrics).toBeDefined();
      expect(data.news).toBeDefined();
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.fetchCompanyData('INVALID')).rejects.toThrow();
    });
  });
});
