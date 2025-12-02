/**
 * Tests for LLM Token Tracking and Cost Calculation
 *
 * @group unit
 * @group services
 */

import { LLMService, TokenUsage } from "@/lib/services/llm";

describe("LLM Token Tracking", () => {
  describe("calculateCost", () => {
    it("should calculate cost for gpt-4o-mini", () => {
      const service = new LLMService();
      const usage: TokenUsage = {
        prompt_tokens: 1000,
        completion_tokens: 500,
        total_tokens: 1500,
      };

      // Access private method via type assertion for testing
      const cost = (service as any).calculateCost(usage, "gpt-4o-mini");

      // Expected:
      // Prompt: 1000 * 0.15 / 1M = 0.00015
      // Completion: 500 * 0.6 / 1M = 0.0003
      // Total: 0.00045
      expect(cost).toBeCloseTo(0.00045, 6);
    });

    it("should calculate cost for gpt-4o", () => {
      const service = new LLMService();
      const usage: TokenUsage = {
        prompt_tokens: 2000,
        completion_tokens: 1000,
        total_tokens: 3000,
      };

      const cost = (service as any).calculateCost(usage, "gpt-4o");

      // Expected:
      // Prompt: 2000 * 2.5 / 1M = 0.005
      // Completion: 1000 * 10.0 / 1M = 0.01
      // Total: 0.015
      expect(cost).toBeCloseTo(0.015, 6);
    });

    it("should calculate cost for Claude 3.5 Sonnet", () => {
      const service = new LLMService();
      const usage: TokenUsage = {
        prompt_tokens: 1500,
        completion_tokens: 800,
        total_tokens: 2300,
      };

      const cost = (service as any).calculateCost(
        usage,
        "anthropic/claude-3.5-sonnet"
      );

      // Expected:
      // Prompt: 1500 * 3.0 / 1M = 0.0045
      // Completion: 800 * 15.0 / 1M = 0.012
      // Total: 0.0165
      expect(cost).toBeCloseTo(0.0165, 6);
    });

    it("should use default pricing for unknown model", () => {
      const service = new LLMService();
      const usage: TokenUsage = {
        prompt_tokens: 1000,
        completion_tokens: 500,
        total_tokens: 1500,
      };

      const cost = (service as any).calculateCost(usage, "unknown-model");

      // Should default to gpt-4o-mini pricing
      expect(cost).toBeCloseTo(0.00045, 6);
    });

    it("should handle zero tokens", () => {
      const service = new LLMService();
      const usage: TokenUsage = {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      const cost = (service as any).calculateCost(usage, "gpt-4o-mini");

      expect(cost).toBe(0);
    });

    it("should handle large token counts", () => {
      const service = new LLMService();
      const usage: TokenUsage = {
        prompt_tokens: 100_000,
        completion_tokens: 50_000,
        total_tokens: 150_000,
      };

      const cost = (service as any).calculateCost(usage, "gpt-4o");

      // Expected:
      // Prompt: 100,000 * 2.5 / 1M = 0.25
      // Completion: 50,000 * 10.0 / 1M = 0.5
      // Total: 0.75
      expect(cost).toBeCloseTo(0.75, 6);
    });
  });

  describe("Token Usage Types", () => {
    it("should have correct TokenUsage structure", () => {
      const usage: TokenUsage = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      };

      expect(usage.prompt_tokens).toBe(100);
      expect(usage.completion_tokens).toBe(50);
      expect(usage.total_tokens).toBe(150);
    });
  });

  describe("LLMService Configuration", () => {
    it("should create service with Helicone config", () => {
      const service = new LLMService({
        helicone: {
          apiKey: "test-key",
          model: "gpt-4o-mini",
        },
      });

      expect(service).toBeInstanceOf(LLMService);
    });

    it("should create service with OpenRouter config", () => {
      const service = new LLMService({
        openRouter: {
          apiKey: "test-key",
          model: "openai/gpt-4o",
          siteUrl: "https://example.com",
          appName: "test-app",
        },
      });

      expect(service).toBeInstanceOf(LLMService);
    });

    it("should read config from environment variables", () => {
      // Set environment variables
      process.env.HELICONE_API_KEY = "env-helicone-key";
      process.env.HELICONE_MODEL = "gpt-4o";

      const service = new LLMService();

      expect(service).toBeInstanceOf(LLMService);

      // Clean up
      delete process.env.HELICONE_API_KEY;
      delete process.env.HELICONE_MODEL;
    });
  });

  describe("Cost Estimation Edge Cases", () => {
    it("should handle OpenRouter model naming convention", () => {
      const service = new LLMService();
      const usage: TokenUsage = {
        prompt_tokens: 1000,
        completion_tokens: 500,
        total_tokens: 1500,
      };

      const heliconeModel = (service as any).calculateCost(usage, "gpt-4o");
      const openrouterModel = (service as any).calculateCost(
        usage,
        "openai/gpt-4o"
      );

      // Should use the same pricing
      expect(heliconeModel).toBe(openrouterModel);
    });

    it("should calculate realistic report generation cost", () => {
      const service = new LLMService();
      // Typical report: ~3000 prompt tokens, ~2000 completion tokens
      const usage: TokenUsage = {
        prompt_tokens: 3000,
        completion_tokens: 2000,
        total_tokens: 5000,
      };

      const cost = (service as any).calculateCost(usage, "gpt-4o-mini");

      // Expected:
      // Prompt: 3000 * 0.15 / 1M = 0.00045
      // Completion: 2000 * 0.6 / 1M = 0.0012
      // Total: 0.00165 (~$0.0017)
      expect(cost).toBeCloseTo(0.00165, 6);
      expect(cost).toBeLessThan(0.002); // Less than 0.2 cents per report
    });

    it("should estimate monthly cost for 10k reports", () => {
      const service = new LLMService();
      const usage: TokenUsage = {
        prompt_tokens: 3000,
        completion_tokens: 2000,
        total_tokens: 5000,
      };

      const costPerReport = (service as any).calculateCost(usage, "gpt-4o-mini");
      const monthlyCost = costPerReport * 10_000;

      // ~$16.5 per month for 10,000 reports with gpt-4o-mini
      expect(monthlyCost).toBeCloseTo(16.5, 1);
      expect(monthlyCost).toBeLessThan(20); // Budget check
    });
  });
});
