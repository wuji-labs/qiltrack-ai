import { NextRequest, NextResponse } from "next/server";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing symbol query parameter" },
      { status: 400 }
    );
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing API key" },
      { status: 500 }
    );
  }

  try {
    const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(
      symbol
    )}&token=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error("Finnhub quote error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to fetch quote from Finnhub" },
        { status: 502 }
      );
    }

    const quote = await res.json();
    return NextResponse.json({ symbol, quote });
  } catch (err) {
    console.error("Unexpected error fetching quote:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
