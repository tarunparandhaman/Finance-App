"use client";

import { useMemo, useState } from "react";
import { Pencil, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { ALLOCATION_BUCKETS, ALLOCATION_BUCKET_LABELS, ALLOCATION_BUCKET_COLORS, rebalanceAnalysis, targetSum } from "@/lib/allocation";
import type { AllocationTarget } from "@/lib/types";

export default function AllocationTab() {
  const holdings = useFinanceStore((s) => s.holdings);
  const fxRate = useFinanceStore((s) => s.fxRate);
  const targetAllocation = useFinanceStore((s) => s.targetAllocation);
  const setTargetAllocation = useFinanceStore((s) => s.setTargetAllocation);
  const usdInr = fxRate?.usdInr ?? 87;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AllocationTarget>(targetAllocation);

  const { rows, totalInr, needsRebalancing } = useMemo(
    () => rebalanceAnalysis(holdings, targetAllocation, usdInr),
    [holdings, targetAllocation, usdInr]
  );

  const draftSum = targetSum(draft);

  function startEdit() {
    setDraft(targetAllocation);
    setEditing(true);
  }

  function saveEdit() {
    setTargetAllocation(draft);
    setEditing(false);
  }

  if (totalInr === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
        Add some investments in the Invest or Save tabs to see your allocation.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Target allocation</h3>
          {!editing && (
            <button onClick={startEdit} className="flex items-center gap-1 text-xs text-primary">
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            {ALLOCATION_BUCKETS.map((b) => (
              <div key={b} className="flex items-center justify-between gap-3">
                <span className="text-sm">{ALLOCATION_BUCKET_LABELS[b]}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-right text-sm"
                    value={draft[b]}
                    onChange={(e) => setDraft({ ...draft, [b]: Number(e.target.value) || 0 })}
                  />
                  <span className="text-sm text-muted">%</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
              <span className={draftSum === 100 ? "text-muted" : "text-negative"}>Total: {draftSum}%</span>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="rounded-lg border border-border px-3 py-1.5 text-sm">
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={draftSum !== 100}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-3 overflow-hidden rounded-full">
            {ALLOCATION_BUCKETS.map((b) => (
              <div
                key={b}
                style={{ width: `${targetAllocation[b]}%`, backgroundColor: ALLOCATION_BUCKET_COLORS[b] }}
              />
            ))}
          </div>
        )}
        {!editing && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {ALLOCATION_BUCKETS.map((b) => (
              <span key={b} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ALLOCATION_BUCKET_COLORS[b] }} />
                {ALLOCATION_BUCKET_LABELS[b]} {targetAllocation[b]}%
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-1 text-sm font-medium">Current allocation</h3>
        <div className="mb-3 text-xs text-muted">{formatINR(totalInr)} total</div>

        <div
          className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            needsRebalancing ? "bg-negative/10 text-negative" : "bg-positive/10 text-positive"
          }`}
        >
          {needsRebalancing ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {needsRebalancing
            ? `Needs rebalancing — ${rows.filter((r) => Math.abs(r.gapPercent) > 5).length} categories are off by over 5%.`
            : "Your allocation is close to target."}
        </div>

        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.bucket}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ALLOCATION_BUCKET_COLORS[r.bucket] }} />
                  {ALLOCATION_BUCKET_LABELS[r.bucket]}
                </span>
                <span className="text-muted">
                  {r.currentPercent.toFixed(1)}% / {r.targetPercent}%
                </span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, r.currentPercent)}%`, backgroundColor: ALLOCATION_BUCKET_COLORS[r.bucket] }}
                />
                <div className="absolute top-0 h-full w-px bg-foreground/40" style={{ left: `${Math.min(100, r.targetPercent)}%` }} />
              </div>
              {Math.abs(r.gapPercent) > 5 && (
                <div className={`mt-1 text-xs ${r.actionValueInr > 0 ? "text-positive" : "text-negative"}`}>
                  {r.actionValueInr > 0 ? "Add " : "Reduce "}
                  {formatINR(Math.abs(r.actionValueInr))} to reach target
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="px-1 text-xs text-muted">
        Equity = stocks &amp; mutual funds. Debt = PF, NPS &amp; fixed deposits. Real Estate, Commodities (gold) and
        Cash come from your Other assets. This is a simplification — it doesn&apos;t look inside mutual funds to
        split equity vs. debt funds.
      </p>
    </div>
  );
}
