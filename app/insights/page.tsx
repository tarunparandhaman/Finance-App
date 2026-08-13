"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import CashflowTab from "@/components/insights/CashflowTab";
import AllocationTab from "@/components/insights/AllocationTab";
import HistoryTab from "@/components/insights/HistoryTab";
import GoalsTab from "@/components/insights/GoalsTab";
import TaxTab from "@/components/insights/TaxTab";

type InsightsTab = "CASHFLOW" | "ALLOCATION" | "HISTORY" | "GOALS" | "TAX";

const TABS: { value: InsightsTab; label: string }[] = [
  { value: "CASHFLOW", label: "Cashflow" },
  { value: "ALLOCATION", label: "Allocation" },
  { value: "HISTORY", label: "History" },
  { value: "GOALS", label: "Goals" },
  { value: "TAX", label: "Capital gains" },
];

function InsightsPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as InsightsTab) || "CASHFLOW";
  const [tab, setTab] = useState<InsightsTab>(initialTab);

  return (
    <PageShell title="Insights" wide>
      <div className="space-y-4">
        {/* Five tabs won't fit at 375px, so the bar scrolls rather than squashing. */}
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex min-w-max gap-1 rounded-xl border border-border bg-background p-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                  tab === t.value ? "bg-surface text-primary shadow-sm" : "text-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "CASHFLOW" && <CashflowTab />}
        {tab === "ALLOCATION" && <AllocationTab />}
        {tab === "HISTORY" && <HistoryTab />}
        {tab === "GOALS" && <GoalsTab />}
        {tab === "TAX" && <TaxTab />}
      </div>
    </PageShell>
  );
}

export default function InsightsPage() {
  return (
    <Suspense>
      <InsightsPageInner />
    </Suspense>
  );
}
