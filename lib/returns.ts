import { xirrPercent, type CashFlow } from "./xirr";
import { valueHolding } from "./valuation";
import { isTradeable, type TradeableHolding } from "./trades";
import type { Holding } from "./types";

/**
 * Cash flows for a single position, in its own currency: buys are money out,
 * sells are money in, and today's market value closes the series out.
 */
function holdingCashFlows(h: TradeableHolding, marketValue: number): CashFlow[] {
  const flows: CashFlow[] = h.trades.map((t) => ({
    amount: (t.type === "BUY" ? -1 : 1) * t.quantity * t.price,
    date: new Date(t.date),
  }));
  if (marketValue > 0) flows.push({ amount: marketValue, date: new Date() });
  return flows;
}

/** Annualised money-weighted return for one holding, or null if not computable. */
export function holdingXirr(h: TradeableHolding, usdInr: number): number | null {
  const fx = h.category === "US_STOCK" ? usdInr : 1;
  // Value in the holding's own currency, so it matches the trade prices.
  const marketValueNative = valueHolding(h, usdInr).currentValueInr / fx;
  return xirrPercent(holdingCashFlows(h, marketValueNative));
}

/**
 * Portfolio-wide annualised return across every market-priced holding, with all
 * flows normalised to INR so US and Indian positions can share one series.
 */
export function portfolioXirr(holdings: Holding[], usdInr: number): number | null {
  const flows: CashFlow[] = [];

  for (const h of holdings) {
    if (!isTradeable(h)) continue;
    const fx = h.category === "US_STOCK" ? usdInr : 1;
    for (const t of h.trades) {
      flows.push({
        amount: (t.type === "BUY" ? -1 : 1) * t.quantity * t.price * fx,
        date: new Date(t.date),
      });
    }
  }

  if (flows.length === 0) return null;

  const totalValue = holdings
    .filter(isTradeable)
    .reduce((sum, h) => sum + valueHolding(h, usdInr).currentValueInr, 0);
  if (totalValue > 0) flows.push({ amount: totalValue, date: new Date() });

  return xirrPercent(flows);
}

export interface DayChange {
  amountInr: number;
  percent: number;
}

/** Today's move for a holding, or null when there's no prior close to compare. */
export function holdingDayChange(h: Holding, usdInr: number): DayChange | null {
  if (h.category === "IN_STOCK" || h.category === "US_STOCK") {
    if (!h.currentPrice || !h.previousClose) return null;
    const fx = h.currency === "USD" ? usdInr : 1;
    const perShare = h.currentPrice - h.previousClose;
    return {
      amountInr: perShare * h.quantity * fx,
      percent: (perShare / h.previousClose) * 100,
    };
  }
  if (h.category === "MUTUAL_FUND") {
    if (!h.currentNav || !h.previousNav) return null;
    const perUnit = h.currentNav - h.previousNav;
    return {
      amountInr: perUnit * h.units,
      percent: (perUnit / h.previousNav) * 100,
    };
  }
  return null;
}

/** Aggregate day change across all holdings that report one. */
export function portfolioDayChange(holdings: Holding[], usdInr: number): DayChange | null {
  let amountInr = 0;
  let priorValue = 0;
  let any = false;

  for (const h of holdings) {
    const change = holdingDayChange(h, usdInr);
    if (!change) continue;
    any = true;
    amountInr += change.amountInr;
    priorValue += valueHolding(h, usdInr).currentValueInr - change.amountInr;
  }

  if (!any || priorValue <= 0) return null;
  return { amountInr, percent: (amountInr / priorValue) * 100 };
}
