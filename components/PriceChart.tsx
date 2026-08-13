"use client";

import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { fetchHoldingHistory, type PricePoint } from "@/lib/pricing";
import { useChartTheme } from "@/lib/chartTheme";
import { formatNumber, formatPercent } from "@/lib/format";
import type { TradeableHolding } from "@/lib/trades";

type RangeKey = "1M" | "3M" | "6M" | "1Y" | "5Y";

/** Yahoo range params; mutual funds ignore these and slice one full series. */
const RANGES: { key: RangeKey; yahoo: string; days: number }[] = [
  { key: "1M", yahoo: "1mo", days: 30 },
  { key: "3M", yahoo: "3mo", days: 91 },
  { key: "6M", yahoo: "6mo", days: 182 },
  { key: "1Y", yahoo: "1y", days: 365 },
  { key: "5Y", yahoo: "5y", days: 1826 },
];

export default function PriceChart({ holding }: { holding: TradeableHolding }) {
  const chartTheme = useChartTheme();
  const [range, setRange] = useState<RangeKey>("1Y");
  // Loading is derived from whether the loaded slice matches what's requested,
  // so the effect never has to set state synchronously.
  // `fetchedAt` is captured with the data so the range window is pinned to the
  // fetch rather than recomputed from the clock on every render.
  const [loaded, setLoaded] = useState<{ key: string; points: PricePoint[]; fetchedAt: number } | null>(null);

  const symbolLabel = holding.category === "US_STOCK" ? "$" : "₹";
  const rangeConfig = RANGES.find((r) => r.key === range) ?? RANGES[3];
  const requestKey = `${holding.id}:${rangeConfig.yahoo}`;

  const loading = loaded?.key !== requestKey;
  const points = useMemo(() => (loaded?.key === requestKey ? loaded.points : []), [loaded, requestKey]);
  const failed = !loading && points.length === 0;

  useEffect(() => {
    let cancelled = false;
    fetchHoldingHistory(holding, rangeConfig.yahoo).then((data) => {
      if (!cancelled) setLoaded({ key: requestKey, points: data, fetchedAt: Date.now() });
    });
    return () => {
      cancelled = true;
    };
  }, [holding, rangeConfig.yahoo, requestKey]);

  // Funds come back as one long series, so the range is applied here.
  const visible = useMemo(() => {
    if (points.length === 0 || !loaded) return [];
    const cutoff = loaded.fetchedAt - rangeConfig.days * 86400000;
    const sliced = points.filter((p) => p.t >= cutoff);
    return sliced.length > 1 ? sliced : points.slice(-2);
  }, [points, loaded, rangeConfig.days]);

  const change = useMemo(() => {
    if (visible.length < 2) return null;
    const first = visible[0].c;
    const last = visible[visible.length - 1].c;
    if (!first) return null;
    return { absolute: last - first, percent: ((last - first) / first) * 100 };
  }, [visible]);

  const positive = (change?.percent ?? 0) >= 0;
  const lineColor = positive ? chartTheme.income : chartTheme.expense;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Price history</h3>
          {change && (
            <div className={`text-xs tabular-nums ${positive ? "text-positive" : "text-negative"}`}>
              {positive ? "+" : ""}
              {symbolLabel}
              {formatNumber(Math.abs(change.absolute))} ({formatPercent(change.percent)}) over {range}
            </div>
          )}
        </div>
      </div>

      <div className="h-44 w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : failed || visible.length < 2 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted">
            No price history available for this holding.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visible} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`priceFill-${holding.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 10, fill: chartTheme.axis }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
                }
                minTickGap={40}
              />
              <YAxis
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 10, fill: chartTheme.axis }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) => formatNumber(v, 0)}
              />
              <Tooltip
                contentStyle={chartTheme.tooltip}
                itemStyle={{ color: chartTheme.tooltip.color }}
                labelFormatter={(v) => new Date(Number(v)).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                formatter={(value) => [`${symbolLabel}${formatNumber(Number(value))}`, "Price"]}
              />
              <Area
                type="monotone"
                dataKey="c"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#priceFill-${holding.id})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              range === r.key ? "bg-primary/12 text-primary" : "text-muted hover:bg-surface-alt"
            }`}
          >
            {r.key}
          </button>
        ))}
      </div>
    </div>
  );
}
