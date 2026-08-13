import { NextResponse } from "next/server";

export const runtime = "nodejs";

const INDICES = [
  { symbol: "^NSEI", label: "NIFTY 50" },
  { symbol: "^BSESN", label: "SENSEX" },
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "NASDAQ" },
];

// Fetches headline index levels for market context on the dashboard.
export async function GET() {
  const results = await Promise.all(
    INDICES.map(async ({ symbol, label }) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
          { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } }
        );
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta?.regularMarketPrice) return { symbol, label, error: true };

        const price = meta.regularMarketPrice as number;
        const prev = (meta.previousClose ?? meta.chartPreviousClose) as number | undefined;
        return {
          symbol,
          label,
          price,
          changePercent: prev ? ((price - prev) / prev) * 100 : null,
        };
      } catch {
        return { symbol, label, error: true };
      }
    })
  );

  return NextResponse.json({ indices: results });
}
