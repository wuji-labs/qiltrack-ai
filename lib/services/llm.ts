/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExternalServiceError } from "../core/errors";
import { getLangfuseClient } from "../observability/langfuse";

/**
 * LLM provider configuration
 */
export interface LLMConfig {
  apiKey: string;
  model: string;
  siteUrl?: string;
  appName?: string;
}

/**
 * LLM generation options
 */
export interface LLMGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  metadata?: Record<string, any>;
}

/**
 * Token usage information from LLM API response
 */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * LLM response with content and usage
 * @internal
 */
interface LLMResponse {
  content: string;
  usage?: TokenUsage;
}

/**
 * LLM Service handles all AI model interactions
 *
 * Supports both Helicone and OpenRouter with automatic failover
 */
export class LLMService {
  private heliconeConfig?: LLMConfig;
  private openRouterConfig?: LLMConfig;

  constructor(options?: {
    helicone?: LLMConfig;
    openRouter?: LLMConfig;
  }) {
    this.heliconeConfig = options?.helicone;
    this.openRouterConfig = options?.openRouter;

    // If not provided, read from environment
    if (!this.heliconeConfig && process.env.HELICONE_API_KEY) {
      this.heliconeConfig = {
        apiKey: process.env.HELICONE_API_KEY,
        model: process.env.HELICONE_MODEL || "gpt-4o-mini",
      };
    }

    if (!this.openRouterConfig && process.env.OPENROUTER_API_KEY) {
      this.openRouterConfig = {
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL || "openai/gpt-5.1",
        siteUrl:
          process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        appName: process.env.OPENROUTER_APP_NAME || "investor-ai",
      };
    }
  }

  /**
   * Generate report using LLM
   *
   * Tries Helicone first, then falls back to OpenRouter if Helicone fails
   *
   * @param systemPrompt - System prompt for the LLM
   * @param userPrompt - User prompt with data
   * @param options - Generation options
   * @returns Generated report text
   */
  async generateReport(
    systemPrompt: string,
    userPrompt: string,
    options?: LLMGenerationOptions
  ): Promise<string> {
    const langfuse = getLangfuseClient();
    const trace = langfuse?.trace({
      name: "llm.generate-report",
      metadata: options?.metadata || {},
    });

    // Try Helicone first (if configured)
    if (this.heliconeConfig) {
      try {
        const span = trace?.span({
          name: "llm.helicone",
          input: {
            systemPromptLength: systemPrompt.length,
            userPromptLength: userPrompt.length,
            model: this.heliconeConfig.model,
          },
        });

        const response = await this.callHelicone(
          systemPrompt,
          userPrompt,
          options
        );

        // Record token usage and cost
        if (response.usage) {
          const cost = this.calculateCost(
            response.usage,
            this.heliconeConfig.model
          );
          span?.update({
            metadata: {
              ...response.usage,
              estimated_cost_usd: cost,
              model: this.heliconeConfig.model,
            },
          });
        }

        span?.end({ output: { contentLength: response.content.length } });
        return response.content;
      } catch (error) {
        console.warn("Helicone failed, falling back to OpenRouter:", error);
        trace?.event({
          name: "helicone-failed",
          metadata: { error: String(error) },
        });
      }
    }

    // Fallback to OpenRouter
    if (this.openRouterConfig) {
      try {
        const span = trace?.span({
          name: "llm.openrouter",
          input: {
            systemPromptLength: systemPrompt.length,
            userPromptLength: userPrompt.length,
            model: this.openRouterConfig.model,
          },
        });

        const response = await this.callOpenRouter(
          systemPrompt,
          userPrompt,
          options
        );

        // Record token usage and cost
        if (response.usage) {
          const cost = this.calculateCost(
            response.usage,
            this.openRouterConfig.model
          );
          span?.update({
            metadata: {
              ...response.usage,
              estimated_cost_usd: cost,
              model: this.openRouterConfig.model,
            },
          });
        }

        span?.end({ output: { contentLength: response.content.length } });
        return response.content;
      } catch (error) {
        trace?.event({
          name: "openrouter-failed",
          metadata: { error: String(error) },
        });
        throw new ExternalServiceError("All LLM providers failed", {
          error: String(error),
        });
      }
    }

    throw new ExternalServiceError("No LLM provider configured");
  }

  /**
   * Calculate estimated cost for LLM API call
   *
   * Pricing as of 2025-12 (subject to change)
   *
   * @param usage - Token usage information
   * @param model - Model identifier
   * @returns Estimated cost in USD
   * @private
   */
  private calculateCost(usage: TokenUsage, model: string): number {
    // Pricing per 1M tokens (as of 2025-12)
    const pricing: Record<
      string,
      { prompt: number; completion: number }
    > = {
      "gpt-4o-mini": {
        prompt: 0.15, // $0.15 / 1M tokens
        completion: 0.6, // $0.60 / 1M tokens
      },
      "gpt-4o": {
        prompt: 2.5, // $2.50 / 1M tokens
        completion: 10.0, // $10.00 / 1M tokens
      },
      "gpt-4-turbo": {
        prompt: 10.0,
        completion: 30.0,
      },
      "claude-3.5-sonnet": {
        prompt: 3.0,
        completion: 15.0,
      },
      "claude-3-opus": {
        prompt: 15.0,
        completion: 75.0,
      },
      // OpenRouter models
      "openai/gpt-4o-mini": {
        prompt: 0.15,
        completion: 0.6,
      },
      "openai/gpt-4o": {
        prompt: 2.5,
        completion: 10.0,
      },
      "openai/gpt-5.1": {
        prompt: 2.5, // Estimated, adjust when official pricing available
        completion: 10.0,
      },
      "anthropic/claude-3.5-sonnet": {
        prompt: 3.0,
        completion: 15.0,
      },
      "anthropic/claude-3-opus": {
        prompt: 15.0,
        completion: 75.0,
      },
    };

    // Default to gpt-4o-mini pricing if model not found
    const modelPricing = pricing[model] || pricing["gpt-4o-mini"];

    // Calculate cost (pricing is per 1M tokens, so divide by 1,000,000)
    const promptCost = (usage.prompt_tokens * modelPricing.prompt) / 1_000_000;
    const completionCost =
      (usage.completion_tokens * modelPricing.completion) / 1_000_000;

    return promptCost + completionCost;
  }

  /**
   * Call Helicone API
   * @private
   */
  private async callHelicone(
    systemPrompt: string,
    userPrompt: string,
    options?: LLMGenerationOptions
  ): Promise<LLMResponse> {
    if (!this.heliconeConfig) {
      throw new Error("Helicone not configured");
    }

    const res = await fetch(
      "https://gateway.helicone.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Helicone-Auth": `Bearer ${this.heliconeConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: this.heliconeConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096,
          top_p: options?.topP ?? 1.0,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `Helicone request failed: ${res.status} ${errText}`
      );
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Invalid response from Helicone");
    }

    return {
      content,
      usage: data.usage as TokenUsage | undefined,
    };
  }

  /**
   * Call OpenRouter API
   * @private
   */
  private async callOpenRouter(
    systemPrompt: string,
    userPrompt: string,
    options?: LLMGenerationOptions
  ): Promise<LLMResponse> {
    if (!this.openRouterConfig) {
      throw new Error("OpenRouter not configured");
    }

    const res = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openRouterConfig.apiKey}`,
          "HTTP-Referer": this.openRouterConfig.siteUrl || "",
          "X-Title": this.openRouterConfig.appName || "",
        },
        body: JSON.stringify({
          model: this.openRouterConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096,
          top_p: options?.topP ?? 1.0,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `OpenRouter request failed: ${res.status} ${errText}`
      );
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Invalid response from OpenRouter");
    }

    return {
      content,
      usage: data.usage as TokenUsage | undefined,
    };
  }

  /**
   * Generate embeddings for text
   *
   * @param input - Text to embed
   * @returns Embedding vector
   */
  async generateEmbedding(input: string): Promise<number[]> {
    if (!this.openRouterConfig) {
      throw new Error("OpenRouter not configured for embeddings");
    }

    const model =
      process.env.OPENROUTER_EMBEDDING_MODEL ||
      "text-embedding-3-small";

    const res = await fetch(
      "https://openrouter.ai/api/v1/embeddings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openRouterConfig.apiKey}`,
          "HTTP-Referer": this.openRouterConfig.siteUrl || "",
          "X-Title": this.openRouterConfig.appName || "",
        },
        body: JSON.stringify({
          model,
          input,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `Embedding request failed: ${res.status} ${errText}`
      );
    }

    const data = await res.json();
    const embedding = data?.data?.[0]?.embedding;

    if (
      !embedding ||
      !Array.isArray(embedding) ||
      embedding.length !== 1536
    ) {
      throw new Error("Invalid embedding response");
    }

    return embedding;
  }
}
