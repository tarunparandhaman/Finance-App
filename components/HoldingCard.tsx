"use client";

import type { Holding } from "@/lib/types";
import { valueHolding } from "@/lib/valuation";
import { formatINR, formatNumber, formatPercent, timeAgo } from "@/lib/format";
import { useFinanceStore } from "@/lib/store";
import CategoryIcon from "@/components/CategoryIcon";
import { ChevronRight } from "lucide-react";

export default function HoldingCard({
  holding,
  onClick,
}: {
  holding: Holding;
  onClick: () => void;
}) {
  const usdInr = useFinanceStore((s) => s.fxRate?.usdInr ?? 87);
  const v = valueHolding(holding, usdInr);
  const hasGain = holding.category === "IN_STOCK" || holding.category === "US_STOCK" || holding.category === "MUTUAL_FUND";

  let detail = "";
  let lastFetched: string | undefined;
  switch (holding.category) {
    case "IN_STOCK":
    case "US_STOCK":
      detail = `${formatNumber(holding.quantity, 4)} sh @ ${holding.currency === "USD" ? "$" : "₹"}${formatNumber(
        holding.currentPrice ?? holding.avgPrice
      )}`;
      lastFetched = holding.lastFetched;
      break;
    case "MUTUAL_FUND":
      detail = `${formatNumber(holding.units, 3)} units @ ₹${formatNumber(holding.currentNav ?? holding.avgNav)}`;
      lastFetched = holding.lastFetched;
      break;
    case "PF":
    case "NPS":
      detail = `As of ${holding.asOfDate}`;
      break;
    case "OTHER":
      detail = `${holding.subType.replace("_", " ")} · As of ${holding.asOfDate}`;
      break;
  }

  return (
    <button onClick={onClick} className="card flex w-full items-center gap-3 p-4 text-left active:shadow-none">
      <CategoryIcon category={holding.category} size={16} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{holding.name}</div>
        <div className="truncate text-xs text-muted">{detail}</div>
        {lastFetched && <div className="mt-0.5 text-[11px] text-muted">Updated {timeAgo(lastFetched)}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <div className="font-semibold tabular-nums">{formatINR(v.currentValueInr)}</div>
          {hasGain && (
            <div className={`text-xs tabular-nums ${v.gainInr >= 0 ? "text-positive" : "text-negative"}`}>
              {formatPercent(v.gainPercent)}
            </div>
          )}
        </div>
        <ChevronRight size={18} className="text-muted" />
      </div>
    </button>
  );
}
