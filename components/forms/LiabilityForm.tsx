"use client";

import { useState } from "react";
import Field, { inputClass } from "@/components/Field";
import { useFinanceStore } from "@/lib/store";
import type { Liability, LiabilityType } from "@/lib/types";
import { LIABILITY_TYPE_LABELS } from "@/lib/valuation";
import { Trash2 } from "lucide-react";

const TYPES: { value: LiabilityType; label: string }[] = (
  Object.keys(LIABILITY_TYPE_LABELS) as LiabilityType[]
).map((value) => ({ value, label: LIABILITY_TYPE_LABELS[value] }));

export default function LiabilityForm({
  existing,
  onDone,
}: {
  existing?: Liability;
  onDone: () => void;
}) {
  const addLiability = useFinanceStore((s) => s.addLiability);
  const updateLiability = useFinanceStore((s) => s.updateLiability);
  const deleteLiability = useFinanceStore((s) => s.deleteLiability);

  const [type, setType] = useState<LiabilityType>(existing?.type ?? "HOME_LOAN");
  const [name, setName] = useState(existing?.name ?? "");
  const [currentBalance, setCurrentBalance] = useState(existing?.currentBalance?.toString() ?? "");
  const [interestRate, setInterestRate] = useState(existing?.interestRate?.toString() ?? "");
  const [asOfDate, setAsOfDate] = useState(existing?.asOfDate ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const valid = name.trim() && Number(currentBalance) >= 0 && asOfDate;

  function handleSave() {
    const payload = {
      type,
      name: name.trim(),
      currentBalance: Number(currentBalance),
      currency: "INR" as const,
      interestRate: interestRate ? Number(interestRate) : undefined,
      asOfDate,
      notes: notes.trim() || undefined,
    };
    if (existing) {
      updateLiability(existing.id, payload);
    } else {
      addLiability(payload);
    }
    onDone();
  }

  return (
    <div className="space-y-4">
      <Field label="Type">
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as LiabilityType)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Name">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. HDFC Home Loan"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Outstanding balance (₹)">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Interest rate % (optional)">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>
      <Field label="Balance as of">
        <input className={inputClass} type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
      </Field>
      <Field label="Notes (optional)">
        <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="flex gap-2 pt-2">
        {existing && (
          <button
            onClick={() => {
              if (confirm(`Delete ${existing.name}?`)) {
                deleteLiability(existing.id);
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
          {existing ? "Save changes" : "Add liability"}
        </button>
      </div>
    </div>
  );
}
