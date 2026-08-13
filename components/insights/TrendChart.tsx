"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatINR } from "@/lib/format";
import { useChartTheme } from "@/lib/chartTheme";
import type { MonthlyTrendPoint } from "@/lib/cashflow";

export default function TrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  const t = useChartTheme();

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: t.axis }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`)}
          />
          <Tooltip
            formatter={(value) => formatINR(Number(value))}
            contentStyle={t.tooltip}
            itemStyle={{ color: t.tooltip.color }}
            cursor={{ fill: t.grid, opacity: 0.35 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: t.axis }} />
          <Bar dataKey="income" name="Income" fill={t.income} radius={[3, 3, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill={t.expense} radius={[3, 3, 0, 0]} />
          <Bar dataKey="investment" name="Investment" fill={t.investment} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
