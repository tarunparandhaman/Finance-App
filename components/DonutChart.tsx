"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "@/lib/format";
import { useChartTheme } from "@/lib/chartTheme";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface SliceLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

const RADIAN = Math.PI / 180;

/** Draws the share inside each segment, skipping slivers too small to read. */
function renderPercentLabel(props: unknown) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props as SliceLabelProps;
  if (percent < 0.07) return <g />;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

export default function DonutChart({ data, total }: { data: DonutSlice[]; total?: number }) {
  const chartTheme = useChartTheme();
  const nonZero = data.filter((d) => d.value > 0);
  const sum = total ?? nonZero.reduce((acc, d) => acc + d.value, 0);

  if (nonZero.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted">
        Add holdings to see your breakdown
      </div>
    );
  }

  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={nonZero}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            strokeWidth={0}
            labelLine={false}
            label={renderPercentLabel}
            isAnimationActive={false}
          >
            {nonZero.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatINR(Number(value)), name as string]}
            contentStyle={chartTheme.tooltip}
            itemStyle={{ color: chartTheme.tooltip.color }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] text-muted">Total</span>
        <span className="text-lg font-bold tabular-nums">{formatINR(sum)}</span>
      </div>
    </div>
  );
}
