export interface CashFlow {
  /** Negative = money out (a buy), positive = money in (a sell, or today's value). */
  amount: number;
  date: Date;
}

const DAYS_PER_YEAR = 365;

/** Below roughly a month, an annualised figure is noise rather than signal. */
const MIN_SPAN_DAYS = 30;

/** Anything past this is a maths artefact, not a real return. */
const MAX_PLAUSIBLE_RATE = 100;

function npv(rate: number, flows: CashFlow[], t0: number): number {
  return flows.reduce((sum, f) => {
    const years = (f.date.getTime() - t0) / (DAYS_PER_YEAR * 86400000);
    return sum + f.amount / Math.pow(1 + rate, years);
  }, 0);
}

function npvDerivative(rate: number, flows: CashFlow[], t0: number): number {
  return flows.reduce((sum, f) => {
    const years = (f.date.getTime() - t0) / (DAYS_PER_YEAR * 86400000);
    if (years === 0) return sum;
    return sum - (years * f.amount) / Math.pow(1 + rate, years + 1);
  }, 0);
}

/**
 * Money-weighted annualised return (the same measure Excel's XIRR and Indian
 * brokers report). Unlike a simple gain %, this accounts for *when* each rupee
 * went in, so a late top-up doesn't get credited with earlier growth.
 *
 * Returns null when the maths can't produce a meaningful answer — no flows,
 * all flows the same sign, or a series that fails to converge.
 */
export function xirr(flows: CashFlow[]): number | null {
  if (flows.length < 2) return null;

  const hasPositive = flows.some((f) => f.amount > 0);
  const hasNegative = flows.some((f) => f.amount < 0);
  if (!hasPositive || !hasNegative) return null;

  const sorted = [...flows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const t0 = sorted[0].date.getTime();
  const spanDays = (sorted[sorted.length - 1].date.getTime() - t0) / 86400000;

  // Annualising a few days of return produces absurd numbers (a 1% gain held
  // for one day annualises to ~3,700%), so it isn't reported until there's a
  // meaningful holding period behind it.
  if (spanDays < MIN_SPAN_DAYS) return null;

  // Newton-Raphson from a 10% guess; converges in a handful of steps for
  // ordinary portfolios.
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    const value = npv(rate, sorted, t0);
    if (Math.abs(value) < 1e-7) return rate;
    const derivative = npvDerivative(rate, sorted, t0);
    if (derivative === 0 || !Number.isFinite(derivative)) break;
    const next = rate - value / derivative;
    if (!Number.isFinite(next)) break;
    // Below -100% the discount factor base goes negative and the maths breaks.
    if (next <= -0.9999) {
      rate = -0.9999;
      continue;
    }
    if (Math.abs(next - rate) < 1e-9) return next;
    rate = next;
  }

  // Newton can oscillate on irregular series; bisection is slower but reliable.
  let low = -0.9999;
  let high = 10;
  let lowValue = npv(low, sorted, t0);
  if (!Number.isFinite(lowValue)) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const midValue = npv(mid, sorted, t0);
    if (Math.abs(midValue) < 1e-7) return mid;
    if (lowValue * midValue < 0) {
      high = mid;
    } else {
      low = mid;
      lowValue = midValue;
    }
  }
  return null;
}

/** XIRR as a percentage, or null when it isn't computable or isn't credible. */
export function xirrPercent(flows: CashFlow[]): number | null {
  const rate = xirr(flows);
  if (rate === null || !Number.isFinite(rate)) return null;
  // A converged-but-implausible rate means the flows were degenerate; showing
  // it would be worse than showing nothing.
  if (Math.abs(rate) > MAX_PLAUSIBLE_RATE) return null;
  return rate * 100;
}
