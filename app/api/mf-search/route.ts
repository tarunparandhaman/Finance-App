import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxies mfapi.in's mutual fund search (free, public, no key required).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ results: [] });

  try {
    const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    const results = Array.isArray(data)
      ? data.slice(0, 20).map((d: { schemeCode: number; schemeName: string }) => ({
          schemeCode: String(d.schemeCode),
          schemeName: d.schemeName,
        }))
      : [];
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
