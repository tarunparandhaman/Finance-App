import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_RANGES = new Set(["5d", "1mo", "3mo", "6mo", "1y", "5y", "max"]);

/** Coarser candles for longer ranges keeps payloads small without losing shape. */
function intervalFor(range: string): string {
  if (range === "5d") return "30m";
  if (range === "1mo" || range === "3mo") return "1d";
  if (range === "6mo" || range === "1y") return "1d";
  return "1wk";
}

// Proxies Yahoo Finance's chart endpoint for historical price series.
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const range = req.nextUrl.searchParams.get("range") ?? "1y";

  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });
  if (!ALLOWED_RANGES.has(range)) return NextResponse.json({ error: "bad range" }, { status: 400 });

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${intervalFor(range)}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 300 } }
    );
    if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];

    // Yahoo emits nulls for halted/holiday candles — drop them so the line
    // doesn't break, rather than carrying gaps into the chart.
    const points = timestamps
      .map((t, i) => ({ t: t * 1000, c: closes[i] }))
      .filter((p): p is { t: number; c: number } => typeof p.c === "number");

    return NextResponse.json({
      symbol,
      range,
      currency: result?.meta?.currency ?? null,
      points,
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
