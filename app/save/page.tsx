"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import PageShell from "@/components/PageShell";
import SegmentedControl from "@/components/SegmentedControl";
import Sheet from "@/components/Sheet";
import HoldingCard from "@/components/HoldingCard";
import LiabilityCard from "@/components/LiabilityCard";
import RetirementForm from "@/components/forms/RetirementForm";
import OtherForm from "@/components/forms/OtherForm";
import LiabilityForm from "@/components/forms/LiabilityForm";
import { useFinanceStore } from "@/lib/store";
import { valueHolding, valueLiability } from "@/lib/valuation";
import { formatINR } from "@/lib/format";
import type { Holding, RetirementHolding, OtherHolding, Liability } from "@/lib/types";

type SaveTab = "PF" | "NPS" | "OTHER" | "LIABILITY";

const TAB_OPTIONS: { value: SaveTab; label: string }[] = [
  { value: "PF", label: "PF" },
  { value: "NPS", label: "NPS" },
  { value: "OTHER", label: "Other" },
  { value: "LIABILITY", label: "Debts" },
];

function SavePageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as SaveTab) || "PF";
  const [tab, setTab] = useState<SaveTab>(initialTab);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

  const holdings = useFinanceStore((s) => s.holdings);
  const liabilities = useFinanceStore((s) => s.liabilities);
  const fxRate = useFinanceStore((s) => s.fxRate);
  const usdInr = fxRate?.usdInr ?? 87;

  const filteredHoldings = useMemo(
    () => (tab === "LIABILITY" ? [] : holdings.filter((h) => h.category === tab)),
    [holdings, tab]
  );

  const subtotal = useMemo(() => {
    if (tab === "LIABILITY") return liabilities.reduce((sum, l) => sum + valueLiability(l, usdInr), 0);
    return filteredHoldings.reduce((sum, h) => sum + valueHolding(h, usdInr).currentValueInr, 0);
  }, [tab, filteredHoldings, liabilities, usdInr]);

  function openAdd() {
    setEditingHolding(null);
    setEditingLiability(null);
    setSheetOpen(true);
  }

  function openEditHolding(h: Holding) {
    setEditingHolding(h);
    setEditingLiability(null);
    setSheetOpen(true);
  }

  function openEditLiability(l: Liability) {
    setEditingLiability(l);
    setEditingHolding(null);
    setSheetOpen(true);
  }

  const isEmpty = tab === "LIABILITY" ? liabilities.length === 0 : filteredHoldings.length === 0;

  return (
    <PageShell title="Save" subtitle={formatINR(subtotal)}>
      <div className="space-y-4">
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />

        {isEmpty ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            {tab === "LIABILITY"
              ? "No loans or debts added yet."
              : `No ${tab === "OTHER" ? "other assets" : tab} accounts added yet.`}
          </div>
        ) : tab === "LIABILITY" ? (
          <div className="space-y-2">
            {liabilities.map((l) => (
              <LiabilityCard key={l.id} liability={l} onClick={() => openEditLiability(l)} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHoldings.map((h) => (
              <HoldingCard key={h.id} holding={h} onClick={() => openEditHolding(h)} />
            ))}
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center">
        <div className="flex w-full max-w-md justify-end px-5">
          <button
            onClick={openAdd}
            aria-label="Add"
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg"
          >
            <Plus size={26} />
          </button>
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={
          editingHolding || editingLiability
            ? "Edit"
            : tab === "OTHER"
              ? "Add asset"
              : tab === "LIABILITY"
                ? "Add loan / debt"
                : `Add ${tab} account`
        }
      >
        {tab === "LIABILITY" ? (
          <LiabilityForm existing={editingLiability ?? undefined} onDone={() => setSheetOpen(false)} />
        ) : tab === "OTHER" ? (
          <OtherForm existing={editingHolding as OtherHolding | undefined} onDone={() => setSheetOpen(false)} />
        ) : (
          <RetirementForm
            category={tab}
            existing={editingHolding as RetirementHolding | undefined}
            onDone={() => setSheetOpen(false)}
          />
        )}
      </Sheet>
    </PageShell>
  );
}

export default function SavePage() {
  return (
    <Suspense>
      <SavePageInner />
    </Suspense>
  );
}
