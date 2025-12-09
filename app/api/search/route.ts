import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, searchRateLimit, getIpAddress } from "@/lib/api/rate-limit";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

function buildFallbackResponse(query: string, description: string, source: string) {
  return NextResponse.json({
    query,
    results: [
      {
        symbol: query.toUpperCase(),
        description,
        displaySymbol: query.toUpperCase(),
        type: source,
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
  const isTestBypass = Boolean(
    testToken && (tokenFromHeader === testToken || tokenFromQuery === testToken)
  );

  if (!q) {
    return NextResponse.json({ error: "Missing q query parameter" }, { status: 400 });
  }

  // Rate limit check by IP address (skip for test bypass)
  if (!isTestBypass) {
    const ipAddress = getIpAddress(request);
    const { success, headers } = await checkRateLimit(
      ipAddress,
      searchRateLimit
    );

    if (!success) {
      return NextResponse.json(
        { error: "Too many search requests. Please try again later." },
        { status: 429, headers }
      );
    }
  }

  // 测试 token 直接返回本地候选，不再访问 Finnhub，保证页面下拉可用
  if (isTestBypass) {
    return buildFallbackResponse(q, `${q.toUpperCase()} (测试模式，本地候选)`, "test");
  }

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.error("Missing FINNHUB_API_KEY");
    return NextResponse.json(
      { error: "Server configuration error: missing FINNHUB_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const url = `${FINNHUB_BASE}/search?q=${encodeURIComponent(q)}&token=${apiKey}`;

    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      console.error("Finnhub search error:", res.status, text);
      return NextResponse.json({ error: "Failed to search symbol from Finnhub" }, { status: 502 });
    }

    const data = await res.json();

    type FinnhubSearchItem = {
      description: string;
      symbol: string;
      displaySymbol?: string;
      type?: string;
    };

    const rawResults = Array.isArray(data.result) ? (data.result as FinnhubSearchItem[]) : [];

    // 只取前 10 个有用结果
    const results = rawResults
      .filter((item): item is FinnhubSearchItem => Boolean(item.symbol && item.description))
      .slice(0, 10)
      .map((item) => ({
        symbol: String(item.symbol),
        description: String(item.description),
        displaySymbol: item.displaySymbol ? String(item.displaySymbol) : undefined,
        type: item.type ? String(item.type) : undefined,
      }));

    return NextResponse.json({
      query: q,
      results,
    });
  } catch (err) {
    console.error("Unexpected error in /api/search:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
