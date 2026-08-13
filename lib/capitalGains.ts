import { valueHolding } from "./valuation";
import { isTradeable, type TradeableHolding } from "./trades";
import type { Holding } from "./types";

export type Term = "SHORT" | "LONG";

/**
 * Indian holding-period thresholds. Listed Indian equity and equity mutual
 * funds turn long-term after 12 months; foreign shares (and other non-equity
 * assets) take 24 months.
 */
export function longTermMonths(category: TradeableHolding["category"]): number {
  return category === "US_STOCK" ? 24 : 12;
}

/** FY 2026-27 rates. Kept in one place so they're easy to update each Budget. */
export const TAX_RATES = {
  /** Listed equity / equity MF with STT paid. */
  equityShortPercent: 20,
  equityLongPercent: 12.5,
  /** Annual LTCG exemption on equity, in rupees. */
  equityLongExemption: 125000,
  /** Foreign shares: long-term is a flat rate, short-term is taxed at slab. */
  foreignLongPercent: 12.5,
} as const;

export interface RealisedLot {
  holdingId: string;
  holdingName: string;
  category: TradeableHolding["category"];
  /** Native currency of the holding — gains are converted to INR separately. */
  quantity: number;
  buyDate: string;
  buyPrice: number;
  sellDate: string;
  sellPrice: number;
  holdingDays: number;
  term: Term;
  /** Proceeds minus cost, in INR. */
  gainInr: number;
  proceedsInr: number;
  costInr: number;
}

interface OpenLot {
  quantity: number;
  price: number;
  date: string;
}

function monthsBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return months;
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86400000);
}

/**
 * Matches sells against the oldest open buys — the FIFO basis Indian tax law
 * requires for equity. Note this differs from the average-cost basis used for
 * the app's displayed "avg price"; both are correct for their own purpose.
 */
export function realisedLotsForHolding(h: TradeableHolding, usdInr: number): RealisedLot[] {
  const chronological = [...h.trades].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
  );

  const open: OpenLot[] = [];
  const realised: RealisedLot[] = [];
  const fx = h.category === "US_STOCK" ? usdInr : 1;
  const ltMonths = longTermMonths(h.category);

  for (const t of chronological) {
    if (t.type === "BUY") {
      open.push({ quantity: t.quantity, price: t.price, date: t.date });
      continue;
    }

    let remaining = t.quantity;
    while (remaining > 0 && open.length > 0) {
      const lot = open[0];
      const matched = Math.min(remaining, lot.quantity);

      const proceedsInr = matched * t.price * fx;
      const costInr = matched * lot.price * fx;
      const months = monthsBetween(lot.date, t.date);

      realised.push({
        holdingId: h.id,
        holdingName: h.name,
        category: h.category,
        quantity: matched,
        buyDate: lot.date,
        buyPrice: lot.price,
        sellDate: t.date,
        sellPrice: t.price,
        holdingDays: daysBetween(lot.date, t.date),
        term: months >= ltMonths ? "LONG" : "SHORT",
        gainInr: proceedsInr - costInr,
        proceedsInr,
        costInr,
      });

      lot.quantity -= matched;
      remaining -= matched;
      if (lot.quantity <= 1e-9) open.shift();
    }
    // A sell with no matching buy can only come from bad data; ignoring the
    // unmatched remainder is safer than inventing a zero-cost lot.
  }

  return realised;
}

export function allRealisedLots(holdings: Holding[], usdInr: number): RealisedLot[] {
  return holdings
    .filter(isTradeable)
    .flatMap((h) => realisedLotsForHolding(h, usdInr))
    .sort((a, b) => b.sellDate.localeCompare(a.sellDate));
}

/** Indian financial year label for a date, e.g. "2026-27" for 14 Aug 2026. */
export function financialYearOf(isoDate: string): string {
  const d = new Date(isoDate);
  const year = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

export function currentFinancialYear(nowMs: number): string {
  return financialYearOf(new Date(nowMs).toISOString());
}

export interface FySummary {
  fy: string;
  shortTermGainInr: number;
  longTermGainInr: number;
  equityLongGainInr: number;
  foreignLongGainInr: number;
  equityShortGainInr: number;
  foreignShortGainInr: number;
  lots: RealisedLot[];
}

export function summariseByFinancialYear(lots: RealisedLot[]): FySummary[] {
  const byFy = new Map<string, FySummary>();

  for (const lot of lots) {
    const fy = financialYearOf(lot.sellDate);
    let entry = byFy.get(fy);
    if (!entry) {
      entry = {
        fy,
        shortTermGainInr: 0,
        longTermGainInr: 0,
        equityLongGainInr: 0,
        foreignLongGainInr: 0,
        equityShortGainInr: 0,
        foreignShortGainInr: 0,
        lots: [],
      };
      byFy.set(fy, entry);
    }

    const foreign = lot.category === "US_STOCK";
    if (lot.term === "LONG") {
      entry.longTermGainInr += lot.gainInr;
      if (foreign) entry.foreignLongGainInr += lot.gainInr;
      else entry.equityLongGainInr += lot.gainInr;
    } else {
      entry.shortTermGainInr += lot.gainInr;
      if (foreign) entry.foreignShortGainInr += lot.gainInr;
      else entry.equityShortGainInr += lot.gainInr;
    }
    entry.lots.push(lot);
  }

  return [...byFy.values()].sort((a, b) => b.fy.localeCompare(a.fy));
}

export interface TaxEstimate {
  equityShortTax: number;
  equityLongTaxable: number;
  equityLongTax: number;
  foreignLongTax: number;
  /** Foreign short-term is taxed at slab, which depends on total income. */
  foreignShortGain: number;
  exemptionUsed: number;
  total: number;
}

/**
 * Indicative tax on a year's realised gains. Excludes foreign short-term gains
 * (slab-rate, so it depends on income this app doesn't know) and any carried-
 * forward losses.
 */
export function estimateTax(summary: FySummary): TaxEstimate {
  const equityShortTax = Math.max(0, summary.equityShortGainInr) * (TAX_RATES.equityShortPercent / 100);

  const equityLongGain = Math.max(0, summary.equityLongGainInr);
  const exemptionUsed = Math.min(equityLongGain, TAX_RATES.equityLongExemption);
  const equityLongTaxable = Math.max(0, equityLongGain - exemptionUsed);
  const equityLongTax = equityLongTaxable * (TAX_RATES.equityLongPercent / 100);

  const foreignLongTax = Math.max(0, summary.foreignLongGainInr) * (TAX_RATES.foreignLongPercent / 100);

  return {
    equityShortTax,
    equityLongTaxable,
    equityLongTax,
    foreignLongTax,
    foreignShortGain: Math.max(0, summary.foreignShortGainInr),
    exemptionUsed,
    total: equityShortTax + equityLongTax + foreignLongTax,
  };
}

export interface UnrealisedLot {
  holdingId: string;
  holdingName: string;
  category: TradeableHolding["category"];
  quantity: number;
  buyDate: string;
  buyPrice: number;
  currentPrice: number;
  holdingDays: number;
  term: Term;
  /** Days until this lot would qualify as long-term; 0 once it already does. */
  daysToLongTerm: number;
  gainInr: number;
}

/** Open lots left after FIFO matching, with the term they'd attract if sold now. */
export function unrealisedLots(h: TradeableHolding, usdInr: number, nowMs: number): UnrealisedLot[] {
  const chronological = [...h.trades].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
  );

  const open: OpenLot[] = [];
  for (const t of chronological) {
    if (t.type === "BUY") {
      open.push({ quantity: t.quantity, price: t.price, date: t.date });
      continue;
    }
    let remaining = t.quantity;
    while (remaining > 0 && open.length > 0) {
      const lot = open[0];
      const matched = Math.min(remaining, lot.quantity);
      lot.quantity -= matched;
      remaining -= matched;
      if (lot.quantity <= 1e-9) open.shift();
    }
  }

  const fx = h.category === "US_STOCK" ? usdInr : 1;
  const ltMonths = longTermMonths(h.category);
  const currentPrice =
    h.category === "MUTUAL_FUND" ? (h.currentNav ?? h.avgNav) : (h.currentPrice ?? h.avgPrice);
  const nowIso = new Date(nowMs).toISOString();

  return open.map((lot) => {
    const months = monthsBetween(lot.date, nowIso);
    const term: Term = months >= ltMonths ? "LONG" : "SHORT";

    const qualifyingDate = new Date(lot.date);
    qualifyingDate.setMonth(qualifyingDate.getMonth() + ltMonths);
    const daysToLongTerm =
      term === "LONG" ? 0 : Math.max(0, Math.ceil((qualifyingDate.getTime() - nowMs) / 86400000));

    return {
      holdingId: h.id,
      holdingName: h.name,
      category: h.category,
      quantity: lot.quantity,
      buyDate: lot.date,
      buyPrice: lot.price,
      currentPrice,
      holdingDays: daysBetween(lot.date, nowIso),
      term,
      daysToLongTerm,
      gainInr: (currentPrice - lot.price) * lot.quantity * fx,
    };
  });
}

export function allUnrealisedLots(holdings: Holding[], usdInr: number, nowMs: number): UnrealisedLot[] {
  return holdings
    .filter(isTradeable)
    .flatMap((h) => unrealisedLots(h, usdInr, nowMs))
    .sort((a, b) => a.daysToLongTerm - b.daysToLongTerm);
}

/** Total unrealised gain across market-priced holdings, for cross-checking. */
export function totalUnrealisedGain(holdings: Holding[], usdInr: number): number {
  return holdings
    .filter(isTradeable)
    .reduce((sum, h) => sum + valueHolding(h, usdInr).gainInr, 0);
}
