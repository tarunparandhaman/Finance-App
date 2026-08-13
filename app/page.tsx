"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import DonutChart from "@/components/DonutChart";
import RefreshButton from "@/components/RefreshButton";
import { useFinanceStore } from "@/lib/store";
import { refreshAllPrices, isPriceable } from "@/lib/pricing";
import { CATEGORY_COLORS, CATEGORY_LABELS, valueHolding } from "@/lib/valuation";
import { formatINR, timeAgo } from "@/lib/format";
import type { AssetCategory } from "@/lib/types";

const CATEGORY_ROUTE: Record<AssetCategory, { href: string; tab: string }> = {
  IN_STOCK: { href: "/invest", tab: "IN_STOCK" },
  US_STOCK: { href: "/invest", tab: "US_STOCK" },
  MUTUAL_FUND: { href: "/invest", tab: "MUTUAL_FUND" },
  PF: { href: "/save", tab: "PF" },
  NPS: { href: "/save", tab: "NPS" },
  OTHER: { href: "/save", tab: "OTHER" },
};

export default function DashboardPage() {
  const holdings = useFinanceStore((s) => s.holdings);
  const fxRate = useFinanceStore((s) => s.fxRate);
  const [autoRefreshed, setAutoRefreshed] = useState(false);

  useEffect(() => {
    if (!autoRefreshed && holdings.some(isPriceable)) {
      setAutoRefreshed(true);
      refreshAllPrices();
    }
  }, [autoRefreshed, holdings]);

  const usdInr = fxRate?.usdInr ?? 87;

  const { total, byCategory, lastUpdated } = useMemo(() => {
    let total = 0;
    const byCategory: Record<string, number> = {};
    let lastUpdated: string | undefined;
    for (const h of holdings) {
      const v = valueHolding(h, usdInr);
      total += v.currentValueInr;
      byCategory[h.category] = (byCategory[h.category] ?? 0) + v.currentValueInr;
      const fetched = "lastFetched" in h ? h.lastFetched : undefined;
      if (fetched && (!lastUpdated || fetched > lastUpdated)) lastUpdated = fetched;
    }
    return { total, byCategory, lastUpdated };
  }, [holdings, usdInr]);

  const chartData = (Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((cat) => ({
    name: CATEGORY_LABELS[cat],
    value: byCategory[cat] ?? 0,
    color: CATEGORY_COLORS[cat],
  }));

  const categoriesWithHoldings = (Object.keys(CATEGORY_LABELS) as AssetCategory[]).filter(
    (cat) => (byCategory[cat] ?? 0) > 0
  );

  return (
    <PageShell title="Net Worth" action={<RefreshButton />}>
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="text-sm text-muted">Total net worth</div>
          <div className="mt-1 text-3xl font-bold tracking-tight">{formatINR(total)}</div>
          <div className="mt-1 text-xs text-muted">
            {lastUpdated ? `Prices updated ${timeAgo(lastUpdated)}` : "Add a holding to get started"}
          </div>
        </div>

        {holdings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="mb-4 text-sm text-muted">
              You haven&apos;t added anything yet. Start with your stocks, mutual funds, PF, NPS or other savings.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/invest" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
                Add investments
              </Link>
              <Link href="/save" className="rounded-lg border border-border px-4 py-2 text-sm font-medium">
                Add savings
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <DonutChart data={chartData} />
            </div>

            <div className="space-y-2">
              <h2 className="px-1 text-sm font-medium text-muted">Breakdown</h2>
              {categoriesWithHoldings.map((cat) => {
                const route = CATEGORY_ROUTE[cat];
                const value = byCategory[cat] ?? 0;
                const pct = total > 0 ? (value / total) * 100 : 0;
                return (
                  <Link
                    key={cat}
                    href={`${route.href}?tab=${route.tab}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                      />
                      <span className="text-sm font-medium">{CATEGORY_LABELS[cat]}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatINR(value)}</div>
                      <div className="text-xs text-muted">{pct.toFixed(1)}%</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
