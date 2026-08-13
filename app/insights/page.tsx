"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import SegmentedControl from "@/components/SegmentedControl";
import CashflowTab from "@/components/insights/CashflowTab";
import AllocationTab from "@/components/insights/AllocationTab";
import HistoryTab from "@/components/insights/HistoryTab";

type InsightsTab = "CASHFLOW" | "ALLOCATION" | "HISTORY";

const TAB_OPTIONS: { value: InsightsTab; label: string }[] = [
  { value: "CASHFLOW", label: "Cashflow" },
  { value: "ALLOCATION", label: "Allocation" },
  { value: "HISTORY", label: "History" },
];

function InsightsPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as InsightsTab) || "CASHFLOW";
  const [tab, setTab] = useState<InsightsTab>(initialTab);

  return (
    <PageShell title="Insights" wide>
      <div className="space-y-4">
        <div className="md:max-w-xs">
          <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />
        </div>
        {tab === "CASHFLOW" && <CashflowTab />}
        {tab === "ALLOCATION" && <AllocationTab />}
        {tab === "HISTORY" && <HistoryTab />}
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
