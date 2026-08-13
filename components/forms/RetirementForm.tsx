"use client";

import { useState } from "react";
import Field, { inputClass } from "@/components/Field";
import { useFinanceStore } from "@/lib/store";
import type { RetirementHolding } from "@/lib/types";
import { Trash2 } from "lucide-react";

export default function RetirementForm({
  category,
  existing,
  onDone,
}: {
  category: "PF" | "NPS";
  existing?: RetirementHolding;
  onDone: () => void;
}) {
  const addHolding = useFinanceStore((s) => s.addHolding);
  const updateHolding = useFinanceStore((s) => s.updateHolding);
  const deleteHolding = useFinanceStore((s) => s.deleteHolding);

  const [name, setName] = useState(existing?.name ?? (category === "PF" ? "EPF Account" : "NPS Account"));
  const [currentBalance, setCurrentBalance] = useState(existing?.currentBalance?.toString() ?? "");
  const [monthlyContribution, setMonthlyContribution] = useState(
    existing?.monthlyContribution?.toString() ?? ""
  );
  const [asOfDate, setAsOfDate] = useState(existing?.asOfDate ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const valid = name.trim() && Number(currentBalance) >= 0 && asOfDate;

  function handleSave() {
    const payload = {
      category,
      name: name.trim(),
      currentBalance: Number(currentBalance),
      monthlyContribution: monthlyContribution ? Number(monthlyContribution) : undefined,
      asOfDate,
      notes: notes.trim() || undefined,
    };
    if (existing) {
      updateHolding(existing.id, payload);
    } else {
      addHolding(payload);
    }
    onDone();
  }

  return (
    <div className="space-y-4">
      <Field label="Account name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Current balance (₹)">
        <input
          className={inputClass}
          type="number"
          inputMode="decimal"
          value={currentBalance}
          onChange={(e) => setCurrentBalance(e.target.value)}
          placeholder="0"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monthly contribution (optional)">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Balance as of">
          <input
            className={inputClass}
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <p className="text-xs text-muted">
        {category === "PF" ? "EPF" : "NPS"} balances aren&apos;t available via a free public API, so update this manually
        (e.g. from your passbook / statement) whenever it changes.
      </p>

      <div className="flex gap-2 pt-2">
        {existing && (
          <button
            onClick={() => {
              if (confirm(`Delete ${existing.name}?`)) {
                deleteHolding(existing.id);
                onDone();
              }
            }}
            className="flex items-center justify-center rounded-lg border border-negative/30 px-4 py-2.5 text-negative"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button
          disabled={!valid}
          onClick={handleSave}
          className="flex-1 rounded-lg bg-primary py-2.5 font-medium text-primary-ink disabled:opacity-40"
        >
          {existing ? "Save changes" : "Add account"}
        </button>
      </div>
    </div>
  );
}
