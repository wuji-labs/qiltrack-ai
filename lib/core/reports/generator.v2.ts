import { DEFAULT_LANGUAGE, type Language } from "@/lib/i18n-config";
import { LLMService } from "@/lib/services/llm";
import { MarketDataService } from "@/lib/services/market-data";
import { ContentSanitizer } from "./content-sanitizer";
import { ReportGenerationError } from "../errors";
import type {
  GenerateReportParams,
  GeneratedReport,
  ReportTone,
  ReportMetadata,
} from "./types";
import { getLangfuseClient } from "@/lib/observability/langfuse";
import { reportCache, marketDataCache } from "@/lib/cache/redis";
import { inngest } from "@/lib/inngest/client";
import { trackReportGeneration, trackReportError } from "@/lib/monitoring/metrics";
import { buildSystemPrompt } from "./tone-prompts";

/**
 * Report Generator V2 - Uses Inngest for background tasks
 *
 * Key improvements:
 * - Type-safe with generated Database types
 * - Uses Inngest instead of BullMQ for embeddings
 * - Better error handling and monitoring
 * - Removes all 'any' types
 */
export class ReportGeneratorV2 {
  private llmService: LLMService;
  private marketDataService: MarketDataService;
  private sanitizer: ContentSanitizer;

  constructor(options?: {
    llmService?: LLMService;
    marketDataService?: MarketDataService;
    sanitizer?: ContentSanitizer;
  }) {
    this.llmService = options?.llmService || new LLMService();
    this.marketDataService =
      options?.marketDataService || new MarketDataService();
    this.sanitizer = options?.sanitizer || new ContentSanitizer();
  }

  /**
   * Generate a complete investment report
   *
   * @param params - Generation parameters
   * @returns Generated report with metadata
   * @throws {ReportGenerationError} When generation fails
   */
  async generate(params: GenerateReportParams): Promise<GeneratedReport> {
    const startTime = Date.now();

    try {
      // Normalize parameters
      const language = params.language || DEFAULT_LANGUAGE;
      const tone = params.tone || "baseline";

      const langfuse = getLangfuseClient();
      const trace = langfuse?.trace({
        name: "report.generate.v2",
        userId: params.userId,
        metadata: {
          symbol: params.symbol,
          language,
          tone,
          version: "v2",
        },
      });

      // 1. Check cache for existing report
      const cacheCheckSpan = trace?.span({
        name: "cache-check",
        input: { symbol: params.symbol, language, tone },
      });

      const cachedReport = await reportCache.get({
        symbol: params.symbol,
        language,
        tone,
      });

      if (cachedReport) {
        cacheCheckSpan?.end({ output: { cacheHit: true } });
        trace?.update({
          output: { success: true, cached: true },
          metadata: { generationTimeMs: Date.now() - startTime }
        });

        console.info(
          `[ReportGeneratorV2] Cache hit for ${params.symbol} (${language}/${tone})`
        );

        return cachedReport;
      }

      cacheCheckSpan?.end({ output: { cacheHit: false } });

      // 2. Check market data cache
      const marketDataSpan = trace?.span({
        name: "fetch-market-data",
        input: { symbol: params.symbol },
      });

      let marketData: any = await marketDataCache.get(params.symbol);

      if (!marketData) {
        // Fetch fresh market data
        marketData = await this.marketDataService.fetchCompanyData(
          params.symbol
        );

        // Cache market data for 1 hour
        await marketDataCache.set(params.symbol, marketData);
      }

      marketDataSpan?.end({ output: { hasData: true, cached: !!marketData } });

      // 3. Build prompts
      const { systemPrompt, userPrompt } = this.buildPrompts(
        marketData,
        language,
        tone
      );

      // 4. Generate report using LLM
      const llmSpan = trace?.span({
        name: "llm-generation",
        input: { promptLength: systemPrompt.length + userPrompt.length },
      });

      const rawContent = await this.llmService.generateReport(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.7,
          maxTokens: 4096,
          metadata: { symbol: params.symbol, language, tone },
        }
      );

      llmSpan?.end({
        output: { contentLength: rawContent.length },
      });

      // 5. Sanitize content
      const sanitizedContent = this.sanitizer.sanitize(rawContent, language);

      // 6. Build metadata
      const generationTimeMs = Date.now() - startTime;
      const reportRunId = params.metadata?.reportRunId || crypto.randomUUID();

      const metadata: ReportMetadata = {
        reportRunId,
        symbol: params.symbol,
        language,
        tone,
        generatedAt: new Date().toISOString(),
        userId: params.userId,
        generationTimeMs,
      };

      const generatedReport: GeneratedReport = {
        content: sanitizedContent,
        marketData,
        metadata,
      };

      // 7. Cache the generated report
      await reportCache.set(
        {
          symbol: params.symbol,
          language,
          tone,
        },
        generatedReport
      );

      // 8. Trigger Inngest embeddings generation (non-blocking)
      if (!params.metadata?.isTest) {
        await inngest.send({
          name: 'report/generated',
          data: {
            reportRunId,
            content: sanitizedContent,
            language,
            tone,
          },
        }).catch((err) => {
          // Inngest failure should not block report generation
          console.warn('[ReportGeneratorV2] Failed to trigger Inngest embeddings:', err);
        });
      }

      // 9. Track metrics
      trackReportGeneration({
        symbol: params.symbol,
        language,
        tone,
        duration: generationTimeMs,
        success: true,
        userId: params.userId ?? null,
        useNewSystem: true,
      });

      trace?.update({ output: { success: true, cached: false } });

      console.info(
        `[ReportGeneratorV2] Generated and cached report for ${params.symbol} (${language}/${tone}) in ${generationTimeMs}ms, embeddings job triggered`
      );

      return generatedReport;
    } catch (error) {
      const generationTimeMs = Date.now() - startTime;

      // Track error
      trackReportError({
        symbol: params.symbol,
        language: params.language || DEFAULT_LANGUAGE,
        tone: params.tone || 'baseline',
        duration: generationTimeMs,
        userId: params.userId ?? null,
        error: error instanceof Error ? error.message : String(error),
        useNewSystem: true,
      });

      throw new ReportGenerationError(
        `Failed to generate report for ${params.symbol}: ${error}`,
        {
          symbol: params.symbol,
          error: String(error),
          generationTimeMs,
        }
      );
    }
  }

  /**
   * Build system and user prompts for LLM
   *
   * Each tone has a completely independent system prompt with:
   * - Unique role definition (no identity conflicts)
   * - Specific analysis philosophy
   * - Custom chapter output formats
   * - Tailored evaluation frameworks
   *
   * @private
   */
  private buildPrompts(
    marketData: Record<string, unknown>,
    language: Language,
    tone: ReportTone
  ): { systemPrompt: string; userPrompt: string } {
    // Get the complete independent system prompt for this tone
    const systemPrompt = buildSystemPrompt(tone, language);

    const userPrompt = `
请基于下面这份结构化数据，为股票 ${(marketData as { symbol?: string }).symbol ?? 'UNKNOWN'} 写一份投研分析报告。
严格按照上述系统提示中的角色定位、章节结构和输出格式要求。

【结构化数据】
${JSON.stringify(marketData, null, 2)}
`;

    return { systemPrompt, userPrompt };
  }
}
