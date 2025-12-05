/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { buildSystemPrompt } from "./tone-prompts";

/**
 * Report Generator orchestrates the entire report generation process
 *
 * Responsibilities:
 * - Fetch market data
 * - Generate report using LLM
 * - Sanitize content
 * - Track generation metrics
 */
export class ReportGenerator {
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
        name: "report.generate",
        userId: params.userId,
        metadata: {
          symbol: params.symbol,
          language,
          tone,
        },
      });

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

      // 2. Build prompts
      const { systemPrompt, userPrompt } = this.buildPrompts(
        marketData,
        language,
        tone
      );

      // 3. Generate report using LLM
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

      // 4. Sanitize content
      const sanitizedContent = this.sanitizer.sanitize(rawContent, language);

      // 5. Build metadata
      const generationTimeMs = Date.now() - startTime;

      const metadata: ReportMetadata = {
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

      // 6. Cache the generated report
      await reportCache.set(
        {
          symbol: params.symbol,
          language,
          tone,
        },
        generatedReport
      );

      trace?.update({ output: { success: true, cached: false } });

      console.info(
        `[ReportGenerator] Generated and cached report for ${params.symbol} (${language}/${tone}) in ${generationTimeMs}ms, embeddings job enqueued`
      );

      return generatedReport;
    } catch (error) {
      const generationTimeMs = Date.now() - startTime;

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
    marketData: any,
    language: Language,
    tone: ReportTone
  ): { systemPrompt: string; userPrompt: string } {
    // Get the complete independent system prompt for this tone
    const systemPrompt = buildSystemPrompt(tone, language);

    const userPrompt = `
请基于下面这份结构化数据，为股票 ${marketData.symbol} 写一份投研分析报告。
严格按照上述系统提示中的角色定位、章节结构和输出格式要求。

【结构化数据】
${JSON.stringify(marketData, null, 2)}
`;

    return { systemPrompt, userPrompt };
  }
}
