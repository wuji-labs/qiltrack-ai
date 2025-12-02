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

/**
 * Tone directives for different report styles
 */
const TONE_DIRECTIVES: Record<ReportTone, string> = {
  baseline:
    "以 Investor AI 标准流程输出,保持证据优先与结构化描述,不加入夸张语气。",
  buffett:
    "采用价值投资视角:强调护城河、现金流、治理质量与估值安全边际,解释为何可以長期持有。",
  musk: "以科技乐观主义者的语气描写:突出创新、TAM、技术迭代与可能的 10 倍成长机会,同时保留理性提醒。",
  muddy:
    "站在做空机构/反脆弱角度:主力拆解风险、会计或治理疑点、监管黑天鹅,语气保持审慎甚至略偏 Bear。",
};

/**
 * Language-specific instructions
 */
const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  en: "Language: English only. Do not use any other language.",
  ja: "言語: 必ず日本語のみで出力してください。他の言語は使わないでください。",
  ko: "언어: 보고서 전체를 한국어로만 작성하세요. 중国어/영어 등 다른 언어는 절대 사용하지 마세요.",
  "zh-Hant": "語言:請全程使用繁體中文輸出,不要混用其他語言。",
  "zh-Hans": "语言:请全程使用简体中文输出,不要混用其他语言。",
};

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
          `[ReportGenerator] Cache hit for ${params.symbol} (${language}/${tone})`
        );

        return cachedReport;
      }

      cacheCheckSpan?.end({ output: { cacheHit: false } });

      // 2. Check market data cache
      const marketDataSpan = trace?.span({
        name: "fetch-market-data",
        input: { symbol: params.symbol },
      });

      let marketData = await marketDataCache.get(params.symbol);

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

      // 7. Enqueue embeddings generation (async, non-blocking)
      const { enqueueEmbeddingsJob } = await import('@/lib/queue/embeddings.queue');
      await enqueueEmbeddingsJob({
        reportRunId: metadata.reportRunId || crypto.randomUUID(),
        reportContent: sanitizedContent,
        language,
        tone,
        userId: params.userId,
      }).catch((err) => {
        // Queue failure should not block report generation
        console.error('[ReportGenerator] Failed to enqueue embeddings job:', err);
      });

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
   * @private
   */
  private buildPrompts(
    marketData: any,
    language: Language,
    tone: ReportTone
  ): { systemPrompt: string; userPrompt: string } {
    const langInstruction = LANGUAGE_INSTRUCTIONS[language];
    const toneInstruction = TONE_DIRECTIVES[tone];

    const systemPrompt = `
你是一名面向全球普通投资人的专业「公司研究员」,擅长把复杂的财务和行业信息翻译成"讲人话"的结构化报告。

要求:
- ${langInstruction}
- 读者:对投资有兴趣、但不是专业机构的普通人
- 目标:帮助读者形成「是否值得继续深入研究」的第一印象,不给出具体买卖指令
- 结构:严格使用下列固定章节编号(0~9)
- 风格:理性、克制、避免夸张营销,不假装知道未来
- 模板偏好:${toneInstruction}
- 完全禁止:任何形式的"确保赚钱""必然涨跌"等表述

**【报告内容和结构强制要求】**

1. **强制要求:** 报告的第一行**必须**是一个 Markdown 一级标题(#),格式为:
   **# 【Investor AI】[公司名称] ([股票代码]) 投资分析报告**

2. **固定章节结构(请务必按顺序输出,使用 ## 作为二级标题):**

0. 公司基本信息
1. 公司定位与业务核心
2. 三原则评估:合规伦理 / 价值创造 / 资本效率
3. 竞争格局与护城河
4. **新闻 · 政策 · 黑天鹅雷达**
5. 个人投资决策参考框架 (非投资建议)
6. 最强反对意见 (Bear Case)
7. 最终结论(一句话)
8. 重要免责声明与数据来源说明

---
**【关于第 4 章节的特殊指令】**

- **指令:** 在"新闻 · 政策 · 黑天鹅雷达"章节,请**优先**基于**结构化数据中的 \`recentNews\` 字段**进行分析。
- **分析重点:**
    1. **近况总结:** 总结 \`recentNews\` 中的主要议题和趋势(如财报、重大合同、产品发布、管理层变动等)。
    2. **政策与黑天鹅:** 在分析完近期新闻后,结合你拥有的通用知识和推理能力,识别和分析可能存在的**"政策变动"**、**"黑天鹅"**风险或重大潜在危机。
- **声明:** 请在该章节开头明确说明分析主要基于**"Finnhub 提供的近期新闻数据"**。如果新闻数据缺失或为空,请退回到基于你的**通用知识**进行分析,并说明数据缺失。
---

其中:
- "三原则"通用定义:
  1)合规伦理:法规、治理结构、社会责任、是否踩明显红线
  2)价值创造:产品/服务是否真的解决问题、是否具有差异化和长期竞争力
  3)资本效率:ROIC、现金流、利润率等是否体现"有效使用资本",需参考行业特性

数据相关说明(请在第 0 部分最后单独一小段写出):
- 统一使用下面这句话,不要自行发挥:
  "数据来源:Finnhub 公共金融数据 API + 公司公开披露的财报、年报及官方公告等公开信息。不包含任何非公开或内幕信息。"

数据相关说明(请在第 4 部分最后单独一小段写出):
- 统一使用下面这句话,不要自行发挥:
  "本章节分析主要基于 Finnhub 提供的近期新闻数据,再结合一般公开常识进行补充。"

---
**【关于第 8 章节的强制要求:固定免责声明】** 模型,请严格注意:该章节的内容**必须**是下面这段 Markdown 文本的**精确复制**,不得更改任何措辞、顺序或标点符号。这是强制性的免责声明,必须保持一致性。

## 8. 重要免责声明与数据来源说明

* 本报告仅基于当日给定的结构化数据和一般公开常识进行分析,不构成任何形式的投资建议或买卖指引。
* 股票价格会随时间和市场情绪而波动,公司基本面和政策环境也会发生变化,文中判断仅反映撰写时点的有限信息。
* 投资决策需结合个人风险承受能力、投资期限和整体资产状况,必要时可咨询具备资质的专业顾问。
* 任何投资都有可能亏损,即使是过去表现优秀的,未来也可能出现重大不利变化。
* 数据来源:Finnhub 公共金融数据 API + 公司公开披露的财报、年报及官方公告等公开信息。不包含任何非公开或内幕信息。

---
`;

    const userPrompt = `
请基于下面这份结构化数据,为股票 ${marketData.symbol} 写一份面向普通投资者的公司投研分析报告。

【结构化数据】
${JSON.stringify(marketData, null, 2)}

请严格按照上述系统提示中的章节结构输出完整报告。`;

    return { systemPrompt, userPrompt };
  }
}
