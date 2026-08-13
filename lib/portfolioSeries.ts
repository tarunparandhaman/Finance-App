import type { PricePoint } from "./pricing";
import type { Trade } from "./types";
import type { TradeableHolding } from "./trades";

export interface SeriesPoint {
  t: number;
  /** Market value of the holdings on that date, in INR. */
  value: number;
  /** Cost basis of what was held on that date, in INR. */
  invested: number;
}

/** Units held at the end of `dateMs`, from the trade log. */
export function quantityAsOf(trades: Trade[], dateMs: number): number {
  let qty = 0;
  for (const t of trades) {
    if (new Date(t.date).getTime() > dateMs) continue;
    qty += t.type === "BUY" ? t.quantity : -t.quantity;
  }
  return Math.max(0, qty);
}

/** Cost basis of the position at `dateMs`, using the average-cost method. */
export function costBasisAsOf(trades: Trade[], dateMs: number): number {
  const chronological = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let qty = 0;
  let cost = 0;
  for (const t of chronological) {
    if (new Date(t.date).getTime() > dateMs) break;
    if (t.type === "BUY") {
      cost += t.quantity * t.price;
      qty += t.quantity;
    } else {
      const avg = qty > 0 ? cost / qty : 0;
      const sold = Math.min(t.quantity, qty);
      cost -= sold * avg;
      qty -= sold;
    }
  }
  return Math.max(0, cost);
}

/**
 * Last known price at or before `dateMs`. Series are step functions — a price
 * holds until the next published point — so this walks back rather than
 * interpolating. Falls back to the earliest known price for dates that predate
 * the series.
 */
export function priceAsOf(points: PricePoint[], dateMs: number): number | null {
  if (points.length === 0) return null;
  if (dateMs < points[0].t) return points[0].c;

  let low = 0;
  let high = points.length - 1;
  let best = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (points[mid].t <= dateMs) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return points[best].c;
}

/**
 * Market value of a set of holdings sampled across a date range, reconstructed
 * from each holding's trade log and its historical price series.
 *
 * Only market-priced holdings (stocks, mutual funds) belong here — PF, NPS and
 * manually-valued assets have no price history, so including them would mean
 * inventing one.
 */
export function buildPortfolioSeries(
  holdings: TradeableHolding[],
  histories: Map<string, PricePoint[]>,
  usdInr: number,
  fromMs: number,
  toMs: number,
  samples = 90
): SeriesPoint[] {
  if (holdings.length === 0 || toMs <= fromMs) return [];

  const stepMs = (toMs - fromMs) / Math.max(1, samples - 1);
  const series: SeriesPoint[] = [];

  for (let i = 0; i < samples; i++) {
    const t = Math.round(fromMs + stepMs * i);
    let value = 0;
    let invested = 0;

    for (const h of holdings) {
      const qty = quantityAsOf(h.trades, t);
      if (qty <= 0) continue;

      const fx = h.category === "US_STOCK" ? usdInr : 1;
      const points = histories.get(h.id) ?? [];
      const price = priceAsOf(points, t);
      // Without a price series, the cost basis is the best available stand-in.
      const fallback = h.category === "MUTUAL_FUND" ? h.avgNav : h.avgPrice;

      value += qty * (price ?? fallback) * fx;
      invested += costBasisAsOf(h.trades, t) * fx;
    }

    series.push({ t, value, invested });
  }

  return series;
}

/** Earliest trade across all holdings, or null when there are none. */
export function earliestTradeMs(holdings: TradeableHolding[]): number | null {
  let earliest: number | null = null;
  for (const h of holdings) {
    for (const t of h.trades) {
      const ms = new Date(t.date).getTime();
      if (!Number.isFinite(ms)) continue;
      if (earliest === null || ms < earliest) earliest = ms;
    }
  }
  return earliest;
}
