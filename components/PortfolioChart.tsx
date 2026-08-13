"use client";

import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { fetchHoldingHistory, type PricePoint } from "@/lib/pricing";
import { buildPortfolioSeries, earliestTradeMs, type SeriesPoint } from "@/lib/portfolioSeries";
import { isTradeable, type TradeableHolding } from "@/lib/trades";
import { useChartTheme } from "@/lib/chartTheme";
import { formatINR, formatPercent } from "@/lib/format";

type RangeKey = "1M" | "6M" | "1Y" | "ALL";

const RANGES: { key: RangeKey; days: number | null; yahoo: string }[] = [
  { key: "1M", days: 30, yahoo: "1mo" },
  { key: "6M", days: 182, yahoo: "6mo" },
  { key: "1Y", days: 365, yahoo: "1y" },
  { key: "ALL", days: null, yahoo: "5y" },
];

export default function PortfolioChart() {
  const holdings = useFinanceStore((s) => s.holdings);
  const usdInr = useFinanceStore((s) => s.fxRate?.usdInr ?? 87);
  const chartTheme = useChartTheme();

  const [range, setRange] = useState<RangeKey>("1Y");
  // Keyed by request so `loading` can be derived rather than set synchronously
  // inside the effect (which would trigger a cascading render).
  const [loaded, setLoaded] = useState<{
    key: string;
    histories: Map<string, PricePoint[]>;
    fetchedAt: number;
  } | null>(null);

  const tradeable = useMemo(() => holdings.filter(isTradeable) as TradeableHolding[], [holdings]);
  const rangeConfig = RANGES.find((r) => r.key === range) ?? RANGES[2];

  const requestKey = `${tradeable.map((h) => h.id).join(",")}:${rangeConfig.yahoo}`;
  const loading = tradeable.length > 0 && loaded?.key !== requestKey;
  const histories = useMemo(
    () => (loaded?.key === requestKey ? loaded.histories : new Map<string, PricePoint[]>()),
    [loaded, requestKey]
  );

  useEffect(() => {
    if (tradeable.length === 0) return;
    let cancelled = false;

    Promise.all(
      tradeable.map(async (h) => [h.id, await fetchHoldingHistory(h, rangeConfig.yahoo)] as const)
    ).then((entries) => {
      if (!cancelled) setLoaded({ key: requestKey, histories: new Map(entries), fetchedAt: Date.now() });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, rangeConfig.yahoo]);

  const series: SeriesPoint[] = useMemo(() => {
    if (tradeable.length === 0 || histories.size === 0 || !loaded) return [];
    const now = loaded.fetchedAt;
    const firstTrade = earliestTradeMs(tradeable);
    const windowStart = rangeConfig.days ? now - rangeConfig.days * 86400000 : (firstTrade ?? now - 365 * 86400000);
    // Never start the chart before the first trade — there's nothing to show.
    const from = firstTrade ? Math.max(windowStart, firstTrade) : windowStart;
    if (now - from < 86400000) return [];
    return buildPortfolioSeries(tradeable, histories, usdInr, from, now, 80);
  }, [tradeable, histories, loaded, usdInr, rangeConfig.days]);

  const summary = useMemo(() => {
    if (series.length < 2) return null;
    const first = series[0];
    const last = series[series.length - 1];
    const change = last.value - first.value;
    return {
      change,
      percent: first.value > 0 ? (change / first.value) * 100 : 0,
      current: last.value,
    };
  }, [series]);

  if (tradeable.length === 0) return null;

  const positive = (summary?.change ?? 0) >= 0;
  const lineColor = positive ? chartTheme.income : chartTheme.expense;

  return (
    <div className="card p-4 md:p-6">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold md:text-base">Portfolio value</h2>
          {summary ? (
            <div className={`text-xs tabular-nums md:text-sm ${positive ? "text-positive" : "text-negative"}`}>
              {positive ? "+" : ""}
              {formatINR(summary.change)} ({formatPercent(summary.percent)}) over {range === "ALL" ? "all time" : range}
            </div>
          ) : (
            <div className="text-xs text-muted">Stocks and mutual funds only</div>
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r.key ? "bg-primary/12 text-primary" : "text-muted hover:bg-surface-alt"
              }`}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 w-full md:h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : series.length < 2 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted">
            Not enough history yet — this fills in as your holdings age.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 10, fill: chartTheme.axis }}
                axisLine={false}
                tickLine={false}
                minTickGap={44}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
                }
              />
              <YAxis
                tick={{ fontSize: 10, fill: chartTheme.axis }}
                axisLine={false}
                tickLine={false}
                width={46}
                tickFormatter={(v) =>
                  Math.abs(v) >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${Math.round(v / 1000)}K`
                }
              />
              <Tooltip
                contentStyle={chartTheme.tooltip}
                itemStyle={{ color: chartTheme.tooltip.color }}
                labelFormatter={(v) =>
                  new Date(Number(v)).toLocaleDateString("en-IN", { dateStyle: "medium" })
                }
                formatter={(value, name) => [formatINR(Number(value)), name as string]}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: chartTheme.axis }} />
              <Area
                type="monotone"
                dataKey="value"
                name="Value"
                stroke={lineColor}
                strokeWidth={2.5}
                fill="url(#portfolioFill)"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="invested"
                name="Invested"
                stroke={chartTheme.axis}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="mt-2 text-[11px] text-muted">
        Reconstructed from your transaction history and each holding&apos;s past prices. Covers stocks and
        mutual funds — PF, NPS and manually-valued assets have no price history to chart.
      </p>
    </div>
  );
}
