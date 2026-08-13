"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import PageShell from "@/components/PageShell";
import SegmentedControl from "@/components/SegmentedControl";
import Sheet from "@/components/Sheet";
import HoldingCard from "@/components/HoldingCard";
import RefreshButton from "@/components/RefreshButton";
import StockForm from "@/components/forms/StockForm";
import MutualFundForm from "@/components/forms/MutualFundForm";
import { useFinanceStore } from "@/lib/store";
import { valueHolding } from "@/lib/valuation";
import { formatINR } from "@/lib/format";
import type { Holding, StockHolding, MutualFundHolding } from "@/lib/types";

type InvestTab = "IN_STOCK" | "US_STOCK" | "MUTUAL_FUND";

const TAB_OPTIONS: { value: InvestTab; label: string }[] = [
  { value: "IN_STOCK", label: "India" },
  { value: "US_STOCK", label: "US" },
  { value: "MUTUAL_FUND", label: "Mutual Funds" },
];

function InvestPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as InvestTab) || "IN_STOCK";
  const [tab, setTab] = useState<InvestTab>(initialTab);
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
    <PageShell title="Invest" subtitle={formatINR(subtotal)} action={<RefreshButton />}>
      <div className="space-y-4">
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No holdings yet in this category.
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
            aria-label="Add holding"
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg"
          >
            <Plus size={26} />
          </button>
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? "Edit holding" : tab === "MUTUAL_FUND" ? "Add mutual fund" : "Add stock"}
      >
        {tab === "MUTUAL_FUND" ? (
          <MutualFundForm
            existing={editing as MutualFundHolding | undefined}
            onDone={() => setSheetOpen(false)}
          />
        ) : (
          <StockForm
            category={tab}
            existing={editing as StockHolding | undefined}
            onDone={() => setSheetOpen(false)}
          />
        )}
      </Sheet>
    </PageShell>
  );
}

export default function InvestPage() {
  return (
    <Suspense>
      <InvestPageInner />
    </Suspense>
  );
}
