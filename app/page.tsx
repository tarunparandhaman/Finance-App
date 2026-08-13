"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Scale, LineChart as LineChartIcon, PieChart, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import DonutChart from "@/components/DonutChart";
import RefreshButton from "@/components/RefreshButton";
import CategoryIcon, { LiabilityIcon } from "@/components/CategoryIcon";
import { useFinanceStore } from "@/lib/store";
import { refreshAllPrices, isPriceable } from "@/lib/pricing";
import { CATEGORY_COLORS, CATEGORY_LABELS, valueHolding, totalLiabilities } from "@/lib/valuation";
import { formatINR, formatPercent, timeAgo } from "@/lib/format";
import { currentMonthKey, transactionsInMonth, summarizeMonth } from "@/lib/cashflow";
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
  const liabilities = useFinanceStore((s) => s.liabilities);
  const transactions = useFinanceStore((s) => s.transactions);
  const snapshots = useFinanceStore((s) => s.snapshots);
  const fxRate = useFinanceStore((s) => s.fxRate);
  const autoRefreshedRef = useRef(false);

  useEffect(() => {
    if (!autoRefreshedRef.current && holdings.some(isPriceable)) {
      autoRefreshedRef.current = true;
      refreshAllPrices();
    }
  }, [holdings]);

  const usdInr = fxRate?.usdInr ?? 87;

  const { assetsTotal, byCategory, lastUpdated } = useMemo(() => {
    let assetsTotal = 0;
    const byCategory: Record<string, number> = {};
    let lastUpdated: string | undefined;
    for (const h of holdings) {
      const v = valueHolding(h, usdInr);
      assetsTotal += v.currentValueInr;
      byCategory[h.category] = (byCategory[h.category] ?? 0) + v.currentValueInr;
      const fetched = "lastFetched" in h ? h.lastFetched : undefined;
      if (fetched && (!lastUpdated || fetched > lastUpdated)) lastUpdated = fetched;
    }
    return { assetsTotal, byCategory, lastUpdated };
  }, [holdings, usdInr]);

  const liabilitiesTotal = useMemo(() => totalLiabilities(liabilities, usdInr), [liabilities, usdInr]);
  const netWorth = assetsTotal - liabilitiesTotal;

  const trend = useMemo(() => {
    if (snapshots.length === 0) return null;
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    const changeVsLatestSnapshot = netWorth - latest.netWorthInr;
    const changePercent = latest.netWorthInr !== 0 ? (changeVsLatestSnapshot / Math.abs(latest.netWorthInr)) * 100 : 0;
    return { changeVsLatestSnapshot, changePercent, since: latest.date };
  }, [snapshots, netWorth]);

  const monthSummary = useMemo(
    () => summarizeMonth(transactionsInMonth(transactions, currentMonthKey())),
    [transactions]
  );

  const chartData = (Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((cat) => ({
    name: CATEGORY_LABELS[cat],
    value: byCategory[cat] ?? 0,
    color: CATEGORY_COLORS[cat],
  }));

  const categoriesWithHoldings = (Object.keys(CATEGORY_LABELS) as AssetCategory[]).filter(
    (cat) => (byCategory[cat] ?? 0) > 0
  );

  const isEmpty = holdings.length === 0 && liabilities.length === 0;

  return (
    <PageShell title="Net Worth" action={<RefreshButton />}>
      <div className="space-y-6">
        <div className="hero-card p-5">
          <div className="text-sm text-white/75">Net worth</div>
          <div className="mt-1 text-4xl font-bold tracking-tight tabular-nums">{formatINR(netWorth)}</div>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/75">
            {trend && (
              <span
                className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ${
                  trend.changeVsLatestSnapshot >= 0 ? "bg-white/20" : "bg-black/20"
                }`}
              >
                {trend.changeVsLatestSnapshot >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {formatPercent(trend.changePercent)}
              </span>
            )}
            <span>{lastUpdated ? `Prices updated ${timeAgo(lastUpdated)}` : "Add a holding to get started"}</span>
          </div>
          {liabilitiesTotal > 0 && (
            <div className="mt-4 flex gap-5 border-t border-white/20 pt-3 text-xs">
              <span className="text-white/75">
                Assets <span className="font-semibold text-white">{formatINR(assetsTotal)}</span>
              </span>
              <span className="text-white/75">
                Debts <span className="font-semibold text-white">{formatINR(liabilitiesTotal)}</span>
              </span>
            </div>
          )}
        </div>

        {isEmpty ? (
          <div className="card border-dashed p-8 text-center">
            <p className="mb-4 text-sm text-muted">
              You haven&apos;t added anything yet. Start with your stocks, mutual funds, PF, NPS or other savings.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/invest" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
                Add investments
              </Link>
              <Link href="/save" className="rounded-full border border-border px-4 py-2 text-sm font-medium">
                Add savings
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Link href="/insights?tab=CASHFLOW" className="card p-3 text-center transition-shadow active:shadow-none">
                <PieChart size={16} className="mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted">This month</div>
                <div className="text-sm font-semibold tabular-nums">{formatPercent(monthSummary.savingsRate)}</div>
                <div className="text-[10px] text-muted">saved</div>
              </Link>
              <Link href="/insights?tab=ALLOCATION" className="card p-3 text-center transition-shadow active:shadow-none">
                <Scale size={16} className="mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted">Allocation</div>
                <div className="text-sm font-semibold">Rebalance</div>
                <div className="text-[10px] text-muted">check fit</div>
              </Link>
              <Link href="/insights?tab=HISTORY" className="card p-3 text-center transition-shadow active:shadow-none">
                <LineChartIcon size={16} className="mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted">History</div>
                <div className="text-sm font-semibold">Snapshot</div>
                <div className="text-[10px] text-muted">net worth</div>
              </Link>
            </div>

            {chartData.some((c) => c.value > 0) && (
              <div className="card p-4">
                <DonutChart data={chartData} />
              </div>
            )}

            {categoriesWithHoldings.length > 0 && (
              <div className="space-y-2">
                <h2 className="px-1 text-sm font-medium text-muted">Breakdown</h2>
                {categoriesWithHoldings.map((cat) => {
                  const route = CATEGORY_ROUTE[cat];
                  const value = byCategory[cat] ?? 0;
                  const pct = assetsTotal > 0 ? (value / assetsTotal) * 100 : 0;
                  return (
                    <Link
                      key={cat}
                      href={`${route.href}?tab=${route.tab}`}
                      className="card flex items-center justify-between px-4 py-3 active:shadow-none"
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={cat} size={16} />
                        <span className="text-sm font-medium">{CATEGORY_LABELS[cat]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-semibold tabular-nums">{formatINR(value)}</div>
                          <div className="text-xs text-muted">{pct.toFixed(1)}%</div>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
                      </div>
                    </Link>
                  );
                })}
                {liabilities.length > 0 && (
                  <Link
                    href="/save?tab=LIABILITY"
                    className="card flex items-center justify-between px-4 py-3 active:shadow-none"
                  >
                    <div className="flex items-center gap-3">
                      <LiabilityIcon size={16} />
                      <span className="text-sm font-medium">Loans &amp; Debts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-negative tabular-nums">
                        -{formatINR(liabilitiesTotal)}
                      </div>
                      <ChevronRight size={16} className="text-muted" />
                    </div>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
