import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Fetches the USD->INR rate via Yahoo Finance so US holdings can be
// converted to INR for the combined net-worth total.
export async function GET() {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X",
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
    );
    const data = await res.json();
    const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (!rate) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ usdInr: rate as number });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
