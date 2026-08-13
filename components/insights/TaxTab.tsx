"use client";

import { useMemo, useState } from "react";
import { Info, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { formatINR, formatNumber } from "@/lib/format";
import {
  allRealisedLots,
  allUnrealisedLots,
  summariseByFinancialYear,
  estimateTax,
  currentFinancialYear,
  longTermMonths,
  TAX_RATES,
} from "@/lib/capitalGains";
import { useNow } from "@/lib/useNow";

function Row({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {hint && <div className="text-[11px] text-muted">{hint}</div>}
      </div>
      <div
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function TaxTab() {
  const holdings = useFinanceStore((s) => s.holdings);
  const usdInr = useFinanceStore((s) => s.fxRate?.usdInr ?? 87);

  const nowMs = useNow();

  const realised = useMemo(() => allRealisedLots(holdings, usdInr), [holdings, usdInr]);
  const byFy = useMemo(() => summariseByFinancialYear(realised), [realised]);
  const [selectedFy, setSelectedFy] = useState<string | null>(null);

  const unrealised = useMemo(
    () => (nowMs === 0 ? [] : allUnrealisedLots(holdings, usdInr, nowMs)),
    [holdings, usdInr, nowMs]
  );

  const activeFy = selectedFy ?? byFy[0]?.fy ?? (nowMs === 0 ? null : currentFinancialYear(nowMs));
  const summary = byFy.find((f) => f.fy === activeFy) ?? null;
  const tax = summary ? estimateTax(summary) : null;

  const maturingSoon = unrealised.filter((l) => l.term === "SHORT" && l.daysToLongTerm > 0).slice(0, 6);

  if (nowMs === 0) return null;

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-start gap-2 rounded-xl bg-surface-alt px-3 py-2.5 text-xs text-muted">
        <Info size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>
          An estimate from your own transaction log, using FIFO — the basis Indian tax law requires for
          equity. It doesn&apos;t know about carried-forward losses, other income, or anything you hold
          outside this app. Check the final numbers with a CA before you file.
        </span>
      </div>

      {realised.length === 0 ? (
        <div className="card border-dashed p-8 text-center text-sm text-muted">
          No sales recorded yet, so there are no realised gains to report. Record a sell transaction on a
          holding and it&apos;ll show up here.
        </div>
      ) : (
        <>
          {byFy.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {byFy.map((f) => (
                <button
                  key={f.fy}
                  onClick={() => setSelectedFy(f.fy)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeFy === f.fy ? "bg-primary/12 text-primary" : "text-muted hover:bg-surface-alt"
                  }`}
                >
                  FY {f.fy}
                </button>
              ))}
            </div>
          )}

          {summary && tax && (
            <div className="grid gap-4 md:grid-cols-2 md:items-start">
              <div className="card p-4 md:p-6">
                <h3 className="mb-1 text-sm font-semibold">Realised gains · FY {summary.fy}</h3>
                <div className="mb-3 text-xs text-muted">1 April – 31 March</div>

                <Row
                  label="Short-term gains"
                  hint={`Held under ${longTermMonths("IN_STOCK")} months (24 for US stocks)`}
                  value={formatINR(summary.shortTermGainInr)}
                  tone={summary.shortTermGainInr >= 0 ? "positive" : "negative"}
                />
                <Row
                  label="Long-term gains"
                  value={formatINR(summary.longTermGainInr)}
                  tone={summary.longTermGainInr >= 0 ? "positive" : "negative"}
                />
                <Row
                  label="Net realised"
                  value={formatINR(summary.shortTermGainInr + summary.longTermGainInr)}
                  tone={summary.shortTermGainInr + summary.longTermGainInr >= 0 ? "positive" : "negative"}
                />
              </div>

              <div className="card p-4 md:p-6">
                <h3 className="mb-1 text-sm font-semibold">Estimated tax</h3>
                <div className="mb-3 text-xs text-muted">FY 2026-27 rates</div>

                <Row
                  label="Equity short-term"
                  hint={`${TAX_RATES.equityShortPercent}% on ${formatINR(Math.max(0, summary.equityShortGainInr))}`}
                  value={formatINR(tax.equityShortTax)}
                />
                <Row
                  label="Equity long-term"
                  hint={`${TAX_RATES.equityLongPercent}% on ${formatINR(tax.equityLongTaxable)} after ${formatINR(
                    tax.exemptionUsed
                  )} exemption`}
                  value={formatINR(tax.equityLongTax)}
                />
                {summary.foreignLongGainInr > 0 && (
                  <Row
                    label="US stocks long-term"
                    hint={`${TAX_RATES.foreignLongPercent}% flat`}
                    value={formatINR(tax.foreignLongTax)}
                  />
                )}
                {tax.foreignShortGain > 0 && (
                  <Row
                    label="US stocks short-term"
                    hint="Taxed at your income slab — not estimated here"
                    value="At slab"
                  />
                )}
                <Row label="Estimated total" value={formatINR(tax.total)} />

                <p className="mt-3 text-[11px] text-muted">
                  The ₹{formatNumber(TAX_RATES.equityLongExemption, 0)} long-term exemption is per financial
                  year across all your equity, so it may already be partly used elsewhere.
                </p>
              </div>
            </div>
          )}

          {summary && summary.lots.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">
                Matched lots · FY {summary.fy}
              </div>
              <div className="divide-y divide-border">
                {summary.lots.map((lot, i) => (
                  <div key={`${lot.holdingId}-${i}`} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        lot.gainInr >= 0 ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
                      }`}
                    >
                      {lot.gainInr >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{lot.holdingName}</div>
                      <div className="truncate text-xs text-muted">
                        {formatNumber(lot.quantity, 4)} · bought {lot.buyDate} → sold {lot.sellDate}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={`text-sm font-semibold tabular-nums ${
                          lot.gainInr >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {lot.gainInr >= 0 ? "+" : ""}
                        {formatINR(lot.gainInr)}
                      </div>
                      <div className="text-[11px] text-muted">
                        {lot.term === "LONG" ? "Long-term" : "Short-term"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {maturingSoon.length > 0 && (
        <div className="card p-4 md:p-6">
          <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
            <Clock size={14} className="text-primary" /> Approaching long-term
          </h3>
          <p className="mb-3 text-xs text-muted">
            Holdings you still own that haven&apos;t crossed the long-term threshold yet.
          </p>
          <div className="divide-y divide-border">
            {maturingSoon.map((lot, i) => (
              <div key={`${lot.holdingId}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm">{lot.holdingName}</div>
                  <div className="text-xs text-muted">
                    {formatNumber(lot.quantity, 4)} bought {lot.buyDate}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold tabular-nums">{lot.daysToLongTerm}d</div>
                  <div className="text-[11px] text-muted">to long-term</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
