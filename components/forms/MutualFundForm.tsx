"use client";

import { useMemo, useState } from "react";
import Field, { inputClass } from "@/components/Field";
import Autocomplete, { AutocompleteOption } from "@/components/Autocomplete";
import { useFinanceStore } from "@/lib/store";
import { refreshAllPrices } from "@/lib/pricing";
import { formatNumber } from "@/lib/format";
import type { MutualFundHolding } from "@/lib/types";
import { Info } from "lucide-react";

export default function MutualFundForm({ onDone }: { onDone: () => void }) {
  const holdings = useFinanceStore((s) => s.holdings);
  const addHolding = useFinanceStore((s) => s.addHolding);
  const addTrade = useFinanceStore((s) => s.addTrade);

  const [schemeCode, setSchemeCode] = useState("");
  const [schemeName, setSchemeName] = useState("");
  const [units, setUnits] = useState("");
  const [nav, setNav] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const existingMatch = useMemo(() => {
    if (!schemeCode) return undefined;
    return holdings.find(
      (h): h is MutualFundHolding => h.category === "MUTUAL_FUND" && h.schemeCode === schemeCode
    );
  }, [schemeCode, holdings]);

  async function search(query: string): Promise<AutocompleteOption[]> {
    const res = await fetch(`/api/mf-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const results: { schemeCode: string; schemeName: string }[] = data.results ?? [];
    return results.map((r) => ({ key: r.schemeCode, label: r.schemeName }));
  }

  const valid = schemeCode.trim() && schemeName.trim() && Number(units) > 0 && Number(nav) >= 0 && date;

  function handleSave() {
    const trade = {
      type: "BUY" as const,
      quantity: Number(units),
      price: Number(nav),
      date,
      note: note.trim() || undefined,
    };

    if (existingMatch) {
      addTrade(existingMatch.id, trade);
    } else {
      addHolding({
        category: "MUTUAL_FUND",
        schemeCode: schemeCode.trim(),
        schemeName: schemeName.trim(),
        name: schemeName.trim(),
        units: trade.quantity,
        avgNav: trade.price,
        trades: [trade],
      });
    }
    refreshAllPrices().catch(() => {});
    onDone();
  }

  return (
    <div className="space-y-4">
      <Field label="Search mutual fund scheme">
        <Autocomplete
          placeholder="e.g. Axis Bluechip, HDFC Flexicap"
          onSearch={search}
          onSelect={(opt) => {
            setSchemeCode(opt.key);
            setSchemeName(opt.label);
          }}
        />
      </Field>

      {schemeName && <div className="rounded-lg bg-surface-alt px-3 py-2 text-sm font-medium">{schemeName}</div>}

      {existingMatch && (
        <div className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            You already hold {formatNumber(existingMatch.units, 3)} units at an average NAV of ₹
            {formatNumber(existingMatch.avgNav)}. This purchase gets added to that position and shows up in its
            transaction history.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Units bought">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Buy NAV (₹)">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={nav}
            onChange={(e) => setNav(e.target.value)}
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
          placeholder="e.g. Monthly SIP"
        />
      </Field>

      <p className="text-xs text-muted">
        The latest NAV updates automatically. Units and buy NAV are yours to enter — no public source knows what
        you personally paid.
      </p>

      <button
        disabled={!valid}
        onClick={handleSave}
        className="w-full rounded-xl bg-primary py-3 font-medium text-primary-ink disabled:opacity-40"
      >
        {existingMatch ? "Add purchase" : "Add fund"}
      </button>
    </div>
  );
}
