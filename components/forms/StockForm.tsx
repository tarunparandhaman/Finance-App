"use client";

import { useMemo, useState } from "react";
import Field, { inputClass } from "@/components/Field";
import Autocomplete, { AutocompleteOption } from "@/components/Autocomplete";
import { useFinanceStore } from "@/lib/store";
import { refreshAllPrices } from "@/lib/pricing";
import { formatNumber } from "@/lib/format";
import type { StockHolding } from "@/lib/types";
import { baseSymbol, preferredSymbol } from "@/lib/stocks";
import { Trash2, Info } from "lucide-react";

export default function StockForm({
  category,
  existing,
  onDone,
}: {
  category: "IN_STOCK" | "US_STOCK";
  existing?: StockHolding;
  onDone: () => void;
}) {
  const holdings = useFinanceStore((s) => s.holdings);
  const addHolding = useFinanceStore((s) => s.addHolding);
  const updateHolding = useFinanceStore((s) => s.updateHolding);
  const deleteHolding = useFinanceStore((s) => s.deleteHolding);

  const [symbol, setSymbol] = useState(existing?.symbol ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [quantity, setQuantity] = useState(existing?.quantity?.toString() ?? "");
  const [avgPrice, setAvgPrice] = useState(existing?.avgPrice?.toString() ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const currency = category === "US_STOCK" ? "USD" : "INR";

  // If adding (not editing) and this symbol is already held, saving will top
  // up that position instead of creating a duplicate row.
  const existingMatch = useMemo(() => {
    if (existing || !symbol) return undefined;
    return holdings.find(
      (h): h is StockHolding =>
        (h.category === "IN_STOCK" || h.category === "US_STOCK") &&
        h.category === category &&
        baseSymbol(h.symbol) === baseSymbol(symbol)
    );
  }, [existing, symbol, category, holdings]);

  async function search(query: string): Promise<AutocompleteOption[]> {
    const res = await fetch(`/api/stock-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const results: { symbol: string; name: string; exchange?: string }[] = data.results ?? [];
    const filtered = results.filter((r) =>
      category === "IN_STOCK"
        ? r.symbol.endsWith(".NS") || r.symbol.endsWith(".BO")
        : !r.symbol.includes(".")
    );
    // The same Indian company often appears twice (NSE + BSE listing) — keep
    // one row per company, preferring the NSE listing, so people can't
    // accidentally pick two different symbols for what they consider one stock.
    const byCompany = new Map<string, { symbol: string; name: string; exchange?: string }>();
    for (const r of filtered) {
      const dedupeKey = category === "IN_STOCK" ? baseSymbol(r.symbol) : r.symbol;
      const current = byCompany.get(dedupeKey);
      if (!current || r.symbol.endsWith(".NS")) byCompany.set(dedupeKey, r);
    }
    return [...byCompany.values()].map((r) => ({
      key: r.symbol,
      label: r.name,
      sublabel: `${r.symbol} · ${r.exchange ?? ""}`,
    }));
  }

  function handleSelect(opt: AutocompleteOption) {
    setSymbol(opt.key);
    setName(opt.label);
  }

  const valid = symbol.trim() && name.trim() && Number(quantity) > 0 && Number(avgPrice) >= 0;

  function handleSave() {
    const enteredQty = Number(quantity);
    const enteredAvgPrice = Number(avgPrice);
    const payload = {
      category,
      symbol: symbol.trim(),
      name: name.trim(),
      quantity: enteredQty,
      avgPrice: enteredAvgPrice,
      currency: currency as "INR" | "USD",
      notes: notes.trim() || undefined,
    };

    if (existing) {
      updateHolding(existing.id, payload);
    } else if (existingMatch) {
      const newQty = existingMatch.quantity + enteredQty;
      const newAvgPrice = (existingMatch.quantity * existingMatch.avgPrice + enteredQty * enteredAvgPrice) / newQty;
      updateHolding(existingMatch.id, {
        quantity: newQty,
        avgPrice: newAvgPrice,
        symbol: preferredSymbol(existingMatch.symbol, symbol.trim()),
      });
    } else {
      addHolding(payload);
    }
    refreshAllPrices().catch(() => {});
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
      {existingMatch && (
        <div className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            You already hold {formatNumber(existingMatch.quantity, 4)} shares at an average of{" "}
            {currency === "USD" ? "$" : "₹"}
            {formatNumber(existingMatch.avgPrice)}. This will be added to that position and your average price
            recalculated — not a separate row.
          </span>
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
      <p className="text-xs text-muted">
        Current price updates automatically. Quantity &amp; buy price are yours to enter — no public source knows
        what you personally paid.
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
          className="flex-1 rounded-lg bg-primary py-2.5 font-medium text-white disabled:opacity-40"
        >
          {existing ? "Save changes" : existingMatch ? "Add to position" : "Add holding"}
        </button>
      </div>
    </div>
  );
}
