"use client";

import { useState } from "react";
import Field, { inputClass } from "@/components/Field";
import { useFinanceStore } from "@/lib/store";
import { tradeLabel, type TradeableHolding } from "@/lib/trades";
import { formatNumber } from "@/lib/format";
import type { Trade } from "@/lib/types";
import { Trash2 } from "lucide-react";

export default function TradeForm({
  holding,
  existing,
  onDone,
}: {
  holding: TradeableHolding;
  existing?: Trade;
  onDone: () => void;
}) {
  const addTrade = useFinanceStore((s) => s.addTrade);
  const updateTrade = useFinanceStore((s) => s.updateTrade);
  const deleteTrade = useFinanceStore((s) => s.deleteTrade);

  const [type, setType] = useState<Trade["type"]>(existing?.type ?? "BUY");
  const [quantity, setQuantity] = useState(existing?.quantity?.toString() ?? "");
  const [price, setPrice] = useState(existing?.price?.toString() ?? "");
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(existing?.note ?? "");

  const { unit, priceLabel } = tradeLabel(holding);
  const currencySymbol = holding.category === "US_STOCK" ? "$" : "₹";
  const heldQuantity = holding.category === "MUTUAL_FUND" ? holding.units : holding.quantity;
  // When editing, that trade's own quantity isn't part of "already sold".
  const sellableQuantity = heldQuantity + (existing?.type === "SELL" ? existing.quantity : 0);

  const enteredQty = Number(quantity);
  const oversell = type === "SELL" && enteredQty > sellableQuantity;
  const valid = enteredQty > 0 && Number(price) >= 0 && date && !oversell;

  function handleSave() {
    const payload = {
      type,
      quantity: enteredQty,
      price: Number(price),
      date,
      note: note.trim() || undefined,
    };
    if (existing) updateTrade(holding.id, existing.id, payload);
    else addTrade(holding.id, payload);
    onDone();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-border bg-background p-1">
        {(["BUY", "SELL"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-all ${
              type === t
                ? t === "BUY"
                  ? "bg-surface text-positive shadow-sm"
                  : "bg-surface text-negative shadow-sm"
                : "text-muted"
            }`}
          >
            {t === "BUY" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={`Quantity (${unit})`}>
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label={`${type === "BUY" ? "Buy" : "Sell"} ${priceLabel} (${currencySymbol})`}>
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </Field>
      </div>

      {oversell && (
        <p className="text-xs text-negative">
          You only hold {formatNumber(sellableQuantity, 4)} {unit}.
        </p>
      )}

      <Field label="Date">
        <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <Field label="Note (optional)">
        <input
          className={inputClass}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. SIP instalment"
        />
      </Field>

      <div className="flex gap-2 pt-1">
        {existing && (
          <button
            onClick={() => {
              if (confirm("Delete this transaction?")) {
                deleteTrade(holding.id, existing.id);
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
          {existing ? "Save changes" : `Add ${type === "BUY" ? "buy" : "sell"}`}
        </button>
      </div>
    </div>
  );
}
