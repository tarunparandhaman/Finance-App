"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatINR } from "@/lib/format";
import type { NetWorthSnapshot } from "@/lib/types";

export default function NetWorthChart({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  const data = [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ date: s.date, netWorth: s.netWorthInr }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${Math.round(v / 1000)}K`)}
          />
          <Tooltip
            formatter={(value) => formatINR(Number(value))}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="netWorth" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
