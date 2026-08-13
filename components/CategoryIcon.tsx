"use client";

import { IndianRupee, DollarSign, PieChart, Landmark, ShieldCheck, Wallet, CreditCard } from "lucide-react";
import type { AssetCategory } from "@/lib/types";
import { useChartTheme } from "@/lib/chartTheme";

const ICONS: Record<AssetCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  IN_STOCK: IndianRupee,
  US_STOCK: DollarSign,
  MUTUAL_FUND: PieChart,
  PF: Landmark,
  NPS: ShieldCheck,
  OTHER: Wallet,
};

export default function CategoryIcon({ category, size = 18 }: { category: AssetCategory; size?: number }) {
  const { categoryColors } = useChartTheme();
  const Icon = ICONS[category];
  const color = categoryColors[category];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size + 18, height: size + 18, backgroundColor: `${color}22`, color }}
    >
      <Icon size={size} />
    </span>
  );
}

export function LiabilityIcon({ size = 18 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-negative/10 text-negative"
      style={{ width: size + 18, height: size + 18 }}
    >
      <CreditCard size={size} />
    </span>
  );
}
