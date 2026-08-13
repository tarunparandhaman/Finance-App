"use client";

import { useState } from "react";
import Field, { inputClass } from "@/components/Field";
import Autocomplete, { AutocompleteOption } from "@/components/Autocomplete";
import { useFinanceStore } from "@/lib/store";
import type { StockHolding } from "@/lib/types";
import { Trash2 } from "lucide-react";

export default function StockForm({
  category,
  existing,
  onDone,
}: {
  category: "IN_STOCK" | "US_STOCK";
  existing?: StockHolding;
  onDone: () => void;
}) {
  const addHolding = useFinanceStore((s) => s.addHolding);
  const updateHolding = useFinanceStore((s) => s.updateHolding);
  const deleteHolding = useFinanceStore((s) => s.deleteHolding);

  const [symbol, setSymbol] = useState(existing?.symbol ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [quantity, setQuantity] = useState(existing?.quantity?.toString() ?? "");
  const [avgPrice, setAvgPrice] = useState(existing?.avgPrice?.toString() ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const currency = category === "US_STOCK" ? "USD" : "INR";

  async function search(query: string): Promise<AutocompleteOption[]> {
    const res = await fetch(`/api/stock-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const results: { symbol: string; name: string; exchange?: string }[] = data.results ?? [];
    const filtered = results.filter((r) =>
      category === "IN_STOCK"
        ? r.symbol.endsWith(".NS") || r.symbol.endsWith(".BO")
        : !r.symbol.includes(".")
    );
    return filtered.map((r) => ({ key: r.symbol, label: r.name, sublabel: `${r.symbol} · ${r.exchange ?? ""}` }));
  }

  function handleSelect(opt: AutocompleteOption) {
    setSymbol(opt.key);
    setName(opt.label);
  }

  const valid = symbol.trim() && name.trim() && Number(quantity) > 0 && Number(avgPrice) >= 0;

  function handleSave() {
    const payload = {
      category,
      symbol: symbol.trim(),
      name: name.trim(),
      quantity: Number(quantity),
      avgPrice: Number(avgPrice),
      currency: currency as "INR" | "USD",
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
      {!existing && (
        <Field label="Search symbol or company">
          <Autocomplete
            placeholder={category === "IN_STOCK" ? "e.g. Reliance, TCS, Infosys" : "e.g. Apple, Microsoft"}
            onSearch={search}
            onSelect={handleSelect}
          />
        </Field>
      )}
      {symbol && (
        <div className="rounded-lg bg-background px-3 py-2 text-sm">
          <span className="font-medium">{symbol}</span>
          <span className="text-muted"> · {name}</span>
        </div>
      )}
      {existing && (
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity (shares)">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label={`Avg buy price (${currency === "USD" ? "$" : "₹"})`}>
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={avgPrice}
            onChange={(e) => setAvgPrice(e.target.value)}
            placeholder="0.00"
          />
        </Field>
      </div>
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
          {existing ? "Save changes" : "Add holding"}
        </button>
      </div>
    </div>
  );
}
