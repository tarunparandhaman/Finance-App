"use client";

import type { Liability } from "@/lib/types";
import { LIABILITY_TYPE_LABELS } from "@/lib/valuation";
import { formatINR } from "@/lib/format";
import { ChevronRight } from "lucide-react";

export default function LiabilityCard({
  liability,
  onClick,
}: {
  liability: Liability;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-left"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{liability.name}</div>
        <div className="truncate text-xs text-muted">
          {LIABILITY_TYPE_LABELS[liability.type]} · As of {liability.asOfDate}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="font-semibold text-negative">{formatINR(liability.currentBalance)}</div>
        <ChevronRight size={18} className="text-muted" />
      </div>
    </button>
  );
}
