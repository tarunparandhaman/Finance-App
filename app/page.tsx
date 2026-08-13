"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Scale, LineChart as LineChartIcon, PieChart, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import DonutChart from "@/components/DonutChart";
import PortfolioChart from "@/components/PortfolioChart";
import IndicesStrip from "@/components/IndicesStrip";
import RefreshButton from "@/components/RefreshButton";
import CategoryIcon, { LiabilityIcon } from "@/components/CategoryIcon";
import { useFinanceStore } from "@/lib/store";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import { CATEGORY_LABELS, valueHolding, totalLiabilities } from "@/lib/valuation";
import { portfolioXirr, portfolioDayChange } from "@/lib/returns";
import { useChartTheme } from "@/lib/chartTheme";
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

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as AssetCategory[];

export default function DashboardPage() {
  const holdings = useFinanceStore((s) => s.holdings);
  const liabilities = useFinanceStore((s) => s.liabilities);
  const transactions = useFinanceStore((s) => s.transactions);
  const snapshots = useFinanceStore((s) => s.snapshots);
  const fxRate = useFinanceStore((s) => s.fxRate);
  const { categoryColors } = useChartTheme();

  useAutoRefresh();

  const usdInr = fxRate?.usdInr ?? 87;

  const { assetsTotal, investedTotal, byCategory, lastUpdated } = useMemo(() => {
    let assetsTotal = 0;
    let investedTotal = 0;
    const byCategory: Record<string, number> = {};
    let lastUpdated: string | undefined;
    for (const h of holdings) {
      const v = valueHolding(h, usdInr);
      assetsTotal += v.currentValueInr;
      investedTotal += v.costValueInr;
      byCategory[h.category] = (byCategory[h.category] ?? 0) + v.currentValueInr;
      const fetched = "lastFetched" in h ? h.lastFetched : undefined;
      if (fetched && (!lastUpdated || fetched > lastUpdated)) lastUpdated = fetched;
    }
    return { assetsTotal, investedTotal, byCategory, lastUpdated };
  }, [holdings, usdInr]);

  const liabilitiesTotal = useMemo(() => totalLiabilities(liabilities, usdInr), [liabilities, usdInr]);
  const netWorth = assetsTotal - liabilitiesTotal;
  const totalGain = assetsTotal - investedTotal;
  const totalGainPercent = investedTotal > 0 ? (totalGain / investedTotal) * 100 : 0;

  const trend = useMemo(() => {
    if (snapshots.length === 0) return null;
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    const change = netWorth - latest.netWorthInr;
    const percent = latest.netWorthInr !== 0 ? (change / Math.abs(latest.netWorthInr)) * 100 : 0;
    return { change, percent };
  }, [snapshots, netWorth]);

  const dayChange = useMemo(() => portfolioDayChange(holdings, usdInr), [holdings, usdInr]);
  const annualised = useMemo(() => portfolioXirr(holdings, usdInr), [holdings, usdInr]);

  const monthSummary = useMemo(
    () => summarizeMonth(transactionsInMonth(transactions, currentMonthKey())),
    [transactions]
  );

  const chartData = ALL_CATEGORIES.map((cat) => ({
    name: CATEGORY_LABELS[cat],
    value: byCategory[cat] ?? 0,
    color: categoryColors[cat],
  }));

  const categoriesWithHoldings = ALL_CATEGORIES.filter((cat) => (byCategory[cat] ?? 0) > 0);
  const isEmpty = holdings.length === 0 && liabilities.length === 0;

  return (
    <PageShell title="Net Worth" action={<RefreshButton />} wide>
      <div className="space-y-6">
        <div className="hero-card p-6 md:p-10">
          <div className="relative z-10">
            <div className="text-sm text-white/60 md:text-base">Net worth</div>
            <div className="display-figure mt-1 text-4xl md:text-6xl">{formatINR(netWorth)}</div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60 md:text-sm">
              {dayChange && (
                <span
                  className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ${
                    dayChange.amountInr >= 0 ? "bg-primary/20 text-primary" : "bg-negative/20 text-negative"
                  }`}
                >
                  {dayChange.amountInr >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {formatINR(Math.abs(dayChange.amountInr))} ({formatPercent(dayChange.percent)}) today
                </span>
              )}
              {trend && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium text-white/80">
                  {formatPercent(trend.percent)} since last snapshot
                </span>
              )}
              <span>{lastUpdated ? `Updated ${timeAgo(lastUpdated)}` : "Add a holding to get started"}</span>
            </div>

            {(investedTotal > 0 || liabilitiesTotal > 0) && (
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-4 md:max-w-2xl md:text-sm">
                <div>
                  <div className="text-white/45">Invested</div>
                  <div className="font-semibold tabular-nums text-white">{formatINR(investedTotal)}</div>
                </div>
                <div>
                  <div className="text-white/45">Total return</div>
                  <div className={`font-semibold tabular-nums ${totalGain >= 0 ? "text-primary" : "text-negative"}`}>
                    {totalGain >= 0 ? "+" : ""}
                    {formatPercent(totalGainPercent)}
                  </div>
                </div>
                <div>
                  <div className="text-white/45">Annualised</div>
                  <div
                    className={`font-semibold tabular-nums ${
                      annualised === null ? "text-white/70" : annualised >= 0 ? "text-primary" : "text-negative"
                    }`}
                  >
                    {annualised === null ? "—" : formatPercent(annualised)}
                  </div>
                </div>
                <div>
                  <div className="text-white/45">Debts</div>
                  <div className="font-semibold tabular-nums text-white">{formatINR(liabilitiesTotal)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <IndicesStrip />

        {isEmpty ? (
          <div className="card border-dashed p-8 text-center md:p-14">
            <p className="mb-4 text-sm text-muted md:text-base">
              You haven&apos;t added anything yet. Start with your stocks, mutual funds, PF, NPS or other savings.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/invest" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink">
                Add investments
              </Link>
              <Link href="/save" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium">
                Add savings
              </Link>
            </div>
          </div>
        ) : (
          <div className="md:grid md:grid-cols-3 md:items-start md:gap-6">
            <div className="space-y-6 md:col-span-2">
              <PortfolioChart />

              {chartData.some((c) => c.value > 0) && (
                <div className="card p-4 md:p-6">
                  <h2 className="mb-1 text-sm font-semibold md:text-base">Where your money is</h2>
                  <DonutChart data={chartData} total={assetsTotal} />
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
                        className="card flex items-center justify-between px-4 py-3 transition-transform active:shadow-none md:px-5 md:py-4 md:hover:-translate-y-0.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <CategoryIcon category={cat} size={16} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{CATEGORY_LABELS[cat]}</div>
                            <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-surface-alt">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, backgroundColor: categoryColors[cat] }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="text-right">
                            <div className="text-sm font-semibold tabular-nums">{formatINR(value)}</div>
                            <div className="text-xs text-muted tabular-nums">{pct.toFixed(1)}%</div>
                          </div>
                          <ChevronRight size={16} className="text-muted" />
                        </div>
                      </Link>
                    );
                  })}
                  {liabilities.length > 0 && (
                    <Link
                      href="/save?tab=LIABILITY"
                      className="card flex items-center justify-between px-4 py-3 md:px-5 md:py-4"
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
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 md:col-span-1 md:mt-0 md:grid-cols-1 md:gap-3">
              <Link
                href="/insights?tab=CASHFLOW"
                className="card p-3 text-center transition-transform active:shadow-none md:p-5 md:text-left md:hover:-translate-y-0.5"
              >
                <PieChart size={16} className="mx-auto mb-1 text-primary md:mx-0 md:mb-2" />
                <div className="text-xs text-muted md:text-sm">This month</div>
                <div className="text-sm font-semibold tabular-nums md:text-lg">
                  {formatPercent(monthSummary.savingsRate)}
                </div>
                <div className="text-[10px] text-muted md:text-xs">saved</div>
              </Link>
              <Link
                href="/insights?tab=ALLOCATION"
                className="card p-3 text-center transition-transform active:shadow-none md:p-5 md:text-left md:hover:-translate-y-0.5"
              >
                <Scale size={16} className="mx-auto mb-1 text-primary md:mx-0 md:mb-2" />
                <div className="text-xs text-muted md:text-sm">Allocation</div>
                <div className="text-sm font-semibold md:text-lg">Rebalance</div>
                <div className="text-[10px] text-muted md:text-xs">check fit</div>
              </Link>
              <Link
                href="/insights?tab=HISTORY"
                className="card p-3 text-center transition-transform active:shadow-none md:p-5 md:text-left md:hover:-translate-y-0.5"
              >
                <LineChartIcon size={16} className="mx-auto mb-1 text-primary md:mx-0 md:mb-2" />
                <div className="text-xs text-muted md:text-sm">History</div>
                <div className="text-sm font-semibold md:text-lg">Snapshot</div>
                <div className="text-[10px] text-muted md:text-xs">net worth</div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
