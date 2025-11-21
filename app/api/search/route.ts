import { NextRequest, NextResponse } from "next/server";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

function buildFallbackResponse(q: string, description: string, type = "fallback") {
  const symbol = q.toUpperCase();
  return NextResponse.json({
    query: q,
    results: [
      {
        symbol,
        description,
        displaySymbol: symbol,
        type,
      },
    ],
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const testToken = process.env.TEST_REPORT_TOKEN || "local-test-token";
  const tokenFromHeader = request.headers.get("x-test-token");
  const tokenFromQuery = searchParams.get("testToken");
  const isTestBypass = Boolean(testToken && (tokenFromHeader === testToken || tokenFromQuery === testToken));

  if (!q) {
    return NextResponse.json(
      { error: "Missing q query parameter" },
      { status: 400 }
    );
  }

  // 测试 token 直接返回本地候选，不再访问 Finnhub，保证页面下拉可用
  if (isTestBypass) {
    return buildFallbackResponse(q, `${q.toUpperCase()} (测试模式，本地候选)`, "test");
  }

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.error("Missing FINNHUB_API_KEY");
    return buildFallbackResponse(q, `${q.toUpperCase()} (本地候选，未配置 FINNHUB_API_KEY)`);
  }

  try {
    const url = `${FINNHUB_BASE}/search?q=${encodeURIComponent(
      q
    )}&token=${apiKey}`;

    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      console.error("Finnhub search error:", res.status, text);
      return buildFallbackResponse(q, `${q.toUpperCase()} (本地候选，搜索失败回退)`);
    }

    const data = await res.json();

    type FinnhubSearchItem = {
      description: string;
      symbol: string;
      displaySymbol?: string;
      type?: string;
    };

    const rawResults = Array.isArray(data.result)
      ? (data.result as FinnhubSearchItem[])
      : [];

    // 只取前 10 个有用结果
    const results = rawResults
      .filter((item): item is FinnhubSearchItem =>
        Boolean(item.symbol && item.description)
      )
      .slice(0, 10)
      .map((item) => ({
        symbol: String(item.symbol),
        description: String(item.description),
        displaySymbol: item.displaySymbol ? String(item.displaySymbol) : undefined,
        type: item.type ? String(item.type) : undefined,
      }));

    if (results.length === 0) {
      return buildFallbackResponse(q, `${q.toUpperCase()} (本地候选，无搜索结果回退)`);
    }

    return NextResponse.json({
      query: q,
      results,
    });
  } catch (err) {
    console.error("Unexpected error in /api/search:", err);
    return buildFallbackResponse(q, `${q.toUpperCase()} (本地候选，服务异常回退)`);
  }
}
