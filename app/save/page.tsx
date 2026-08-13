"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import PageShell from "@/components/PageShell";
import SegmentedControl from "@/components/SegmentedControl";
import Sheet from "@/components/Sheet";
import HoldingCard from "@/components/HoldingCard";
import RetirementForm from "@/components/forms/RetirementForm";
import OtherForm from "@/components/forms/OtherForm";
import { useFinanceStore } from "@/lib/store";
import { valueHolding } from "@/lib/valuation";
import { formatINR } from "@/lib/format";
import type { Holding, RetirementHolding, OtherHolding } from "@/lib/types";

type SaveTab = "PF" | "NPS" | "OTHER";

const TAB_OPTIONS: { value: SaveTab; label: string }[] = [
  { value: "PF", label: "PF" },
  { value: "NPS", label: "NPS" },
  { value: "OTHER", label: "Other" },
];

function SavePageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as SaveTab) || "PF";
  const [tab, setTab] = useState<SaveTab>(initialTab);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);

  const holdings = useFinanceStore((s) => s.holdings);
  const fxRate = useFinanceStore((s) => s.fxRate);
  const usdInr = fxRate?.usdInr ?? 87;

  const filtered = useMemo(() => holdings.filter((h) => h.category === tab), [holdings, tab]);

  const subtotal = useMemo(
    () => filtered.reduce((sum, h) => sum + valueHolding(h, usdInr).currentValueInr, 0),
    [filtered, usdInr]
  );

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(h: Holding) {
    setEditing(h);
    setSheetOpen(true);
  }

  return (
    <PageShell title="Save" subtitle={formatINR(subtotal)}>
      <div className="space-y-4">
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No {tab === "OTHER" ? "other assets" : tab} accounts added yet.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((h) => (
              <HoldingCard key={h.id} holding={h} onClick={() => openEdit(h)} />
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
        title={editing ? "Edit" : tab === "OTHER" ? "Add asset" : `Add ${tab} account`}
      >
        {tab === "OTHER" ? (
          <OtherForm existing={editing as OtherHolding | undefined} onDone={() => setSheetOpen(false)} />
        ) : (
          <RetirementForm
            category={tab}
            existing={editing as RetirementHolding | undefined}
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
