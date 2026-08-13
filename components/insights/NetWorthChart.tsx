"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR } from "@/lib/format";
import { useChartTheme } from "@/lib/chartTheme";
import type { NetWorthSnapshot } from "@/lib/types";

export default function NetWorthChart({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  const t = useChartTheme();
  const data = [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ date: s.date, netWorth: s.netWorthInr }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.investment} stopOpacity={0.35} />
              <stop offset="100%" stopColor={t.investment} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: t.axis }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: t.axis }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => (Math.abs(v) >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${Math.round(v / 1000)}K`)}
          />
          <Tooltip
            formatter={(value) => [formatINR(Number(value)), "Net worth"]}
            contentStyle={t.tooltip}
            itemStyle={{ color: t.tooltip.color }}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke={t.investment}
            strokeWidth={2.5}
            fill="url(#netWorthFill)"
            dot={{ r: 3, fill: t.investment, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
