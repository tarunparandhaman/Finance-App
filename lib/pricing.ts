import type { Holding, MutualFundHolding, StockHolding } from "./types";
import { useFinanceStore } from "./store";

export async function fetchFxRate(): Promise<number | null> {
  try {
    const res = await fetch("/api/fx");
    const data = await res.json();
    if (typeof data.usdInr === "number") {
      useFinanceStore.getState().setFxRate({ usdInr: data.usdInr, updatedAt: new Date().toISOString() });
      return data.usdInr;
    }
  } catch {
    // ignore, keep last known rate
  }
  return useFinanceStore.getState().fxRate?.usdInr ?? null;
}

/** Refreshes current prices/NAVs for all market-priced holdings (stocks + mutual funds). */
export async function refreshAllPrices(): Promise<void> {
  const { holdings, updateHolding } = useFinanceStore.getState();

  const stocks = holdings.filter(
    (h): h is StockHolding => h.category === "IN_STOCK" || h.category === "US_STOCK"
  );
  const funds = holdings.filter((h): h is MutualFundHolding => h.category === "MUTUAL_FUND");

  await fetchFxRate();

  if (stocks.length > 0) {
    const symbols = stocks.map((s) => s.symbol).join(",");
    try {
      const res = await fetch(`/api/quote?symbols=${encodeURIComponent(symbols)}`);
      const data = await res.json();
      const bySymbol: Record<string, { price?: number }> = {};
      for (const q of data.quotes ?? []) bySymbol[q.symbol] = q;
      for (const s of stocks) {
        const q = bySymbol[s.symbol];
        if (q?.price) {
          updateHolding(s.id, { currentPrice: q.price, lastFetched: new Date().toISOString() });
        }
      }
    } catch {
      // ignore network errors, keep last known prices
    }
  }

  await Promise.all(
    funds.map(async (f) => {
      try {
        const res = await fetch(`/api/mf-nav?code=${encodeURIComponent(f.schemeCode)}`);
        const data = await res.json();
        if (typeof data.nav === "number") {
          updateHolding(f.id, { currentNav: data.nav, lastFetched: new Date().toISOString() });
        }
      } catch {
        // ignore
      }
    })
  );
}

export function isPriceable(h: Holding): boolean {
  return h.category === "IN_STOCK" || h.category === "US_STOCK" || h.category === "MUTUAL_FUND";
}
