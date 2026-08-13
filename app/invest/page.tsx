"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import PageShell from "@/components/PageShell";
import SegmentedControl from "@/components/SegmentedControl";
import Sheet from "@/components/Sheet";
import HoldingCard from "@/components/HoldingCard";
import HoldingDetail from "@/components/HoldingDetail";
import TransactionList from "@/components/TransactionList";
import RefreshButton from "@/components/RefreshButton";
import StockForm from "@/components/forms/StockForm";
import MutualFundForm from "@/components/forms/MutualFundForm";
import { useFinanceStore } from "@/lib/store";
import { valueHolding } from "@/lib/valuation";
import { formatINR, formatPercent } from "@/lib/format";
import { isTradeable, type TradeableHolding } from "@/lib/trades";

type InvestTab = "IN_STOCK" | "US_STOCK" | "MUTUAL_FUND";
type View = "HOLDINGS" | "TRANSACTIONS";

const TAB_OPTIONS: { value: InvestTab; label: string }[] = [
  { value: "IN_STOCK", label: "India" },
  { value: "US_STOCK", label: "US" },
  { value: "MUTUAL_FUND", label: "Mutual Funds" },
];

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "HOLDINGS", label: "Holdings" },
  { value: "TRANSACTIONS", label: "Transactions" },
];

function InvestPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as InvestTab) || "IN_STOCK";
  const [tab, setTab] = useState<InvestTab>(initialTab);
  const [view, setView] = useState<View>("HOLDINGS");
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const holdings = useFinanceStore((s) => s.holdings);
  const usdInr = useFinanceStore((s) => s.fxRate?.usdInr ?? 87);

  const filtered = useMemo(
    () => holdings.filter((h): h is TradeableHolding => h.category === tab && isTradeable(h)),
    [holdings, tab]
  );

  const { value, invested } = useMemo(() => {
    let value = 0;
    let invested = 0;
    for (const h of filtered) {
      const v = valueHolding(h, usdInr);
      value += v.currentValueInr;
      invested += v.costValueInr;
    }
    return { value, invested };
  }, [filtered, usdInr]);

  const gain = value - invested;
  const gainPercent = invested > 0 ? (gain / invested) * 100 : 0;

  // Kept in the store rather than local state so edits inside the detail sheet
  // (adding a trade, selling out) are reflected live.
  const detailHolding = useMemo(
    () => filtered.find((h) => h.id === detailId) ?? null,
    [filtered, detailId]
  );

  return (
    <PageShell
      title="Invest"
      subtitle={
        filtered.length > 0
          ? `${formatINR(value)} · ${gain >= 0 ? "+" : ""}${formatINR(gain)} (${formatPercent(gainPercent)})`
          : undefined
      }
      action={<RefreshButton />}
    >
      <div className="space-y-4">
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />
        <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} />

        {view === "HOLDINGS" ? (
          filtered.length === 0 ? (
            <div className="card border-dashed p-8 text-center text-sm text-muted">
              No holdings yet in this category. Tap + to add your first one.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((h) => (
                <HoldingCard key={h.id} holding={h} onClick={() => setDetailId(h.id)} />
              ))}
            </div>
          )
        ) : (
          <TransactionList holdings={filtered} onSelectHolding={setDetailId} />
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center">
        <div className="flex w-full max-w-md justify-end px-5">
          <button
            onClick={() => setAddOpen(true)}
            aria-label="Add holding"
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg"
          >
            <Plus size={26} />
          </button>
        </div>
      </div>

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={tab === "MUTUAL_FUND" ? "Add mutual fund" : tab === "US_STOCK" ? "Add US stock" : "Add Indian stock"}
      >
        {tab === "MUTUAL_FUND" ? (
          <MutualFundForm onDone={() => setAddOpen(false)} />
        ) : (
          <StockForm category={tab} onDone={() => setAddOpen(false)} />
        )}
      </Sheet>

      <Sheet
        open={detailHolding !== null}
        onClose={() => setDetailId(null)}
        title={detailHolding?.name ?? ""}
      >
        {detailHolding && <HoldingDetail holding={detailHolding} onClose={() => setDetailId(null)} />}
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
