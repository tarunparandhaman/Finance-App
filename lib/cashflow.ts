import type { Transaction } from "./types";

/** month key format: YYYY-MM */
export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function transactionsInMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((t) => monthKey(t.date) === month);
}

export interface MonthSummary {
  income: number;
  expense: number;
  investment: number;
  savingsRate: number;
}

export function summarizeMonth(transactions: Transaction[]): MonthSummary {
  let income = 0;
  let expense = 0;
  let investment = 0;
  for (const t of transactions) {
    if (t.type === "INCOME") income += t.amount;
    else if (t.type === "EXPENSE") expense += t.amount;
    else investment += t.amount;
  }
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  return { income, expense, investment, savingsRate };
}

export interface CategoryAmount {
  category: string;
  amount: number;
  percent: number;
}

export function categoryBreakdown(transactions: Transaction[], type: "INCOME" | "EXPENSE"): CategoryAmount[] {
  const totals = new Map<string, number>();
  let total = 0;
  for (const t of transactions) {
    if (t.type !== type) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    total += t.amount;
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount, percent: total > 0 ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export function recurringVsOneOff(transactions: Transaction[]): { recurring: number; oneOff: number } {
  let recurring = 0;
  let oneOff = 0;
  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    if (t.recurring) recurring += t.amount;
    else oneOff += t.amount;
  }
  return { recurring, oneOff };
}

export function biggestExpenses(transactions: Transaction[], limit = 5): Transaction[] {
  return transactions
    .filter((t) => t.type === "EXPENSE")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export interface MonthlyTrendPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
  investment: number;
}

/** Builds the last `count` months (oldest first) ending at `endMonth`, filling zeros for months with no data. */
export function monthlyTrend(transactions: Transaction[], endMonth: string, count = 6): MonthlyTrendPoint[] {
  const [endYear, endM] = endMonth.split("-").map(Number);
  const points: MonthlyTrendPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endYear, endM - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const { income, expense, investment } = summarizeMonth(transactionsInMonth(transactions, key));
    points.push({ month: key, label: monthLabel(key), income, expense, investment });
  }
  return points;
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
