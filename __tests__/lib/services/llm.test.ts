/**
 * LLM Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMService } from '@/lib/services/llm';

vi.mock('@langfuse/node', () => ({
  Langfuse: vi.fn(() => ({
    trace: vi.fn(() => ({
      span: vi.fn(() => ({
        end: vi.fn(),
      })),
      update: vi.fn(),
    })),
  })),
}));

describe('LLMService', () => {
  let service: LLMService;

  beforeEach(() => {
    service = new LLMService();
    vi.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate report successfully', async () => {
      const systemPrompt = 'You are an analyst';
      const userPrompt = 'Analyze AAPL';

      const result = await service.generateReport(systemPrompt, userPrompt, {
        temperature: 0.7,
        maxTokens: 1000,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle LLM errors gracefully', async () => {
      const service = new LLMService();

      await expect(
        service.generateReport('', '', { maxTokens: -1 })
      ).rejects.toThrow();
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embedding vector', async () => {
      const text = 'Sample text for embedding';

      const embedding = await service.generateEmbedding(text);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    });

    it('should handle empty text', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow();
    });
  });
});
