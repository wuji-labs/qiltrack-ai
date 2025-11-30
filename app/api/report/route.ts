export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceRoleClient, uploadToStorage } from "@/lib/supabase/server";
import { consumeReportCredit, writeReportAudit } from "@/lib/services/quota";
import { DEFAULT_LANGUAGE, type Language } from "@/lib/i18n-config";
import { getLangfuseClient } from "@/lib/observability/langfuse";

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const OPENROUTER_EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL || "text-embedding-3-small";
const EMBEDDING_DIMENSION = 1536;

// Note: These are read at runtime to allow test env override
const getEnvVars = () => ({
  FINNHUB_API_KEY: process.env.FINNHUB_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openai/gpt-5.1",
  HELICONE_API_KEY: process.env.HELICONE_API_KEY,
  HELICONE_MODEL: process.env.HELICONE_MODEL || "gpt-4o-mini",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

const toneDirectives = {
    baseline: "以 Investor AI 标准流程输出，保持证据优先与结构化描述，不加入夸张语气。",
    buffett: "采用价值投资视角：强调护城河、现金流、治理质量与估值安全边际，解释为何可以長期持有。",
    musk: "以科技乐观主义者的语气描写：突出创新、TAM、技术迭代与可能的 10 倍成长机会，同时保留理性提醒。",
    muddy: "站在做空机构/反脆弱角度：主力拆解风险、会计或治理疑点、监管黑天鹅，语气保持审慎甚至略偏 Bear。",
} as const;

const LANGUAGE_CONFIG: Record<Language, {
    languageInstruction: string;
    disclaimer: string;
}> = {
    en: {
        languageInstruction: "Language: English only. Do not use any other language.",
        disclaimer: `This report is auto-generated from public data and common analytical frameworks. The content is for general information only and never constitutes investment advice, trading guidance, or personalized judgment. Market conditions may change and information may lag. Consult licensed professionals before making investment decisions.`,
    },
    ja: {
        languageInstruction: "言語: 必ず日本語のみで出力してください。他の言語は使わないでください。",
        disclaimer: `本レポートは公開データと一般的な分析手法をもとに自動生成された一般参考情報であり、投資助言や売買指示ではありません。市場環境は変化し得るため、情報には遅延や偏りが含まれる可能性があります。投資判断が必要な場合は、必ず有資格の専門家に相談してください。`,
    },
    ko: {
        languageInstruction: "언어: 보고서 전체를 한국어로만 작성하세요. 중국어/영어 등 다른 언어는 절대 사용하지 마세요.",
        disclaimer: `이 리포트는 공개 데이터와 일반적인 분석 방법을 기반으로 자동 생성된 일반 참고 정보이며, 투자 자문이나 매매 지침이 아닙니다. 시장 상황은 언제든 변할 수 있고 정보에는 지연이나 편차가 있을 수 있습니다. 투자 결정을 내리기 전에 반드시 자격을 갖춘 전문가와 상담하세요.`,
    },
    "zh-Hant": {
        languageInstruction: "語言：請全程使用繁體中文輸出，不要混用其他語言。",
        disclaimer: `本報告內容由系統基於公開數據與通用分析方法自動生成，僅供一般資訊參考，不構成任何投資建議、買賣意見或個人化判斷。市場情勢可能變動，資訊亦可能存在延遲或偏差。如需投資建議，請諮詢具備合法資質的專業機構。`,
    },
    "zh-Hans": {
        languageInstruction: "语言：请全程使用简体中文输出，不要混用其他语言。",
        disclaimer: `本报告内容由系统基于公开数据和通用分析方法自动生成，仅供一般信息参考，不构成任何投资建议、买卖意见或个性化判断。市场状况可能变化，信息可能存在延迟或偏差。如需投资建议，请咨询取得合法资质的专业机构。`,
    },
};

const WORD_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /买入/gi, replacement: "分析视角" },
    { pattern: /卖出/gi, replacement: "分析视角" },
    { pattern: /建仓/gi, replacement: "分析视角" },
    { pattern: /加仓/gi, replacement: "分析视角" },
    { pattern: /减仓/gi, replacement: "分析视角" },
    { pattern: /清仓/gi, replacement: "分析视角" },
    { pattern: /仓位/gi, replacement: "风险敞口" },
    { pattern: /建议/gi, replacement: "一般参考" },
    { pattern: /目标价/gi, replacement: "市场预期讨论" },
    { pattern: /预测/gi, replacement: "假设情景" },
    { pattern: /必买/gi, replacement: "主流观点讨论" },
    { pattern: /调仓/gi, replacement: "风险敞口调整讨论" },
];


function normalizeLanguage(value: string | null): Language {
    const key = (value || "").trim().toLowerCase();
    if (key === "ja" || key === "ja-jp") return "ja";
    if (key === "ko" || key === "ko-kr") return "ko";
    if (key === "zh-hant" || key === "zh-hk" || key === "zh-tw") return "zh-Hant";
    if (key === "zh-hans" || key === "zh-cn" || key === "zh") return "zh-Hans";
    return DEFAULT_LANGUAGE;
}

function sanitizeReportContent(content: string, language: Language) {
    const langConfig = LANGUAGE_CONFIG[language] ?? LANGUAGE_CONFIG.en;
    const paragraphs = content.split(/\n{2,}/);
    let sanitized = paragraphs.join("\n\n");
    for (const { pattern, replacement } of WORD_REPLACEMENTS) {
        sanitized = sanitized.replace(pattern, replacement);
    }

  return `${langConfig.disclaimer}\n\n${sanitized}`.trim();
}

function chunkReport(markdown: string, maxChars = 3500, overlap = 400) {
  const paragraphs = markdown.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        const tail = current.slice(-overlap);
        current = tail + "\n\n" + para;
      } else {
        chunks.push(para);
        current = "";
      }
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

async function embedText(input: string, apiKey: string) {
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "investor-ai",
    },
    body: JSON.stringify({
      model: OPENROUTER_EMBEDDING_MODEL,
      input,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding request failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error("Invalid embedding response");
  }
  return embedding;
}

async function writeEmbeddingsBackground({
  reportRunId,
  report,
  language,
  tone,
  apiKey,
}: {
  reportRunId: string | null;
  report: string;
  language: Language;
  tone: string;
  apiKey: string;
}) {
  if (!reportRunId || !apiKey) return;
  try {
    const serviceClient = createServiceRoleClient();
    const chunks = chunkReport(report);

    const rows = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      try {
        const embedding = await embedText(chunk, apiKey);
        rows.push({
          report_run_id: reportRunId,
          chunk_index: i,
          embedding,
          lang: language,
          tone,
        });
      } catch (err) {
        console.warn(`Embedding chunk ${i} failed:`, err);
      }
    }

    if (rows.length === 0) return;

    await serviceClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("reports_embeddings" as any)
      .upsert(rows, { onConflict: "report_run_id,chunk_index" });
  } catch (err) {
    console.warn("Embedding background write failed:", err);
  }
}

async function fetchJson(url: string) {
    const res = await fetch(url);
    if (!res.ok) {
        // 尝试获取错误详情
        const errorText = await res.text();
        throw new Error(`Request failed: ${res.status} ${res.statusText} - Details: ${errorText}`);
    }
    return res.json();
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param date Date 对象
 */
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
    // Read env vars at runtime to allow test override
    const env = getEnvVars();
    const langfuse = getLangfuseClient();
    const trace = langfuse?.trace({
      name: "api.report.generate",
      metadata: { isTest: false },
    });

    // Check for test bypass
    const testToken = process.env.TEST_REPORT_TOKEN || "local-test-token";
    const tokenFromHeader = request.headers.get("x-test-token");
    const tokenFromQuery = new URL(request.url).searchParams.get("testToken");
    const isTestBypass = Boolean(testToken && (tokenFromHeader === testToken || tokenFromQuery === testToken));
    if (trace && isTestBypass) {
      trace.update({ metadata: { isTest: true } });
    }

    // Collect response cookies from Supabase
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];

    // Get Supabase server client with cookie handling
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });

    let userId: string | null = null;

    if (!isTestBypass) {
      // Get session from Supabase auth
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user?.id) {
        console.warn(`[UNAUTHORIZED_SESSION] error: ${sessionError?.message || 'no session'}`);
        const response = NextResponse.json(
          { error: "Unauthorized", code: "unauthorized" },
          { status: 401 }
        );
        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });
        return response;
      }

      userId = session.user.id;

      // Check quota before attempting to generate
      const { data: quotaData, error: quotaError } = await supabase
        .from("report_credits")
        .select("credits_available")
        .eq("user_id", userId as never)
        .single();

      if (quotaError) {
        console.warn(`[QUOTA_FETCH_FAILED] user_id: ${userId}, error: ${quotaError.message}`);
        const response = NextResponse.json(
          { error: "Failed to fetch quota", code: "quota_fetch_failed" },
          { status: 500 }
        );
        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });
        return response;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!quotaData || (quotaData as any).credits_available <= 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.info(`[QUOTA_EXHAUSTED] user_id: ${userId}, remaining: ${(quotaData as any)?.credits_available ?? 0}`);
        const response = NextResponse.json(
          { error: "Quota exceeded", code: "quota_exceeded" },
          { status: 429 }
        );
        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });
        return response;
      }
    } else {
      // Generate a test user ID (valid UUID format for test mode)
      // Using a deterministic UUID for test mode so audit logs can be traced
      userId = "00000000-0000-0000-0000-000000000001";
    }

    const { searchParams } = new URL(request.url);
    const symbol = (searchParams.get("symbol") || "").toUpperCase().trim();
    const toneKeyRaw = (searchParams.get("tone") || "baseline").toLowerCase();
    const langParam = searchParams.get("lang");
    const language = normalizeLanguage(langParam);
    const langConfig = LANGUAGE_CONFIG[language];
    const toneInstruction =
        toneDirectives[toneKeyRaw as keyof typeof toneDirectives] || toneDirectives.baseline;

    if (!symbol) {
        const response = NextResponse.json(
            { error: "Missing symbol param" },
            { status: 400 }
        );
        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });
        return response;
    }

    const missingLlmProvider = !env.OPENROUTER_API_KEY && !env.HELICONE_API_KEY;
    if (!env.FINNHUB_API_KEY || missingLlmProvider) {
        const response = NextResponse.json(
            {
                error: missingLlmProvider
                    ? "No LLM provider configured"
                    : "Server API key not configured",
            },
            { status: 500 }
        );
        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });
        return response;
    }

    try {
        // --- 新增新闻日期范围计算 ---
        const today = new Date();
        // Finnhub 免费层级通常只支持近期数据，这里我们尝试获取最近 60 天的新闻
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(today.getDate() - 60);

        const fromDate = formatDate(sixtyDaysAgo);
        const toDate = formatDate(today);
        // -----------------------------

        // 1. 拉基础数据（使用 Finnhub 免费或基础数据接口）
        const profileUrl = `${FINNHUB_BASE}/stock/profile2?symbol=${encodeURIComponent(
            symbol
        )}&token=${env.FINNHUB_API_KEY}`;

        const quoteUrl = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(
            symbol
        )}&token=${env.FINNHUB_API_KEY}`;

        const metricsUrl = `${FINNHUB_BASE}/stock/metric?symbol=${encodeURIComponent(
            symbol
        )}&metric=all&token=${env.FINNHUB_API_KEY}`;

        // 新增：Finnhub /company-news 接口 (免费层级通常支持近期)
        const newsUrl = `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(
            symbol
        )}&from=${fromDate}&to=${toDate}&token=${env.FINNHUB_API_KEY}`;


        const finnhubSpan = trace?.span({
          name: "finnhub.fetch",
          input: { symbol, profileUrl, quoteUrl, metricsUrl, newsUrl },
        });

        const [profile, quote, metricsRaw, recentNews] = await Promise.all([
            fetchJson(profileUrl),
            fetchJson(quoteUrl),
            fetchJson(metricsUrl),
            fetchJson(newsUrl), // <-- 新增新闻拉取
        ]);

        finnhubSpan?.end({
          output: {
            profileOk: Boolean(profile?.ticker),
            metricsKeys: Object.keys(metricsRaw?.metric ?? {}).length,
            newsCount: Array.isArray(recentNews) ? recentNews.length : 0,
          },
        });
const metric = (metricsRaw && metricsRaw.metric) || {};

        const companyData = {
            symbol,
            profile: {
                name: profile.name,
                ticker: profile.ticker,
                exchange: profile.exchange,
                finnhubIndustry: profile.finnhubIndustry,
                country: profile.country,
                currency: profile.currency,
                ipo: profile.ipo,
                marketCapitalization: profile.marketCapitalization,
                weburl: profile.weburl,
            },
            quote: {
                current: quote.c,
                change: quote.d,
                changePercent: quote.dp,
                high: quote.h,
                low: quote.l,
                open: quote.o,
                prevClose: quote.pc,
                timestamp: quote.t,
            },
            metrics: {
                peTTM: metric.peTTM,
                psTTM: metric.psTTM,
                pbAnnual: metric.pbAnnual,
                revenueGrowth3Y: metric.revenueGrowth3Y,
                revenueGrowth5Y: metric.revenueGrowth5Y,
                epsGrowth3Y: metric.epsGrowth3Y,
                epsGrowth5Y: metric.epsGrowth5Y,
                currentRatioQuarterly: metric.currentRatioQuarterly,
                quickRatioAnnual: metric.quickRatioAnnual,
                roeTTM: metric.roeTTM,
                roaRfy: metric.roaRfy,
                dividendYieldIndicatedAnnual: metric.dividendYieldIndicatedAnnual,
                "52WeekHigh": metric["52WeekHigh"],
                "52WeekLow": metric["52WeekLow"],
            },
            // <-- 新增新闻数据字段
            recentNews: Array.isArray(recentNews) ? recentNews.slice(0, 10) : [], // 限制最多 10 条新闻，避免 Prompt 过长
        };

        // 2. 组装提示词（新闻分析依赖模型通用知识，免责声明强制固定）
        const sysPrompt = `
你是一名面向全球普通投资人的专业「公司研究员」，擅长把复杂的财务和行业信息翻译成“讲人话”的结构化报告。

要求：
- ${langConfig.languageInstruction}
- 读者：对投资有兴趣、但不是专业机构的普通人
- 目标：帮助读者形成「是否值得继续深入研究」的第一印象，不给出具体买卖指令
- 结构：严格使用下列固定章节编号（0~9）
- 风格：理性、克制、避免夸张营销，不假装知道未来
- 模板偏好：${toneInstruction}
- 完全禁止：任何形式的“确保赚钱”“必然涨跌”等表述

**【报告内容和结构强制要求】**

1. **强制要求：** 报告的第一行**必须**是一个 Markdown 一级标题（#），格式为：
   **# 【Investor AI】[公司名称] ([股票代码]) 投资分析报告**

2. **固定章节结构（请务必按顺序输出，使用 ## 作为二级标题）：**

0. 公司基本信息
1. 公司定位与业务核心
2. 三原则评估：合规伦理 / 价值创造 / 资本效率
3. 竞争格局与护城河
4. **新闻 · 政策 · 黑天鹅雷达**
5. 个人投资决策参考框架 (非投资建议)
6. 最强反对意见 (Bear Case)
7. 最终结论（一句话）
8. 重要免责声明与数据来源说明

---
**【关于第 4 章节的特殊指令】**

- **指令：** 在“新闻 · 政策 · 黑天鹅雷达”章节，请**优先**基于**结构化数据中的 \`recentNews\` 字段**进行分析。
- **分析重点：**
    1. **近况总结：** 总结 \`recentNews\` 中的主要议题和趋势（如财报、重大合同、产品发布、管理层变动等）。
    2. **政策与黑天鹅：** 在分析完近期新闻后，结合你拥有的通用知识和推理能力，识别和分析可能存在的**“政策变动”**、**“黑天鹅”**风险或重大潜在危机。
- **声明：** 请在该章节开头明确说明分析主要基于**“Finnhub 提供的近期新闻数据”**。如果新闻数据缺失或为空，请退回到基于你的**通用知识**进行分析，并说明数据缺失。
---

其中：
- “三原则”通用定义：
  1）合规伦理：法规、治理结构、社会责任、是否踩明显红线
  2）价值创造：产品/服务是否真的解决问题、是否具有差异化和长期竞争力
  3）资本效率：ROIC、现金流、利润率等是否体现“有效使用资本”，需参考行业特性

数据相关说明（请在第 0 部分最后单独一小段写出）：
- 统一使用下面这句话，不要自行发挥：
  “数据来源：Finnhub 公共金融数据 API + 公司公开披露的财报、年报及官方公告等公开信息。不包含任何非公开或内幕信息。”

数据相关说明（请在第 4 部分最后单独一小段写出）：
- 统一使用下面这句话，不要自行发挥：
  “本章节分析主要基于 Finnhub 提供的近期新闻数据，再结合一般公开常识进行补充。”

---
**【关于第 8 章节的强制要求：固定免责声明】** 模型，请严格注意：该章节的内容**必须**是下面这段 Markdown 文本的**精确复制**，不得更改任何措辞、顺序或标点符号。这是强制性的免责声明，必须保持一致性。

## 8. 重要免责声明与数据来源说明

* 本报告仅基于当日给定的结构化数据和一般公开常识进行分析，不构成任何形式的投资建议或买卖指引。
* 股票价格会随时间和市场情绪而波动，公司基本面和政策环境也会发生变化，文中判断仅反映撰写时点的有限信息。
* 投资决策需结合个人风险承受能力、投资期限和整体资产状况，必要时可咨询具备资质的专业顾问。
* 任何投资都有可能亏损，即使是过去表现优秀的，未来也可能出现重大不利变化。
* 数据来源：Finnhub 公共金融数据 API + 公司公开披露的财报、年报及官方公告等公开信息。不包含任何非公开或内幕信息。

---
`;

        const userPrompt = `
请基于下面这份结构化数据，为股票 ${symbol} 写一份面向普通投资者的公司投研分析报告。

【结构化数据】
${JSON.stringify(companyData, null, 2)}

要求：
- 直接输出 Markdown 格式，不要再解释你自己
- 标题用 “# / ## / ###” 分级，不要使用表格（便于在不同终端展示）
- 若部分指标缺失，请明确说明“数据缺失”或“该项暂不评估”，不要编造数字
- 所有结论都要尽量基于上面的数据和常识推理，遇到不确定就写“不确定”而不是猜测
`;

        // 3. 调用 Helicone (fallback to OpenRouter if needed)
        const heliPayload = {
            model: env.HELICONE_MODEL,
            messages: [
                { role: "system", content: sysPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: 8000,
        };

        async function callHelicone() {
            if (!env.HELICONE_API_KEY) return null;
            const res = await fetch(
                "https://ai-gateway.helicone.ai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${env.HELICONE_API_KEY}`,
                    },
                    body: JSON.stringify(heliPayload),
                }
            );
            if (!res.ok) {
                const text = await res.text();
                console.warn("Helicone error:", text);
                return null;
            }
            return res.json();
        }

        async function callOpenRouter() {
            if (!env.OPENROUTER_API_KEY) return null;
            const res = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
                        "HTTP-Referer":
                            process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
                        "X-Title": process.env.OPENROUTER_APP_NAME || "investor-ai",
                    },
                    body: JSON.stringify({
                        model: env.OPENROUTER_MODEL,
                        messages: [
                            { role: "system", content: sysPrompt },
                            { role: "user", content: userPrompt },
                        ],
                        temperature: 0.4,
                        max_tokens: 8000,
                    }),
                }
            );

            if (!res.ok) {
                const text = await res.text();
                console.error("OpenRouter error:", text);
                return null;
            }
            return res.json();
        }

        const llmSpan = trace?.span({
          name: "llm.generate",
          metadata: { provider: env.HELICONE_API_KEY ? "helicone" : "openrouter", model: env.OPENROUTER_MODEL },
        });

        const data =
            (await callHelicone()) ??
            (await callOpenRouter()) ??
            null;

        llmSpan?.end({
          output: { hasData: Boolean(data?.choices?.[0]?.message?.content) },
        });

        if (!data) {
            // // trace?.end({ error: "llm_generation_failed" }); // LangFuse API changed
            const response = NextResponse.json(
                { error: "Failed to generate report via Helicone/OpenRouter" },
                { status: 500 }
            );
            responseCookies.forEach(({ name, value }) => {
              response.headers.append("Set-Cookie", `${name}=${value}`);
            });
            return response;
        }

        const rawReport =
            data.choices?.[0]?.message?.content ||
            "生成报告时出现问题，没有拿到模型返回内容。";

        const report = sanitizeReportContent(rawReport, language);

        // Consume quota and write to Supabase
        let remainingCredits = 0;
        let reportRunId: string | null = null;

        if (isTestBypass) {
          // Test mode: write audit log and create report run (but use test marker)
          // Try to create report run in test mode
          try {
            const { data: runData, error: runError } = await supabase
              .from("report_runs")
              .insert({
                user_id: userId, // Use actual test-bypass ID, but mark mode='test'
                symbol,
                status: "completed",
                mode: "test",
              } as never)
              .select("id")
              .single();

            if (!runError && runData) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              reportRunId = (runData as any).id;

              // Upload Markdown to Storage in test mode
              const bucketName = process.env.SUPABASE_STORAGE_REPORT_BUCKET || "report-assets";
              const markdownPath = `${userId}/${reportRunId}/document.md`;

              try {
                const serviceRoleClient = createServiceRoleClient();
                await uploadToStorage(
                  serviceRoleClient,
                  bucketName,
                  markdownPath,
                  report
                );
              } catch (storageError) {
                // Log but don't fail test run if storage fails
                console.warn("Test mode storage upload failed:", storageError);
              }

              // Save document reference in database
              await supabase.from("report_documents").insert({
                report_run_id: reportRunId,
                document_type: "markdown",
                storage_path: markdownPath,
              } as never);
            }
          } catch (err) {
            console.warn("Test mode report run creation failed:", err);
          }

          await writeReportAudit(userId, symbol, "test", "success");
          // trace?.end({ output: { reportRunId } });
          remainingCredits = 999; // Mock remaining
        } else {
          try {
            // Consume credit atomically
            const consumeResult = await consumeReportCredit(userId);
            if (!consumeResult.success) {
              const response = NextResponse.json(
                { error: consumeResult.error || "Failed to consume credit" },
                { status: 500 }
              );
              responseCookies.forEach(({ name, value }) => {
                response.headers.append("Set-Cookie", `${name}=${value}`);
              });
              return response;
            }
            remainingCredits = consumeResult.remainingCredits || 0;

            trace?.update({
              metadata: { symbol, language, tone: toneKeyRaw, model: env.OPENROUTER_MODEL },
            });

            // Record report run
            const { data: runData, error: runError } = await supabase
              .from("report_runs")
              .insert({
                user_id: userId,
                symbol,
                status: "completed",
                mode: "production",
              } as never)
              .select("id")
              .single();

            if (runError || !runData) {
              throw new Error(`Failed to create report run: ${runError?.message}`);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            reportRunId = (runData as any).id;

            const storageSpan = trace?.span({ name: "supabase.storage.upload" });

            // Upload Markdown to Storage
            const bucketName = process.env.SUPABASE_STORAGE_REPORT_BUCKET || "report-assets";
            const markdownPath = `${userId}/${reportRunId}/document.md`;

            try {
              const serviceRoleClient = createServiceRoleClient();
              await uploadToStorage(
                serviceRoleClient,
                bucketName,
                markdownPath,
                report
              );
              // Note: DOCX generation would happen here in production
              // For MVP, we only store Markdown
            } catch (storageError) {
              // Rollback: delete the report run to avoid incorrect state
              await supabase
                .from("report_runs")
                .delete()
                .eq("id" as never, reportRunId as never);

              const response = NextResponse.json(
                { error: `Storage upload failed: ${storageError instanceof Error ? storageError.message : "Unknown error"}` },
                { status: 500 }
              );
              responseCookies.forEach(({ name, value }) => {
                response.headers.append("Set-Cookie", `${name}=${value}`);
              });
              return response;
            }

            // Save document reference in database
            await supabase.from("report_documents").insert({
              report_run_id: reportRunId,
              document_type: "markdown",
              storage_path: markdownPath,
            } as never);
            storageSpan?.end({ output: { bucketName, path: markdownPath } });

            await writeReportAudit(userId, symbol, "production", "success");
            // trace?.end({ output: { reportRunId } });
          } catch (err) {
            await writeReportAudit(userId, symbol, "production", "failed");
            console.error("Supabase report error:", err);
            // trace?.end({ error: err instanceof Error ? err.message : "unknown" });
            const response = NextResponse.json(
              { error: `Report generation error: ${err instanceof Error ? err.message : "Unknown error"}` },
              { status: 500 }
            );
            responseCookies.forEach(({ name, value }) => {
              response.headers.append("Set-Cookie", `${name}=${value}`);
            });
            return response;
          }
        }

        // Fire-and-forget embeddings (does not block response)
        void writeEmbeddingsBackground({
          reportRunId,
          report,
          language,
          tone: toneKeyRaw,
          apiKey: env.OPENROUTER_API_KEY || "",
        });

        const response = NextResponse.json({
            symbol,
            report,
            companyData,
            remainingQuota: remainingCredits,
            reportRunId,
        });

        // Apply collected cookies to response
        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });

        return response;
    } catch (err) {
        console.error("Error generating report:", err);
        // trace?.end({ error: err instanceof Error ? err.message : "unknown" });
        const response = NextResponse.json(
            { error: `Failed to generate report: ${err instanceof Error ? err.message : 'Unknown error'}` },
            { status: 500 }
        );

        // Apply collected cookies to error response
        responseCookies.forEach(({ name, value }) => {
          response.headers.append("Set-Cookie", `${name}=${value}`);
        });

        return response;
    }
}
