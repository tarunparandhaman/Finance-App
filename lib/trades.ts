import type { Holding, MutualFundHolding, StockHolding, Trade } from "./types";

export type TradeableHolding = StockHolding | MutualFundHolding;

export function isTradeable(h: Holding): h is TradeableHolding {
  return h.category === "IN_STOCK" || h.category === "US_STOCK" || h.category === "MUTUAL_FUND";
}

export function sortTrades(trades: Trade[]): Trade[] {
  // Newest first for display; ties broken by insertion order.
  return [...trades].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/**
 * Rolls trades up into a position using the average-cost method — the same
 * basis Indian brokers use for the "avg price" they show. Sells reduce the
 * quantity at the running average, leaving the average price unchanged.
 */
export function derivePosition(trades: Trade[]): { quantity: number; avgPrice: number } {
  const chronological = [...trades].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
  );

  let quantity = 0;
  let costBasis = 0;

  for (const t of chronological) {
    if (t.type === "BUY") {
      costBasis += t.quantity * t.price;
      quantity += t.quantity;
    } else {
      const avg = quantity > 0 ? costBasis / quantity : 0;
      const sold = Math.min(t.quantity, quantity);
      costBasis -= sold * avg;
      quantity -= sold;
    }
  }

  return {
    quantity,
    avgPrice: quantity > 0 ? costBasis / quantity : 0,
  };
}

/** Re-derives quantity/avgPrice (or units/avgNav) after a trade changes. */
export function withDerivedPosition<T extends TradeableHolding>(holding: T): T {
  const { quantity, avgPrice } = derivePosition(holding.trades);
  if (holding.category === "MUTUAL_FUND") {
    return { ...holding, units: quantity, avgNav: avgPrice };
  }
  return { ...holding, quantity, avgPrice };
}

/** Total money put in (buys) minus taken out (sells), in the holding's currency. */
export function netInvested(trades: Trade[]): number {
  return trades.reduce(
    (sum, t) => sum + (t.type === "BUY" ? t.quantity * t.price : -t.quantity * t.price),
    0
  );
}

export function tradeLabel(h: TradeableHolding): { unit: string; priceLabel: string } {
  if (h.category === "MUTUAL_FUND") return { unit: "units", priceLabel: "NAV" };
  return { unit: "shares", priceLabel: "price" };
}
