import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** mfapi.in returns dates as DD-MM-YYYY. */
function toEpochMs(ddmmyyyy: string): number {
  const [d, m, y] = ddmmyyyy.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

// Proxies mfapi.in's full NAV history for a scheme.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  try {
    const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(code)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });

    const data = await res.json();
    const rows: { date: string; nav: string }[] = data?.data ?? [];

    // mfapi returns newest-first; charts and lookups both want oldest-first.
    const points = rows
      .map((r) => ({ t: toEpochMs(r.date), c: parseFloat(r.nav) }))
      .filter((p) => Number.isFinite(p.c) && Number.isFinite(p.t))
      .sort((a, b) => a.t - b.t);

    return NextResponse.json({
      schemeCode: code,
      schemeName: data?.meta?.scheme_name ?? null,
      points,
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
