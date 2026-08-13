import { IndianRupee, DollarSign, PieChart, Landmark, ShieldCheck, Wallet, CreditCard } from "lucide-react";
import type { AssetCategory } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/valuation";

const ICONS: Record<AssetCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  IN_STOCK: IndianRupee,
  US_STOCK: DollarSign,
  MUTUAL_FUND: PieChart,
  PF: Landmark,
  NPS: ShieldCheck,
  OTHER: Wallet,
};

export default function CategoryIcon({ category, size = 18 }: { category: AssetCategory; size?: number }) {
  const Icon = ICONS[category];
  const color = CATEGORY_COLORS[category];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size + 16, height: size + 16, backgroundColor: `${color}1a`, color }}
    >
      <Icon size={size} />
    </span>
  );
}

export function LiabilityIcon({ size = 18 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-negative/10 text-negative"
      style={{ width: size + 16, height: size + 16 }}
    >
      <CreditCard size={size} />
    </span>
  );
}
