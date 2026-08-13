import type { Goal } from "./types";

export interface GoalProgress {
  currentInr: number;
  targetInr: number;
  percent: number;
  remainingInr: number;
  reached: boolean;
  /** Whole months from now until the target date; null when no date is set. */
  monthsRemaining: number | null;
  /** Contribution per month needed to close the gap, at the assumed return. */
  requiredMonthlyInr: number | null;
  /** True when the deadline has passed and the target wasn't met. */
  overdue: boolean;
}

export const DEFAULT_ASSUMED_RETURN = 12;

function monthsUntil(targetDate: string, nowMs: number): number {
  const now = new Date(nowMs);
  const target = new Date(targetDate);
  let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  if (target.getDate() < now.getDate()) months -= 1;
  return months;
}

/**
 * Monthly contribution needed to grow `current` to `target` over `months`,
 * assuming a constant annual return — i.e. the standard future-value-of-an-
 * annuity solve that every SIP calculator uses.
 *
 * This is arithmetic on the user's own assumptions, not a recommendation.
 */
export function requiredMonthlyContribution(
  current: number,
  target: number,
  months: number,
  annualReturnPercent: number
): number {
  if (months <= 0) return Math.max(0, target - current);

  const monthlyRate = annualReturnPercent / 100 / 12;

  // With no assumed growth it's just the shortfall spread evenly.
  if (monthlyRate === 0) return Math.max(0, (target - current) / months);

  const growth = Math.pow(1 + monthlyRate, months);
  const futureValueOfCurrent = current * growth;
  const shortfall = target - futureValueOfCurrent;
  if (shortfall <= 0) return 0;

  // Contributions are assumed at the end of each month (ordinary annuity).
  return shortfall / ((growth - 1) / monthlyRate);
}

export function goalProgress(goal: Goal, currentNetWorthInr: number, nowMs: number): GoalProgress {
  const targetInr = goal.targetAmountInr;
  const percent = targetInr > 0 ? Math.min(100, (currentNetWorthInr / targetInr) * 100) : 0;
  const remainingInr = Math.max(0, targetInr - currentNetWorthInr);
  const reached = currentNetWorthInr >= targetInr;

  const monthsRemaining = goal.targetDate ? monthsUntil(goal.targetDate, nowMs) : null;
  const overdue = monthsRemaining !== null && monthsRemaining < 0 && !reached;

  const requiredMonthlyInr =
    monthsRemaining !== null && monthsRemaining > 0 && !reached
      ? requiredMonthlyContribution(
          currentNetWorthInr,
          targetInr,
          monthsRemaining,
          goal.assumedReturnPercent ?? DEFAULT_ASSUMED_RETURN
        )
      : null;

  return {
    currentInr: currentNetWorthInr,
    targetInr,
    percent,
    remainingInr,
    reached,
    monthsRemaining,
    requiredMonthlyInr,
    overdue,
  };
}
