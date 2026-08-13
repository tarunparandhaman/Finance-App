import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxies mfapi.in's latest-NAV endpoint for a given scheme code.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code query param required" }, { status: 400 });

  try {
    const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(code)}/latest`, {
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    const data = await res.json();
    const latest = data?.data?.[0];
    if (!latest) return NextResponse.json({ error: "no data" }, { status: 404 });
    return NextResponse.json({
      schemeCode: code,
      schemeName: data?.meta?.scheme_name,
      nav: parseFloat(latest.nav),
      date: latest.date,
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
