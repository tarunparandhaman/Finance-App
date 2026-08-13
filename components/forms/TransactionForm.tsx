"use client";

import { useState } from "react";
import Field, { inputClass } from "@/components/Field";
import { useFinanceStore } from "@/lib/store";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, INVESTMENT_CATEGORY } from "@/lib/types";
import type { Transaction, TransactionType } from "@/lib/types";
import { Trash2 } from "lucide-react";

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
  { value: "INVESTMENT", label: "Investment" },
];

function categoriesFor(type: TransactionType): readonly string[] {
  if (type === "EXPENSE") return EXPENSE_CATEGORIES;
  if (type === "INCOME") return INCOME_CATEGORIES;
  return [INVESTMENT_CATEGORY];
}

export default function TransactionForm({
  existing,
  onDone,
}: {
  existing?: Transaction;
  onDone: () => void;
}) {
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);

  const [type, setType] = useState<TransactionType>(existing?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(existing?.amount?.toString() ?? "");
  const [category, setCategory] = useState(existing?.category ?? categoriesFor(existing?.type ?? "EXPENSE")[0]);
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(existing?.note ?? "");
  const [recurring, setRecurring] = useState(existing?.recurring ?? false);

  const valid = Number(amount) > 0 && category && date;

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setCategory(categoriesFor(t)[0]);
  }

  function handleSave() {
    const payload = {
      type,
      amount: Number(amount),
      category,
      date,
      note: note.trim() || undefined,
      recurring: type === "EXPENSE" ? recurring : undefined,
    };
    if (existing) {
      updateTransaction(existing.id, payload);
    } else {
      addTransaction(payload);
    }
    onDone();
  }

  return (
    <div className="space-y-4">
      <Field label="Type">
        <div className="flex gap-1 rounded-xl bg-background p-1">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                type === t.value ? "bg-surface text-primary shadow-sm" : "text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Date">
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      {type !== "INVESTMENT" && (
        <Field label="Category">
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categoriesFor(type).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Note (optional)">
        <input
          className={inputClass}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. BigBasket groceries"
        />
      </Field>
      {type === "EXPENSE" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          This is a recurring monthly expense
        </label>
      )}

      <div className="flex gap-2 pt-2">
        {existing && (
          <button
            onClick={() => {
              if (confirm("Delete this transaction?")) {
                deleteTransaction(existing.id);
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
          {existing ? "Save changes" : "Add transaction"}
        </button>
      </div>
    </div>
  );
}
