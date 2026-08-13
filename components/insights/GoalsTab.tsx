"use client";

import { useMemo, useState } from "react";
import { Plus, Target, CheckCircle2, AlertTriangle, Pencil } from "lucide-react";
import Sheet from "@/components/Sheet";
import GoalForm from "@/components/forms/GoalForm";
import { useFinanceStore } from "@/lib/store";
import { totalAssets, totalLiabilities } from "@/lib/valuation";
import { goalProgress } from "@/lib/goals";
import { useNow } from "@/lib/useNow";
import { formatINR } from "@/lib/format";
import type { Goal } from "@/lib/types";

export default function GoalsTab() {
  const holdings = useFinanceStore((s) => s.holdings);
  const liabilities = useFinanceStore((s) => s.liabilities);
  const goals = useFinanceStore((s) => s.goals);
  const usdInr = useFinanceStore((s) => s.fxRate?.usdInr ?? 87);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const nowMs = useNow();

  const netWorth = useMemo(
    () => totalAssets(holdings, usdInr) - totalLiabilities(liabilities, usdInr),
    [holdings, liabilities, usdInr]
  );

  if (nowMs === 0) return null;

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Progress is measured against your total net worth.</p>
        <button
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
        >
          <Plus size={13} /> New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card border-dashed p-8 text-center">
          <Target size={24} className="mx-auto mb-2 text-muted" />
          <p className="text-sm text-muted">
            No goals yet. Set a target corpus and watch your net worth close the gap.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const p = goalProgress(goal, netWorth, nowMs);
            return (
              <div key={goal.id} className="card p-4 md:p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{goal.name}</div>
                    <div className="text-xs text-muted">
                      {formatINR(p.currentInr)} of {formatINR(p.targetInr)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditing(goal);
                      setSheetOpen(true);
                    }}
                    aria-label={`Edit ${goal.name}`}
                    className="shrink-0 text-muted hover:text-foreground"
                  >
                    <Pencil size={14} />
                  </button>
                </div>

                <div className="mb-1 flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-semibold tabular-nums ${p.reached ? "text-positive" : ""}`}
                  >
                    {p.percent.toFixed(1)}%
                  </span>
                  {!p.reached && (
                    <span className="text-xs text-muted tabular-nums">
                      {formatINR(p.remainingInr)} to go
                    </span>
                  )}
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.reached ? "bg-positive" : "bg-primary"
                    }`}
                    style={{ width: `${Math.max(1.5, p.percent)}%` }}
                  />
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  {p.reached ? (
                    <div className="flex items-center gap-1.5 text-positive">
                      <CheckCircle2 size={14} /> Target reached
                    </div>
                  ) : p.overdue ? (
                    <div className="flex items-center gap-1.5 text-negative">
                      <AlertTriangle size={14} /> Target date has passed
                    </div>
                  ) : (
                    <>
                      {p.monthsRemaining !== null && (
                        <div className="text-muted">
                          {p.monthsRemaining} {p.monthsRemaining === 1 ? "month" : "months"} left
                          {goal.targetDate && ` · by ${goal.targetDate}`}
                        </div>
                      )}
                      {p.requiredMonthlyInr !== null &&
                        (p.requiredMonthlyInr > 0 ? (
                          <div className="rounded-lg bg-surface-alt px-3 py-2">
                            <span className="font-semibold tabular-nums">
                              {formatINR(p.requiredMonthlyInr)}/month
                            </span>
                            <span className="text-muted">
                              {" "}
                              would close the gap, if your money grew {goal.assumedReturnPercent ?? 12}% a year
                            </span>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-positive/10 px-3 py-2 text-positive">
                            On track without adding anything — what you already hold would reach this by then
                            at {goal.assumedReturnPercent ?? 12}% a year.
                          </div>
                        ))}
                    </>
                  )}
                  {goal.note && <div className="text-muted">{goal.note}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? "Edit goal" : "New goal"}
      >
        <GoalForm existing={editing ?? undefined} onDone={() => setSheetOpen(false)} />
      </Sheet>
    </div>
  );
}
