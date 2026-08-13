"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowDownLeft, ArrowUpRight, Pencil } from "lucide-react";
import Sheet from "@/components/Sheet";
import TradeForm from "@/components/forms/TradeForm";
import { useFinanceStore } from "@/lib/store";
import { valueHolding } from "@/lib/valuation";
import { formatINR, formatNumber, formatPercent, timeAgo } from "@/lib/format";
import { sortTrades, tradeLabel, type TradeableHolding } from "@/lib/trades";
import type { Trade } from "@/lib/types";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="rounded-xl bg-surface-alt px-3 py-2.5">
      <div className="text-[11px] text-muted">{label}</div>
      <div
        className={`text-sm font-semibold tabular-nums ${
          tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function HoldingDetail({ holding, onClose }: { holding: TradeableHolding; onClose: () => void }) {
  const usdInr = useFinanceStore((s) => s.fxRate?.usdInr ?? 87);
  const deleteHolding = useFinanceStore((s) => s.deleteHolding);
  const [tradeSheetOpen, setTradeSheetOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const v = valueHolding(holding, usdInr);
  const { unit, priceLabel } = tradeLabel(holding);
  const symbol = holding.category === "US_STOCK" ? "$" : "₹";
  const quantity = holding.category === "MUTUAL_FUND" ? holding.units : holding.quantity;
  const avgPrice = holding.category === "MUTUAL_FUND" ? holding.avgNav : holding.avgPrice;
  const currentPrice =
    holding.category === "MUTUAL_FUND" ? (holding.currentNav ?? holding.avgNav) : (holding.currentPrice ?? holding.avgPrice);
  const trades = sortTrades(holding.trades);

  return (
    <>
      <div className="space-y-5">
        <div>
          <div className="text-xs text-muted">
            {holding.category === "MUTUAL_FUND" ? holding.schemeCode : holding.symbol}
            {holding.lastFetched && ` · updated ${timeAgo(holding.lastFetched)}`}
          </div>
          <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
            {formatINR(v.currentValueInr)}
          </div>
          <div
            className={`mt-0.5 text-sm font-medium tabular-nums ${
              v.gainInr >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            {v.gainInr >= 0 ? "+" : ""}
            {formatINR(v.gainInr)} ({formatPercent(v.gainPercent)})
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat label={`Quantity (${unit})`} value={formatNumber(quantity, 4)} />
          <Stat label={`Invested`} value={formatINR(v.costValueInr)} />
          <Stat label={`Avg ${priceLabel}`} value={`${symbol}${formatNumber(avgPrice)}`} />
          <Stat
            label={`Current ${priceLabel}`}
            value={`${symbol}${formatNumber(currentPrice)}`}
            tone={currentPrice >= avgPrice ? "positive" : "negative"}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Transactions</h3>
            <button
              onClick={() => {
                setEditingTrade(null);
                setTradeSheetOpen(true);
              }}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
            >
              <Plus size={13} /> Add
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            {trades.map((t, i) => (
              <button
                key={t.id}
                onClick={() => {
                  setEditingTrade(t);
                  setTradeSheetOpen(true);
                }}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    t.type === "BUY" ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
                  }`}
                >
                  {t.type === "BUY" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {t.type === "BUY" ? "Bought" : "Sold"} {formatNumber(t.quantity, 4)} {unit}
                  </div>
                  <div className="truncate text-xs text-muted">
                    {t.date} · {symbol}
                    {formatNumber(t.price)} / {unit.replace(/s$/, "")}
                    {t.note ? ` · ${t.note}` : ""}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold tabular-nums">
                    {symbol}
                    {formatNumber(t.quantity * t.price, 0)}
                  </div>
                  <Pencil size={12} className="ml-auto mt-0.5 text-muted" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm(`Delete ${holding.name} and all its transactions?`)) {
              deleteHolding(holding.id);
              onClose();
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-negative/30 py-2.5 text-sm font-medium text-negative"
        >
          <Trash2 size={15} /> Delete holding
        </button>
      </div>

      <Sheet
        open={tradeSheetOpen}
        onClose={() => setTradeSheetOpen(false)}
        title={editingTrade ? "Edit transaction" : "Add transaction"}
      >
        <TradeForm
          holding={holding}
          existing={editingTrade ?? undefined}
          onDone={() => setTradeSheetOpen(false)}
        />
      </Sheet>
    </>
  );
}
