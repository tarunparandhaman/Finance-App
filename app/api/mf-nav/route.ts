import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxies mfapi.in for a scheme's latest NAV. Uses the full-history endpoint
// rather than /latest so the prior day's NAV is available for day-change.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code query param required" }, { status: 400 });

  try {
    const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(code)}`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });

    const data = await res.json();
    const rows: { date: string; nav: string }[] = data?.data ?? [];
    const latest = rows[0];
    if (!latest) return NextResponse.json({ error: "no data" }, { status: 404 });

    const previous = rows[1] ? parseFloat(rows[1].nav) : undefined;

    return NextResponse.json({
      schemeCode: code,
      schemeName: data?.meta?.scheme_name,
      nav: parseFloat(latest.nav),
      previousNav: Number.isFinite(previous) ? previous : undefined,
      date: latest.date,
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
