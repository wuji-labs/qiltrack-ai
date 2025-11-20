import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

import { DEFAULT_LANGUAGE, type Language } from "@/lib/i18n-config";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-5.1";

const toneDirectives = {
    baseline: "以 Investor AI 标准流程输出，保持证据优先与结构化描述，不加入夸张语气。",
    buffett: "采用价值投资视角：强调护城河、现金流、治理质量与估值安全边际，解释为何可以長期持有。",
    musk: "以科技乐观主义者的语气描写：突出创新、TAM、技术迭代与可能的 10 倍成长机会，同时保留理性提醒。",
    muddy: "站在做空机构/反脆弱角度：主力拆解风险、会计或治理疑点、监管黑天鹅，语气保持审慎甚至略偏 Bear。",
} as const;

const LANGUAGE_CONFIG: Record<Language, {
    languageInstruction: string;
    disclaimer: string;
    checklist: string;
}> = {
    en: {
        languageInstruction: "Language: English",
        disclaimer: `This report is auto-generated from public data and common analytical frameworks. The content is for general information only and never constitutes investment advice, trading guidance, or personalized judgment. Market conditions may change and information may lag. Consult licensed professionals before making investment decisions.`,
        checklist: `"Analysis checklist · for user self assessment"

□ Identify potential risk factors
□ Check whether financial fundamentals remain stable
□ Review changes in industry structure
□ Confirm if the growth logic still holds
□ Consider possible black swan events`,
    },
    ja: {
        languageInstruction: "言語: 日本語で出力してください",
        disclaimer: `本レポートは公開データと一般的な分析手法をもとに自動生成された一般参考情報であり、投資助言や売買指示ではありません。市場環境は変化し得るため、情報には遅延や偏りが含まれる可能性があります。投資判断が必要な場合は、必ず有資格の専門家に相談してください。`,
        checklist: `「分析チェックリスト（利用者自身の判断用）」

□ リスク要因が把握されているか
□ 財務の基礎体力が維持されているか
□ 業界構造の変化がないか
□ 成長ストーリーが継続しているか
□ 潜在的なブラックスワンがないか`,
    },
    ko: {
        languageInstruction: "언어: 한국어로 작성해 주세요",
        disclaimer: `이 리포트는 공개 데이터와 일반적인 분석 방법을 기반으로 자동 생성된 일반 참고 정보이며, 투자 자문이나 매매 지침이 아닙니다. 시장 상황은 언제든 변할 수 있고 정보에는 지연이나 편차가 있을 수 있습니다. 투자 결정을 내리기 전에 반드시 자격을 갖춘 전문가와 상담하세요.`,
        checklist: `"분석 체크리스트 · 사용자가 직접 판단"

□ 식별 가능한 위험 요인이 있는가
□ 재무 기초가 안정적으로 유지되고 있는가
□ 산업 구조에 변화가 있는가
□ 성장 논리가 여전히 유효한가
□ 잠재적 블랙스완 이벤트가 없는가`,
    },
    "zh-Hant": {
        languageInstruction: "語言：請用繁體中文輸出",
        disclaimer: `本報告內容由系統基於公開數據與通用分析方法自動生成，僅供一般資訊參考，不構成任何投資建議、買賣意見或個人化判斷。市場情勢可能變動，資訊亦可能存在延遲或偏差。如需投資建議，請諮詢具備合法資質的專業機構。`,
        checklist: `「分析檢核清單 · 供使用者自行判斷」

□ 是否存在可辨識的風險點
□ 財務基本面是否保持穩定
□ 產業結構是否發生變化
□ 成長邏輯是否仍然成立
□ 是否存在潛在黑天鵝事件`,
    },
    "zh-Hans": {
        languageInstruction: "语言：请使用简体中文输出",
        disclaimer: `本报告内容由系统基于公开数据和通用分析方法自动生成，仅供一般信息参考，不构成任何投资建议、买卖意见或个性化判断。市场状况可能变化，信息可能存在延迟或偏差。如需投资建议，请咨询取得合法资质的专业机构。`,
        checklist: `「分析检核清单 · 供用户自行判断」

□ 是否存在可识别的风险点
□ 财务基本面是否保持稳定
□ 行业结构是否发生变化
□ 增长逻辑是否仍在成立
□ 是否存在潜在黑天鹅事件`,
    },
};

const PARAGRAPH_REMOVAL_KEYWORDS = [
    "买入",
    "卖出",
    "建仓",
    "加仓",
    "减仓",
    "清仓",
    "仓位",
    "调仓",
];

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
    const safeParagraphs: string[] = [];
    let removed = false;
    for (const paragraph of paragraphs) {
        if (PARAGRAPH_REMOVAL_KEYWORDS.some((kw) => paragraph.includes(kw))) {
            removed = true;
            continue;
        }
        safeParagraphs.push(paragraph);
    }

    let sanitized = safeParagraphs.join("\n\n");
    for (const { pattern, replacement } of WORD_REPLACEMENTS) {
        sanitized = sanitized.replace(pattern, replacement);
    }

    if (removed) {
        sanitized = `${sanitized}\n\n${langConfig.checklist}`.trim();
    }

    return `${langConfig.disclaimer}\n\n${sanitized}`.trim();
}

if (!FINNHUB_API_KEY) {
    console.warn("⚠️ FINNHUB_API_KEY 未配置，请检查 .env.local");
}
if (!OPENROUTER_API_KEY) {
    console.warn("⚠️ OPENROUTER_API_KEY 未配置，请检查 .env.local");
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, reportsUsed: true, quota: true },
    });

    if (!dbUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (dbUser.reportsUsed >= dbUser.quota) {
        return NextResponse.json({ error: "Quota exceeded" }, { status: 429 });
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
        return NextResponse.json(
            { error: "Missing symbol param" },
            { status: 400 }
        );
    }

    if (!FINNHUB_API_KEY || !OPENROUTER_API_KEY) {
        return NextResponse.json(
            { error: "Server API key not configured" },
            { status: 500 }
        );
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
        )}&token=${FINNHUB_API_KEY}`;

        const quoteUrl = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(
            symbol
        )}&token=${FINNHUB_API_KEY}`;

        const metricsUrl = `${FINNHUB_BASE}/stock/metric?symbol=${encodeURIComponent(
            symbol
        )}&metric=all&token=${FINNHUB_API_KEY}`;

        // 新增：Finnhub /company-news 接口 (免费层级通常支持近期)
        const newsUrl = `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(
            symbol
        )}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;


        const [profile, quote, metricsRaw, recentNews] = await Promise.all([
            fetchJson(profileUrl),
            fetchJson(quoteUrl),
            fetchJson(metricsUrl),
            fetchJson(newsUrl), // <-- 新增新闻拉取
        ]);

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
7. 在组合中的定位与仓位思路（非投资建议）
8. 最终结论（一句话）
9. 重要免责声明与数据来源说明

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
**【关于第 9 章节的强制要求：固定免责声明】** 模型，请严格注意：第 10 章节的内容**必须**是下面这段 Markdown 文本的**精确复制**，不得更改任何措辞、顺序或标点符号。这是强制性的免责声明，必须保持一致性。

## 9. 重要免责声明与数据来源说明

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

        // 3. 调用 OpenRouter
        const openrouterRes = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer":
                        process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
                    "X-Title": process.env.OPENROUTER_APP_NAME || "investor-ai",
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages: [
                        { role: "system", content: sysPrompt },
                        { role: "user", content: userPrompt },
                    ],
                    temperature: 0.4,
                    max_tokens: 8000,
                }),
            }
        );

        if (!openrouterRes.ok) {
            const text = await openrouterRes.text();
            console.error("OpenRouter error:", text);
            return NextResponse.json(
                { error: "Failed to call OpenRouter" },
                { status: 500 }
            );
        }

        const data = await openrouterRes.json();

        const rawReport =
            data.choices?.[0]?.message?.content ||
            "生成报告时出现问题，没有拿到模型返回内容。";

        const report = sanitizeReportContent(rawReport, language);

        await prisma.user.update({
            where: { id: dbUser.id },
            data: { reportsUsed: { increment: 1 } },
        });

        const remaining = Math.max(dbUser.quota - (dbUser.reportsUsed + 1), 0);

        return NextResponse.json({
            symbol,
            report,
            companyData,
            remainingQuota: remaining,
        });
    } catch (err) {
        console.error("Error generating report:", err);
        return NextResponse.json(
            { error: `Failed to generate report: ${err instanceof Error ? err.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}
