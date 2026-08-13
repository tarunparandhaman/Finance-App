"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import Field, { inputClass } from "@/components/Field";
import { useFinanceStore } from "@/lib/store";
import { DEFAULT_ASSUMED_RETURN } from "@/lib/goals";
import type { Goal } from "@/lib/types";

export default function GoalForm({ existing, onDone }: { existing?: Goal; onDone: () => void }) {
  const addGoal = useFinanceStore((s) => s.addGoal);
  const updateGoal = useFinanceStore((s) => s.updateGoal);
  const deleteGoal = useFinanceStore((s) => s.deleteGoal);

  const [name, setName] = useState(existing?.name ?? "");
  const [target, setTarget] = useState(existing?.targetAmountInr?.toString() ?? "");
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? "");
  const [assumedReturn, setAssumedReturn] = useState(
    (existing?.assumedReturnPercent ?? DEFAULT_ASSUMED_RETURN).toString()
  );
  const [note, setNote] = useState(existing?.note ?? "");

  const valid = name.trim().length > 0 && Number(target) > 0;

  function handleSave() {
    const payload = {
      name: name.trim(),
      targetAmountInr: Number(target),
      targetDate: targetDate || undefined,
      assumedReturnPercent: assumedReturn ? Number(assumedReturn) : undefined,
      note: note.trim() || undefined,
    };
    if (existing) updateGoal(existing.id, payload);
    else addGoal(payload);
    onDone();
  }

  return (
    <div className="space-y-4">
      <Field label="What are you saving for?">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Retirement corpus, House down payment"
        />
      </Field>

      <Field label="Target amount (₹)">
        <input
          className={inputClass}
          type="number"
          inputMode="decimal"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="10000000"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Target date (optional)">
          <input
            className={inputClass}
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </Field>
        <Field label="Assumed return % / yr">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={assumedReturn}
            onChange={(e) => setAssumedReturn(e.target.value)}
            placeholder={String(DEFAULT_ASSUMED_RETURN)}
          />
        </Field>
      </div>

      <Field label="Note (optional)">
        <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      <p className="text-xs text-muted">
        Progress is measured against your total net worth. The assumed return is only used to work out the
        monthly figure — it&apos;s your estimate, not a forecast, and markets won&apos;t deliver it evenly.
      </p>

      <div className="flex gap-2 pt-1">
        {existing && (
          <button
            onClick={() => {
              if (confirm(`Delete the goal "${existing.name}"?`)) {
                deleteGoal(existing.id);
                onDone();
              }
            }}
            className="flex items-center justify-center rounded-xl border border-negative/30 px-4 py-3 text-negative"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button
          disabled={!valid}
          onClick={handleSave}
          className="flex-1 rounded-xl bg-primary py-3 font-medium text-primary-ink disabled:opacity-40"
        >
          {existing ? "Save changes" : "Create goal"}
        </button>
      </div>
    </div>
  );
}
