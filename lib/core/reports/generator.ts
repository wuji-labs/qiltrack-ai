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
          maxTokens: 16384,
          metadata: { symbol: params.symbol, language, tone },
        }
      );

      llmSpan?.end({
        output: { contentLength: rawContent.length },
      });

      // 4. Append fixed disclaimer (removed from LLM generation to save time)
      const contentWithDisclaimer = this.appendDisclaimer(rawContent, language);

      // 5. Sanitize content
      const sanitizedContent = this.sanitizer.sanitize(contentWithDisclaimer, language);

      // 6. Build metadata
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

      // 7. Cache the generated report
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

      // Enhanced error logging for debugging
      console.error("[ReportGenerator] Generation failed:", {
        symbol: params.symbol,
        language: params.language || DEFAULT_LANGUAGE,
        tone: params.tone || "baseline",
        generationTimeMs,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
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

  /**
   * Append fixed disclaimer to report content
   * This is done in backend to save LLM generation time
   * @private
   */
  private appendDisclaimer(content: string, language: Language): string {
    const disclaimers: Record<Language, string> = {
      "zh-Hans": `

---

## 8. 重要免责声明与数据来源说明

* 本报告仅基于当日给定的结构化数据和一般公开常识进行分析，不构成任何形式的投资建议或买卖指引。
* 股票价格会随时间和市场情绪而波动，公司基本面和政策环境也会发生变化，文中判断仅反映撰写时点的有限信息。
* 投资决策需结合个人风险承受能力、投资期限和整体资产状况，必要时可咨询具备资质的专业顾问。
* 任何投资都有可能亏损，即使是过去表现优秀的，未来也可能出现重大不利变化。
* 数据来源：公共金融数据接口及公司公开披露的财报、年报及官方公告等公开信息。不包含任何非公开或内幕信息。`,

      "zh-Hant": `

---

## 8. 重要免責聲明與數據來源說明

* 本報告僅基於當日給定的結構化數據和一般公開常識進行分析，不構成任何形式的投資建議或買賣指引。
* 股票價格會隨時間和市場情緒而波動，公司基本面和政策環境也會發生變化，文中判斷僅反映撰寫時點的有限信息。
* 投資決策需結合個人風險承受能力、投資期限和整體資產狀況，必要時可諮詢具備資質的專業顧問。
* 任何投資都有可能虧損，即使是過去表現優秀的，未來也可能出現重大不利變化。
* 數據來源：公共金融數據接口及公司公開披露的財報、年報及官方公告等公開信息。不包含任何非公開或內幕信息。`,

      en: `

---

## 8. Important Disclaimer and Data Sources

* This report is based solely on structured data and general public knowledge available at the time of writing. It does not constitute investment advice or trading recommendations.
* Stock prices fluctuate with time and market sentiment. Company fundamentals and policy environments may change. The analysis reflects limited information available at the time of writing.
* Investment decisions should consider personal risk tolerance, investment horizon, and overall financial situation. Consult qualified professionals when necessary.
* All investments carry risk of loss. Past performance does not guarantee future results.
* Data Sources: Public financial data APIs and publicly disclosed company filings, annual reports, and official announcements. No non-public or insider information is included.`,

      ja: `

---

## 8. 重要な免責事項とデータソース

* 本レポートは、執筆時点で入手可能な構造化データと一般的な公開知識のみに基づいています。投資アドバイスや売買推奨を構成するものではありません。
* 株価は時間と市場心理により変動します。企業のファンダメンタルズと政策環境は変化する可能性があります。分析は執筆時点の限られた情報を反映しています。
* 投資判断は、個人のリスク許容度、投資期間、全体的な財務状況を考慮する必要があります。必要に応じて資格のある専門家にご相談ください。
* すべての投資には損失のリスクがあります。過去のパフォーマンスは将来の結果を保証するものではありません。
* データソース：公開金融データAPIおよび企業が公開した決算報告書、年次報告書、公式発表。非公開情報やインサイダー情報は含まれていません。`,

      ko: `

---

## 8. 중요 면책 조항 및 데이터 출처

* 본 보고서는 작성 시점에 이용 가능한 구조화된 데이터와 일반적인 공개 지식만을 기반으로 합니다. 투자 조언이나 매매 권고를 구성하지 않습니다.
* 주가는 시간과 시장 심리에 따라 변동합니다. 기업 펀더멘털과 정책 환경은 변할 수 있습니다. 분석은 작성 시점의 제한된 정보를 반영합니다.
* 투자 결정은 개인의 위험 허용 범위, 투자 기간 및 전반적인 재정 상황을 고려해야 합니다. 필요시 자격을 갖춘 전문가와 상담하십시오.
* 모든 투자는 손실 위험이 있습니다. 과거 성과가 미래 결과를 보장하지 않습니다.
* 데이터 출처: 공개 금융 데이터 API 및 기업이 공개한 재무 보고서, 연차 보고서, 공식 발표. 비공개 정보나 내부 정보는 포함되지 않습니다.`,
    };

    return content + (disclaimers[language] || disclaimers["zh-Hans"]);
  }
}
