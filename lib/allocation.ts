import type { AllocationBucket, AllocationTarget, Holding } from "./types";
import { valueHolding } from "./valuation";

export const ALLOCATION_BUCKET_LABELS: Record<AllocationBucket, string> = {
  EQUITY: "Equity",
  DEBT: "Debt",
  REAL_ESTATE: "Real Estate",
  COMMODITIES: "Commodities",
  CASH: "Cash & Savings",
};

export const ALLOCATION_BUCKET_COLORS: Record<AllocationBucket, string> = {
  EQUITY: "#2563eb",
  DEBT: "#059669",
  REAL_ESTATE: "#d97706",
  COMMODITIES: "#b45309",
  CASH: "#64748b",
};

export const ALLOCATION_BUCKETS: AllocationBucket[] = ["EQUITY", "DEBT", "REAL_ESTATE", "COMMODITIES", "CASH"];

/** Maps a holding to a broad allocation bucket for the target-vs-actual view. */
export function bucketForHolding(h: Holding): AllocationBucket {
  switch (h.category) {
    case "IN_STOCK":
    case "US_STOCK":
    case "MUTUAL_FUND":
      return "EQUITY";
    case "PF":
    case "NPS":
      return "DEBT";
    case "OTHER":
      switch (h.subType) {
        case "FD":
          return "DEBT";
        case "GOLD":
          return "COMMODITIES";
        case "REAL_ESTATE":
          return "REAL_ESTATE";
        case "CASH":
          return "CASH";
        default:
          return "CASH";
      }
  }
}

export interface BucketAmount {
  bucket: AllocationBucket;
  valueInr: number;
  percent: number;
}

export function currentAllocation(holdings: Holding[], usdInr: number): BucketAmount[] {
  const totals: Record<AllocationBucket, number> = {
    EQUITY: 0,
    DEBT: 0,
    REAL_ESTATE: 0,
    COMMODITIES: 0,
    CASH: 0,
  };
  let total = 0;
  for (const h of holdings) {
    const value = valueHolding(h, usdInr).currentValueInr;
    totals[bucketForHolding(h)] += value;
    total += value;
  }
  return ALLOCATION_BUCKETS.map((bucket) => ({
    bucket,
    valueInr: totals[bucket],
    percent: total > 0 ? (totals[bucket] / total) * 100 : 0,
  }));
}

export interface RebalanceRow {
  bucket: AllocationBucket;
  currentPercent: number;
  targetPercent: number;
  currentValueInr: number;
  gapPercent: number; // current - target; negative = underweight
  actionValueInr: number; // positive = amount to add, negative = amount to reduce
}

export function rebalanceAnalysis(
  holdings: Holding[],
  target: AllocationTarget,
  usdInr: number
): { rows: RebalanceRow[]; totalInr: number; needsRebalancing: boolean } {
  const current = currentAllocation(holdings, usdInr);
  const totalInr = current.reduce((sum, c) => sum + c.valueInr, 0);

  const rows: RebalanceRow[] = current.map((c) => {
    const targetPercent = target[c.bucket] ?? 0;
    const targetValueInr = (targetPercent / 100) * totalInr;
    return {
      bucket: c.bucket,
      currentPercent: c.percent,
      targetPercent,
      currentValueInr: c.valueInr,
      gapPercent: c.percent - targetPercent,
      actionValueInr: targetValueInr - c.valueInr,
    };
  });

  const needsRebalancing = rows.some((r) => Math.abs(r.gapPercent) > 5);

  return { rows, totalInr, needsRebalancing };
}

export function targetSum(target: AllocationTarget): number {
  return ALLOCATION_BUCKETS.reduce((sum, b) => sum + (target[b] ?? 0), 0);
}
