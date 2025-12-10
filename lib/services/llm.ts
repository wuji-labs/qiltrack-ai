/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExternalServiceError } from "../core/errors";
import { getLangfuseClient } from "../observability/langfuse";
import {
  generateCacheKey,
  cachedLLMRequest,
  calculateLLMCost,
  type LLMCacheEntry,
} from "../llm/cache";

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
 * LLM Service handles all AI model interactions
 *
 * Supports both Helicone and OpenRouter with automatic failover
 */
export class LLMService {
  private heliconeConfig?: LLMConfig;
  private openRouterConfig?: LLMConfig;

  constructor(options?: { helicone?: LLMConfig; openRouter?: LLMConfig }) {
    this.heliconeConfig = options?.helicone;
    this.openRouterConfig = options?.openRouter;

    // If not provided, read from environment
    if (!this.heliconeConfig && process.env.HELICONE_API_KEY) {
      this.heliconeConfig = {
        apiKey: process.env.HELICONE_API_KEY,
        model: process.env.HELICONE_MODEL || "gpt-5.1",
      };
    }

    if (!this.openRouterConfig && process.env.OPENROUTER_API_KEY) {
      this.openRouterConfig = {
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL || "openai/gpt-5.1",
        siteUrl: process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        appName: process.env.OPENROUTER_APP_NAME || "qiltrack",
      };
    }
  }

  /**
   * Generate report using LLM
   *
   * Tries Helicone first, then falls back to OpenRouter if Helicone fails
   * Automatically caches responses in Redis to reduce costs (60-80% savings)
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

    // Determine model to use (prefer Helicone if configured)
    const model = this.heliconeConfig?.model || this.openRouterConfig?.model || "gpt-5.1";

    // Generate deterministic cache key from request parameters
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const cacheKey = generateCacheKey({
      model,
      prompt: combinedPrompt,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      metadata: options?.metadata,
    });

    // Use cached LLM request wrapper
    const { response, cached, costUSD } = await cachedLLMRequest<string>({
      cacheKey,
      model,
      prompt: combinedPrompt,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      metadata: options?.metadata,
      requestFn: async () => {
        // This function only executes on cache miss
        const startTime = Date.now();
        let content: string;
        let usedProvider: "helicone" | "openrouter";

        // Try Helicone first (if configured)
        if (this.heliconeConfig) {
          try {
            const span = trace?.span({
              name: "llm.helicone",
              input: { systemPrompt, userPrompt, options },
            });

            content = await this.callHelicone(systemPrompt, userPrompt, options);
            usedProvider = "helicone";

            span?.end({ output: { length: content.length } });
          } catch (error) {
            console.warn("Helicone failed, falling back to OpenRouter:", error);
            trace?.event({
              name: "helicone-failed",
              metadata: { error: String(error) },
            });

            // Fallback to OpenRouter
            if (!this.openRouterConfig) {
              throw error;
            }

            const span = trace?.span({
              name: "llm.openrouter",
              input: { systemPrompt, userPrompt, options },
            });

            content = await this.callOpenRouter(systemPrompt, userPrompt, options);
            usedProvider = "openrouter";

            span?.end({ output: { length: content.length } });
          }
        } else if (this.openRouterConfig) {
          // Only OpenRouter configured
          const span = trace?.span({
            name: "llm.openrouter",
            input: { systemPrompt, userPrompt, options },
          });

          content = await this.callOpenRouter(systemPrompt, userPrompt, options);
          usedProvider = "openrouter";

          span?.end({ output: { length: content.length } });
        } else {
          throw new ExternalServiceError("No LLM provider configured");
        }

        // Estimate token counts for cost calculation
        // Rough approximation: 1 token ≈ 4 characters
        const promptTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
        const completionTokens = Math.ceil(content.length / 4);

        return {
          content,
          tokens: {
            prompt: promptTokens,
            completion: completionTokens,
            total: promptTokens + completionTokens,
          },
          finishReason: "stop",
        };
      },
    });

    // Log cache performance
    if (cached) {
      console.info(
        `[LLM_CACHE_HIT] Saved $${costUSD.toFixed(4)} by using cached response for key: ${cacheKey}`
      );
      trace?.event({
        name: "llm-cache-hit",
        metadata: { cacheKey, savedCostUSD: costUSD },
      });
    } else {
      console.info(
        `[LLM_CACHE_MISS] Fresh LLM request cost: $${costUSD.toFixed(4)}, key: ${cacheKey}`
      );
      trace?.event({
        name: "llm-cache-miss",
        metadata: { cacheKey, costUSD },
      });
    }

    return response;
  }

  /**
   * Call Helicone API (OpenAI compatible gateway)
   * @private
   */
  private async callHelicone(
    systemPrompt: string,
    userPrompt: string,
    options?: LLMGenerationOptions
  ): Promise<string> {
    if (!this.heliconeConfig) {
      throw new Error("Helicone not configured");
    }

    console.info("[LLM] Attempting Helicone call with model:", this.heliconeConfig.model);

    // Helicone AI Gateway mode:
    // Use HELICONE_API_KEY directly as Authorization header
    // baseURL: https://ai-gateway.helicone.ai
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.heliconeConfig.apiKey}`,
    };

    const res = await fetch("https://ai-gateway.helicone.ai/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.heliconeConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 16384,
        top_p: options?.topP ?? 1.0,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[LLM] Helicone request failed:", res.status, errText);
      throw new Error(`Helicone request failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[LLM] Invalid Helicone response:", JSON.stringify(data).slice(0, 200));
      throw new Error("Invalid response from Helicone");
    }

    console.info("[LLM] Helicone call successful, content length:", content.length);
    return content;
  }

  /**
   * Call OpenRouter API
   * @private
   */
  private async callOpenRouter(
    systemPrompt: string,
    userPrompt: string,
    options?: LLMGenerationOptions
  ): Promise<string> {
    if (!this.openRouterConfig) {
      throw new Error("OpenRouter not configured");
    }

    // Log the model being used for debugging
    console.info("[LLM] OpenRouter fallback with model:", this.openRouterConfig.model);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
        max_tokens: options?.maxTokens ?? 16384,
        top_p: options?.topP ?? 1.0,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[LLM] OpenRouter request failed:", res.status, errText);
      throw new Error(`OpenRouter request failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[LLM] Invalid OpenRouter response:", JSON.stringify(data).slice(0, 200));
      throw new Error("Invalid response from OpenRouter");
    }

    console.info("[LLM] OpenRouter call successful, content length:", content.length);
    return content;
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

    const model = process.env.OPENROUTER_EMBEDDING_MODEL || "text-embedding-3-small";

    const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
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
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Embedding request failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const embedding = data?.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 1536) {
      throw new Error("Invalid embedding response");
    }

    return embedding;
  }
}
