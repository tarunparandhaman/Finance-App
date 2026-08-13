"use client";

import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { tradeLabel, type TradeableHolding } from "@/lib/trades";
import type { Trade } from "@/lib/types";

interface Row {
  trade: Trade;
  holding: TradeableHolding;
}

function monthHeading(date: string): string {
  const [y, m] = date.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function TransactionList({
  holdings,
  onSelectHolding,
}: {
  holdings: TradeableHolding[];
  onSelectHolding: (holdingId: string) => void;
}) {
  // Flatten every holding's trades into one newest-first feed, grouped by month.
  const groups = useMemo(() => {
    const rows: Row[] = holdings.flatMap((h) => h.trades.map((trade) => ({ trade, holding: h })));
    rows.sort(
      (a, b) =>
        b.trade.date.localeCompare(a.trade.date) || b.trade.createdAt.localeCompare(a.trade.createdAt)
    );

    const byMonth = new Map<string, Row[]>();
    for (const row of rows) {
      const key = row.trade.date.slice(0, 7);
      const bucket = byMonth.get(key);
      if (bucket) bucket.push(row);
      else byMonth.set(key, [row]);
    }
    return [...byMonth.entries()];
  }, [holdings]);

  if (groups.length === 0) {
    return (
      <div className="card border-dashed p-8 text-center text-sm text-muted">
        No transactions yet in this category.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(([month, rows]) => {
        const invested = rows.reduce(
          (sum, r) => sum + (r.trade.type === "BUY" ? r.trade.quantity * r.trade.price : 0),
          0
        );
        return (
          <div key={month}>
            <div className="mb-1.5 flex items-baseline justify-between px-1">
              <h3 className="text-xs font-medium text-muted">{monthHeading(`${month}-01`)}</h3>
              <span className="text-[11px] text-muted tabular-nums">
                {rows.length} {rows.length === 1 ? "transaction" : "transactions"}
                {invested > 0 && ` · invested ${formatNumber(invested, 0)}`}
              </span>
            </div>
            <div className="card overflow-hidden">
              {rows.map(({ trade, holding }, i) => {
                const { unit } = tradeLabel(holding);
                const symbol = holding.category === "US_STOCK" ? "$" : "₹";
                return (
                  <button
                    key={trade.id}
                    onClick={() => onSelectHolding(holding.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        trade.type === "BUY" ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
                      }`}
                    >
                      {trade.type === "BUY" ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{holding.name}</div>
                      <div className="truncate text-xs text-muted">
                        {trade.type === "BUY" ? "Bought" : "Sold"} {formatNumber(trade.quantity, 4)} {unit} ·{" "}
                        {trade.date}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums">
                        {symbol}
                        {formatNumber(trade.quantity * trade.price, 0)}
                      </div>
                      <div className="text-[11px] text-muted tabular-nums">
                        @ {symbol}
                        {formatNumber(trade.price)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
