"use client";

import { useMemo, useState } from "react";
import Field, { inputClass } from "@/components/Field";
import Autocomplete, { AutocompleteOption } from "@/components/Autocomplete";
import { useFinanceStore } from "@/lib/store";
import { refreshAllPrices } from "@/lib/pricing";
import { formatNumber } from "@/lib/format";
import type { MutualFundHolding } from "@/lib/types";
import { Trash2, Info } from "lucide-react";

export default function MutualFundForm({
  existing,
  onDone,
}: {
  existing?: MutualFundHolding;
  onDone: () => void;
}) {
  const holdings = useFinanceStore((s) => s.holdings);
  const addHolding = useFinanceStore((s) => s.addHolding);
  const updateHolding = useFinanceStore((s) => s.updateHolding);
  const deleteHolding = useFinanceStore((s) => s.deleteHolding);

  const [schemeCode, setSchemeCode] = useState(existing?.schemeCode ?? "");
  const [schemeName, setSchemeName] = useState(existing?.schemeName ?? "");
  const [units, setUnits] = useState(existing?.units?.toString() ?? "");
  const [avgNav, setAvgNav] = useState(existing?.avgNav?.toString() ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const existingMatch = useMemo(() => {
    if (existing || !schemeCode) return undefined;
    return holdings.find(
      (h): h is MutualFundHolding => h.category === "MUTUAL_FUND" && h.schemeCode === schemeCode
    );
  }, [existing, schemeCode, holdings]);

  async function search(query: string): Promise<AutocompleteOption[]> {
    const res = await fetch(`/api/mf-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const results: { schemeCode: string; schemeName: string }[] = data.results ?? [];
    return results.map((r) => ({ key: r.schemeCode, label: r.schemeName }));
  }

  function handleSelect(opt: AutocompleteOption) {
    setSchemeCode(opt.key);
    setSchemeName(opt.label);
  }

  const valid = schemeCode.trim() && schemeName.trim() && Number(units) > 0 && Number(avgNav) >= 0;

  function handleSave() {
    const enteredUnits = Number(units);
    const enteredAvgNav = Number(avgNav);
    const payload = {
      category: "MUTUAL_FUND" as const,
      schemeCode: schemeCode.trim(),
      schemeName: schemeName.trim(),
      name: schemeName.trim(),
      units: enteredUnits,
      avgNav: enteredAvgNav,
      notes: notes.trim() || undefined,
    };

    if (existing) {
      updateHolding(existing.id, payload);
    } else if (existingMatch) {
      const newUnits = existingMatch.units + enteredUnits;
      const newAvgNav = (existingMatch.units * existingMatch.avgNav + enteredUnits * enteredAvgNav) / newUnits;
      updateHolding(existingMatch.id, { units: newUnits, avgNav: newAvgNav });
    } else {
      addHolding(payload);
    }
    refreshAllPrices().catch(() => {});
    onDone();
  }

  return (
    <div className="space-y-4">
      {!existing && (
        <Field label="Search mutual fund scheme">
          <Autocomplete placeholder="e.g. Axis Bluechip, HDFC Flexicap" onSearch={search} onSelect={handleSelect} />
        </Field>
      )}
      {schemeName && (
        <div className="rounded-lg bg-background px-3 py-2 text-sm font-medium">{schemeName}</div>
      )}
      {existingMatch && (
        <div className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            You already hold {formatNumber(existingMatch.units, 3)} units at an average NAV of ₹
            {formatNumber(existingMatch.avgNav)}. This will be added to that position — not a separate row.
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Units held">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Avg buy NAV (₹)">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={avgNav}
            onChange={(e) => setAvgNav(e.target.value)}
            placeholder="0.00"
          />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <p className="text-xs text-muted">
        Current NAV updates automatically. Units &amp; buy NAV are yours to enter — no public source knows what you
        personally paid.
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
          {existing ? "Save changes" : existingMatch ? "Add to position" : "Add fund"}
        </button>
      </div>
    </div>
  );
}
