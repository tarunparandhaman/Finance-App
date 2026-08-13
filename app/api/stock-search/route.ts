import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxies Yahoo Finance's search endpoint to look up ticker symbols by name.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ results: [] });

  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0`,
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
    );
    const data = await res.json();
    const quotes = (data?.quotes ?? [])
      .filter((q: { quoteType?: string; symbol?: string }) => q.quoteType === "EQUITY" && q.symbol)
      .map((q: { symbol: string; shortname?: string; longname?: string; exchDisp?: string }) => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchDisp,
      }));
    return NextResponse.json({ results: quotes });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
