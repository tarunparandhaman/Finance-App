import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxies Yahoo Finance's chart endpoint so the browser can fetch live
// stock prices without hitting CORS restrictions.
export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols query param required" }, { status: 400 });
  }
  const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
          { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
        );
        if (!res.ok) return { symbol, error: "not found" };
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) return { symbol, error: "not found" };
        return {
          symbol,
          price: meta.regularMarketPrice as number,
          currency: meta.currency as string,
          name: (meta.longName || meta.shortName || symbol) as string,
          previousClose: meta.previousClose as number,
        };
      } catch {
        return { symbol, error: "fetch failed" };
      }
    })
  );

  return NextResponse.json({ quotes: results });
}
