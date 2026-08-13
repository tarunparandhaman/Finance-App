"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Sheet from "@/components/Sheet";
import FloatingActionButton from "@/components/FloatingActionButton";
import TransactionForm from "@/components/forms/TransactionForm";
import TrendChart from "@/components/insights/TrendChart";
import { useFinanceStore } from "@/lib/store";
import { formatINR, formatPercent } from "@/lib/format";
import {
  currentMonthKey,
  shiftMonth,
  transactionsInMonth,
  summarizeMonth,
  categoryBreakdown,
  recurringVsOneOff,
  biggestExpenses,
  monthlyTrend,
} from "@/lib/cashflow";
import type { Transaction } from "@/lib/types";

function monthTitle(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function CashflowTab() {
  const transactions = useFinanceStore((s) => s.transactions);
  const [month, setMonth] = useState(currentMonthKey());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const monthTx = useMemo(() => transactionsInMonth(transactions, month), [transactions, month]);
  const summary = useMemo(() => summarizeMonth(monthTx), [monthTx]);
  const expenseByCategory = useMemo(() => categoryBreakdown(monthTx, "EXPENSE"), [monthTx]);
  const incomeByCategory = useMemo(() => categoryBreakdown(monthTx, "INCOME"), [monthTx]);
  const { recurring, oneOff } = useMemo(() => recurringVsOneOff(monthTx), [monthTx]);
  const biggest = useMemo(() => biggestExpenses(monthTx, 5), [monthTx]);
  const trend = useMemo(() => monthlyTrend(transactions, month, 6), [transactions, month]);

  const sortedMonthTx = useMemo(
    () => [...monthTx].sort((a, b) => b.date.localeCompare(a.date)),
    [monthTx]
  );

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between card px-3 py-2">
        <button onClick={() => setMonth((m) => shiftMonth(m, -1))} className="rounded-full p-1.5 hover:bg-background">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium">{monthTitle(month)}</span>
        <button
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          disabled={month >= currentMonthKey()}
          className="rounded-full p-1.5 hover:bg-background disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-muted">Income</div>
          <div className="text-lg font-semibold text-positive tabular-nums">{formatINR(summary.income)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Expenses</div>
          <div className="text-lg font-semibold text-negative tabular-nums">{formatINR(summary.expense)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Invested</div>
          <div className="text-lg font-semibold text-primary tabular-nums">{formatINR(summary.investment)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Savings rate</div>
          <div className="text-lg font-semibold tabular-nums">{formatPercent(summary.savingsRate)}</div>
        </div>
      </div>

      <div className="card p-4 md:p-6">
        <h3 className="mb-3 text-sm font-medium">Monthly trend</h3>
        <TrendChart data={trend} />
      </div>

      {(expenseByCategory.length > 0 || incomeByCategory.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {expenseByCategory.length > 0 && (
            <div className="card p-4 md:p-6">
              <h3 className="mb-3 text-sm font-medium">Expenses by category</h3>
              <div className="space-y-2.5">
                {expenseByCategory.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{c.category}</span>
                      <span className="text-muted">
                        {formatINR(c.amount)} · {c.percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background">
                      <div className="h-full rounded-full bg-negative" style={{ width: `${c.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {incomeByCategory.length > 0 && (
            <div className="card p-4 md:p-6">
              <h3 className="mb-3 text-sm font-medium">Income by category</h3>
              <div className="space-y-2.5">
                {incomeByCategory.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{c.category}</span>
                      <span className="text-muted">
                        {formatINR(c.amount)} · {c.percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background">
                      <div className="h-full rounded-full bg-positive" style={{ width: `${c.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(summary.expense > 0 || biggest.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {summary.expense > 0 && (
            <div className="card p-4 md:p-6">
              <h3 className="mb-3 text-sm font-medium">Recurring vs one-off</h3>
              <div className="flex gap-3 text-sm">
                <div className="flex-1 rounded-lg bg-background p-3">
                  <div className="text-xs text-muted">Recurring</div>
                  <div className="font-semibold tabular-nums">{formatINR(recurring)}</div>
                  <div className="text-xs text-muted tabular-nums">
                    {summary.expense > 0 ? ((recurring / summary.expense) * 100).toFixed(0) : 0}%
                  </div>
                </div>
                <div className="flex-1 rounded-lg bg-background p-3">
                  <div className="text-xs text-muted">One-off</div>
                  <div className="font-semibold tabular-nums">{formatINR(oneOff)}</div>
                  <div className="text-xs text-muted tabular-nums">
                    {summary.expense > 0 ? ((oneOff / summary.expense) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {biggest.length > 0 && (
            <div className="card p-4 md:p-6">
              <h3 className="mb-3 text-sm font-medium">Biggest expenses</h3>
              <div className="space-y-2">
                {biggest.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => openEdit(t)}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted">{i + 1}</span>
                      <span>{t.note || t.category}</span>
                    </span>
                    <span className="font-medium text-negative tabular-nums">{formatINR(t.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card p-4 md:p-6">
        <h3 className="mb-3 text-sm font-medium">Transactions this month</h3>
        {sortedMonthTx.length === 0 ? (
          <p className="text-sm text-muted">No transactions yet — add one with the + button.</p>
        ) : (
          <div className="space-y-1">
            {sortedMonthTx.map((t) => (
              <button
                key={t.id}
                onClick={() => openEdit(t)}
                className="flex w-full items-center justify-between border-b border-border py-2 text-sm last:border-0"
              >
                <div className="text-left">
                  <div>{t.note || t.category}</div>
                  <div className="text-xs text-muted">
                    {t.category} · {t.date}
                  </div>
                </div>
                <span
                  className={
                    t.type === "EXPENSE" ? "text-negative" : t.type === "INCOME" ? "text-positive" : "text-primary"
                  }
                >
                  {t.type === "EXPENSE" ? "-" : "+"}
                  {formatINR(t.amount)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <FloatingActionButton onClick={openAdd} label="Add transaction" wide />

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? "Edit transaction" : "Add transaction"}>
        <TransactionForm existing={editing ?? undefined} onDone={() => setSheetOpen(false)} />
      </Sheet>
    </div>
  );
}
