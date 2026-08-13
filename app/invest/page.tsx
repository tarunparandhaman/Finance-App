"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import SegmentedControl from "@/components/SegmentedControl";
import Sheet from "@/components/Sheet";
import HoldingCard from "@/components/HoldingCard";
import HoldingDetail from "@/components/HoldingDetail";
import TransactionList from "@/components/TransactionList";
import RefreshButton from "@/components/RefreshButton";
import FloatingActionButton from "@/components/FloatingActionButton";
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
      wide
    >
      <div className="space-y-4">
        <div className="md:flex md:items-center md:justify-between md:gap-4">
          <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />
          <div className="mt-2 md:mt-0 md:w-64">
            <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} />
          </div>
        </div>

        {view === "HOLDINGS" ? (
          filtered.length === 0 ? (
            <div className="card border-dashed p-8 text-center text-sm text-muted">
              No holdings yet in this category. Tap + to add your first one.
            </div>
          ) : (
            <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
              {filtered.map((h) => (
                <HoldingCard key={h.id} holding={h} onClick={() => setDetailId(h.id)} />
              ))}
            </div>
          )
        ) : (
          <TransactionList holdings={filtered} onSelectHolding={setDetailId} />
        )}
      </div>

      <FloatingActionButton onClick={() => setAddOpen(true)} label="Add holding" wide />

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
