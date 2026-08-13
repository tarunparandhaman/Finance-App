"use client";

import { useState } from "react";
import Field, { inputClass } from "@/components/Field";
import { useFinanceStore } from "@/lib/store";
import type { OtherHolding, OtherSubType } from "@/lib/types";
import { Trash2 } from "lucide-react";

const SUB_TYPES: { value: OtherSubType; label: string }[] = [
  { value: "FD", label: "Fixed Deposit" },
  { value: "GOLD", label: "Gold" },
  { value: "CASH", label: "Cash / Bank" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "OTHER", label: "Other" },
];

export default function OtherForm({
  existing,
  onDone,
}: {
  existing?: OtherHolding;
  onDone: () => void;
}) {
  const addHolding = useFinanceStore((s) => s.addHolding);
  const updateHolding = useFinanceStore((s) => s.updateHolding);
  const deleteHolding = useFinanceStore((s) => s.deleteHolding);

  const [name, setName] = useState(existing?.name ?? "");
  const [subType, setSubType] = useState<OtherSubType>(existing?.subType ?? "FD");
  const [currentValue, setCurrentValue] = useState(existing?.currentValue?.toString() ?? "");
  const [currency, setCurrency] = useState<"INR" | "USD">(existing?.currency ?? "INR");
  const [asOfDate, setAsOfDate] = useState(existing?.asOfDate ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const valid = name.trim() && Number(currentValue) >= 0 && asOfDate;

  function handleSave() {
    const payload = {
      category: "OTHER" as const,
      name: name.trim(),
      subType,
      currentValue: Number(currentValue),
      currency,
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
      <Field label="Name">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. SBI Fixed Deposit"
        />
      </Field>
      <Field label="Type">
        <select className={inputClass} value={subType} onChange={(e) => setSubType(e.target.value as OtherSubType)}>
          {SUB_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Current value">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Currency">
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value as "INR" | "USD")}>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>
        </Field>
      </div>
      <Field label="Value as of">
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
          className="flex-1 rounded-lg bg-primary py-2.5 font-medium text-white disabled:opacity-40"
        >
          {existing ? "Save changes" : "Add asset"}
        </button>
      </div>
    </div>
  );
}
