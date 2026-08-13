"use client";

import { useMemo, useState } from "react";
import Field, { inputClass } from "@/components/Field";
import Autocomplete, { AutocompleteOption } from "@/components/Autocomplete";
import { useFinanceStore } from "@/lib/store";
import { refreshAllPrices } from "@/lib/pricing";
import { formatNumber } from "@/lib/format";
import type { StockHolding } from "@/lib/types";
import { baseSymbol, preferredSymbol } from "@/lib/stocks";
import { Info } from "lucide-react";

export default function StockForm({
  category,
  onDone,
}: {
  category: "IN_STOCK" | "US_STOCK";
  onDone: () => void;
}) {
  const holdings = useFinanceStore((s) => s.holdings);
  const addHolding = useFinanceStore((s) => s.addHolding);
  const updateHolding = useFinanceStore((s) => s.updateHolding);
  const addTrade = useFinanceStore((s) => s.addTrade);

  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const currency = category === "US_STOCK" ? "USD" : "INR";
  const symbolPrefix = currency === "USD" ? "$" : "₹";

  // If this symbol is already held, the buy is recorded against that position
  // rather than creating a duplicate row.
  const existingMatch = useMemo(() => {
    if (!symbol) return undefined;
    return holdings.find(
      (h): h is StockHolding =>
        (h.category === "IN_STOCK" || h.category === "US_STOCK") &&
        h.category === category &&
        baseSymbol(h.symbol) === baseSymbol(symbol)
    );
  }, [symbol, category, holdings]);

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
    // one row per company, preferring NSE, so the same stock can't be added
    // under two different symbols.
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

  const valid = symbol.trim() && name.trim() && Number(quantity) > 0 && Number(price) >= 0 && date;

  function handleSave() {
    const trade = {
      type: "BUY" as const,
      quantity: Number(quantity),
      price: Number(price),
      date,
      note: note.trim() || undefined,
    };

    if (existingMatch) {
      updateHolding(existingMatch.id, {
        symbol: preferredSymbol(existingMatch.symbol, symbol.trim()),
      });
      addTrade(existingMatch.id, trade);
    } else {
      addHolding({
        category,
        symbol: symbol.trim(),
        name: name.trim(),
        quantity: trade.quantity,
        avgPrice: trade.price,
        currency: currency as "INR" | "USD",
        trades: [trade],
      });
    }
    refreshAllPrices().catch(() => {});
    onDone();
  }

  return (
    <div className="space-y-4">
      <Field label="Search symbol or company">
        <Autocomplete
          placeholder={category === "IN_STOCK" ? "e.g. Reliance, TCS, Infosys" : "e.g. Apple, Microsoft"}
          onSearch={search}
          onSelect={(opt) => {
            setSymbol(opt.key);
            setName(opt.label);
          }}
        />
      </Field>

      {symbol && (
        <div className="rounded-lg bg-surface-alt px-3 py-2 text-sm">
          <span className="font-medium">{symbol}</span>
          <span className="text-muted"> · {name}</span>
        </div>
      )}

      {existingMatch && (
        <div className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            You already hold {formatNumber(existingMatch.quantity, 4)} shares at an average of {symbolPrefix}
            {formatNumber(existingMatch.avgPrice)}. This buy gets added to that position and shows up in its
            transaction history.
          </span>
        </div>
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
        <Field label={`Buy price (${symbolPrefix})`}>
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

      <Field label="Purchase date">
        <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <Field label="Note (optional)">
        <input
          className={inputClass}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. SIP instalment, bonus allotment"
        />
      </Field>

      <p className="text-xs text-muted">
        The current market price updates automatically. Quantity and buy price are yours to enter — no public
        source knows what you personally paid.
      </p>

      <button
        disabled={!valid}
        onClick={handleSave}
        className="w-full rounded-xl bg-primary py-3 font-medium text-white disabled:opacity-40"
      >
        {existingMatch ? "Add buy transaction" : "Add holding"}
      </button>
    </div>
  );
}
