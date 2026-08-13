"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatINR } from "@/lib/format";
import type { MonthlyTrendPoint } from "@/lib/cashflow";

export default function TrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`)}
          />
          <Tooltip
            formatter={(value) => formatINR(Number(value))}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="income" name="Income" fill="#16a34a" radius={[3, 3, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[3, 3, 0, 0]} />
          <Bar dataKey="investment" name="Investment" fill="#2563eb" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
