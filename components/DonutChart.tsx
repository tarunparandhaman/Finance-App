"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "@/lib/format";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export default function DonutChart({ data }: { data: DonutSlice[] }) {
  const nonZero = data.filter((d) => d.value > 0);

  if (nonZero.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        Add holdings to see your breakdown
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={nonZero}
            dataKey="value"
            nameKey="name"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {nonZero.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatINR(Number(value))}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
