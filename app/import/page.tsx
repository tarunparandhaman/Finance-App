"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import SegmentedControl from "@/components/SegmentedControl";
import { inputClass } from "@/components/Field";
import { useFinanceStore } from "@/lib/store";
import { refreshAllPrices } from "@/lib/pricing";
import { parseCsv, parseCsvNumber, parseCsvDate, type ParsedCsv } from "@/lib/csv";
import { guessMapping, type ColumnMapping } from "@/lib/importMapping";
import { baseSymbol } from "@/lib/stocks";
import { formatNumber } from "@/lib/format";
import type { StockHolding, MutualFundHolding } from "@/lib/types";

type ImportCategory = "IN_STOCK" | "US_STOCK" | "MUTUAL_FUND";
type Step = "INPUT" | "MAP" | "REVIEW";

const CATEGORY_OPTIONS: { value: ImportCategory; label: string }[] = [
  { value: "IN_STOCK", label: "Indian Stocks" },
  { value: "US_STOCK", label: "US Stocks" },
  { value: "MUTUAL_FUND", label: "Mutual Funds" },
];

interface ReviewRow {
  key: number;
  rawSymbol: string;
  quantity: number;
  price: number;
  date: string;
  include: boolean;
  status: "ready" | "matching" | "matched" | "unmatched" | "invalid";
  resolvedSymbol: string;
  resolvedName: string;
}

function normalizeStockSymbol(raw: string, category: ImportCategory): string {
  const upper = raw.trim().toUpperCase();
  if (category === "IN_STOCK" && !/\.(NS|BO)$/.test(upper)) return `${upper}.NS`;
  return upper;
}

export default function ImportPage() {
  const router = useRouter();
  const holdings = useFinanceStore((s) => s.holdings);
  const addHolding = useFinanceStore((s) => s.addHolding);
  const addTrade = useFinanceStore((s) => s.addTrade);

  const [step, setStep] = useState<Step>("INPUT");
  const [category, setCategory] = useState<ImportCategory>("IN_STOCK");
  const [csvText, setCsvText] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ symbol: -1, quantity: -1, price: -1, date: -1 });
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [matchProgress, setMatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const priceLabel = category === "MUTUAL_FUND" ? "NAV" : "Price";
  const symbolLabel = category === "MUTUAL_FUND" ? "Scheme name" : "Symbol / company";

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setCsvText);
    e.target.value = "";
  }

  function handleParse() {
    if (!csvText.trim()) {
      setInputError("Paste some CSV text or upload a file first.");
      return;
    }
    const result = parseCsv(csvText);
    if (result.headers.length < 2 || result.rows.length === 0) {
      setInputError("Couldn't find at least two columns and one data row — check the file has a header row.");
      return;
    }
    setInputError(null);
    setParsed(result);
    setMapping(guessMapping(result.headers));
    setStep("MAP");
  }

  function buildReviewRows(p: ParsedCsv, m: ColumnMapping): ReviewRow[] {
    return p.rows.map((r, i) => {
      const rawSymbol = m.symbol >= 0 ? (r[m.symbol] ?? "").trim() : "";
      const quantity = m.quantity >= 0 ? parseCsvNumber(r[m.quantity] ?? "") : NaN;
      const price = m.price >= 0 ? parseCsvNumber(r[m.price] ?? "") : NaN;
      const date = m.date >= 0 && r[m.date] ? parseCsvDate(r[m.date]) : new Date().toISOString().slice(0, 10);
      const valid = rawSymbol.length > 0 && quantity > 0 && price >= 0;
      return {
        key: i,
        rawSymbol,
        quantity,
        price,
        date,
        include: valid,
        status: valid ? (category === "MUTUAL_FUND" ? "matching" : "ready") : "invalid",
        resolvedSymbol: valid && category !== "MUTUAL_FUND" ? normalizeStockSymbol(rawSymbol, category) : "",
        resolvedName: rawSymbol,
      };
    });
  }

  async function handleContinueToReview() {
    if (!parsed) return;
    const built = buildReviewRows(parsed, mapping);
    setRows(built);
    setStep("REVIEW");

    if (category !== "MUTUAL_FUND") return;

    const toMatch = built.filter((r) => r.status === "matching");
    setMatchProgress({ done: 0, total: toMatch.length });
    for (let i = 0; i < toMatch.length; i++) {
      const row = toMatch[i];
      try {
        const res = await fetch(`/api/mf-search?q=${encodeURIComponent(row.rawSymbol)}`);
        const data = await res.json();
        const best: { schemeCode: string; schemeName: string } | undefined = data.results?.[0];
        setRows((prev) =>
          prev.map((r) =>
            r.key === row.key
              ? best
                ? { ...r, status: "matched", resolvedSymbol: best.schemeCode, resolvedName: best.schemeName }
                : { ...r, status: "unmatched", include: false }
              : r
          )
        );
      } catch {
        setRows((prev) => (prev.map((r) => (r.key === row.key ? { ...r, status: "unmatched", include: false } : r))));
      }
      setMatchProgress({ done: i + 1, total: toMatch.length });
    }
  }

  const readyCount = useMemo(
    () => rows.filter((r) => r.include && (r.status === "ready" || r.status === "matched")).length,
    [rows]
  );

  function handleImport() {
    setImporting(true);
    let count = 0;

    for (const row of rows) {
      if (!row.include || (row.status !== "ready" && row.status !== "matched")) continue;
      const trade = { type: "BUY" as const, quantity: row.quantity, price: row.price, date: row.date, note: "Imported" };

      const current = useFinanceStore.getState().holdings;
      if (category === "MUTUAL_FUND") {
        const existing = current.find(
          (h): h is MutualFundHolding => h.category === "MUTUAL_FUND" && h.schemeCode === row.resolvedSymbol
        );
        if (existing) {
          addTrade(existing.id, trade);
        } else {
          addHolding({
            category: "MUTUAL_FUND",
            schemeCode: row.resolvedSymbol,
            schemeName: row.resolvedName,
            name: row.resolvedName,
            units: row.quantity,
            avgNav: row.price,
            trades: [trade],
          });
        }
      } else {
        const existing = current.find(
          (h): h is StockHolding =>
            (h.category === "IN_STOCK" || h.category === "US_STOCK") &&
            h.category === category &&
            baseSymbol(h.symbol) === baseSymbol(row.resolvedSymbol)
        );
        if (existing) {
          addTrade(existing.id, trade);
        } else {
          addHolding({
            category,
            symbol: row.resolvedSymbol,
            name: row.resolvedName,
            quantity: row.quantity,
            avgPrice: row.price,
            currency: category === "US_STOCK" ? "USD" : "INR",
            trades: [trade],
          });
        }
      }
      count++;
    }

    refreshAllPrices().catch(() => {});
    setImportedCount(count);
    setImporting(false);
  }

  const existingCount = holdings.filter((h) => h.category === category).length;

  if (importedCount !== null) {
    return (
      <PageShell title="Import" backHref="/settings">
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 size={36} className="text-positive" />
          <div>
            <div className="text-lg font-semibold">Imported {importedCount} holdings</div>
            <p className="mt-1 text-sm text-muted">
              Prices are refreshing now. You can review or edit anything on the Invest page.
            </p>
          </div>
          <button
            onClick={() => router.push(`/invest?tab=${category}`)}
            className="mt-2 flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
          >
            View holdings <ArrowRight size={15} />
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Import holdings" subtitle={`Step ${step === "INPUT" ? 1 : step === "MAP" ? 2 : 3} of 3`} backHref="/settings">
      <div className="space-y-4">
        {step === "INPUT" && (
          <>
            <div>
              <h2 className="mb-2 px-1 text-sm font-medium text-muted">What are you importing?</h2>
              <SegmentedControl options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
            </div>

            <div className="card p-4">
              <h3 className="mb-1 text-sm font-semibold">Upload or paste a CSV</h3>
              <p className="mb-3 text-xs text-muted">
                Works with Zerodha Console&apos;s holdings export, or any CSV that has columns for symbol/name,
                quantity, and price. If your broker only gives you an Excel file, open it and use &ldquo;Save
                As&rdquo; → CSV first.
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm font-medium text-muted hover:border-primary hover:text-primary"
              >
                <Upload size={16} /> Choose a .csv file
              </button>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />

              <div className="my-3 flex items-center gap-2 text-xs text-muted">
                <div className="h-px flex-1 bg-border" />
                or paste it
                <div className="h-px flex-1 bg-border" />
              </div>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={6}
                placeholder={"Symbol,Qty.,Avg. cost\nRELIANCE,10,1200\nTCS,5,3400"}
                className={`${inputClass} font-mono text-xs`}
              />
              {csvText && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                  <FileText size={13} /> {csvText.trim().split("\n").length} lines loaded
                </div>
              )}
              {inputError && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-negative">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" /> {inputError}
                </div>
              )}
            </div>

            <button
              onClick={handleParse}
              className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-white"
            >
              Continue
            </button>
          </>
        )}

        {step === "MAP" && parsed && (
          <>
            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold">Match your columns</h3>
              <div className="space-y-3">
                {(
                  [
                    ["symbol", symbolLabel],
                    ["quantity", "Quantity"],
                    ["price", priceLabel],
                    ["date", "Purchase date (optional)"],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="block">
                    <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
                    <select
                      className={inputClass}
                      value={mapping[field]}
                      onChange={(e) => setMapping({ ...mapping, [field]: Number(e.target.value) })}
                    >
                      {field === "date" && <option value={-1}>None — use today&apos;s date</option>}
                      {field !== "date" && (
                        <option value={-1} disabled>
                          Select a column…
                        </option>
                      )}
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>

            {mapping.symbol >= 0 && mapping.quantity >= 0 && mapping.price >= 0 && (
              <div className="card overflow-hidden">
                <div className="border-b border-border px-4 py-2 text-xs font-medium text-muted">Preview</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {parsed.rows.slice(0, 4).map((r, i) => (
                        <tr key={i} className="border-t border-border first:border-t-0">
                          <td className="px-3 py-2">{r[mapping.symbol]}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r[mapping.quantity]}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r[mapping.price]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep("INPUT")}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={handleContinueToReview}
                disabled={mapping.symbol < 0 || mapping.quantity < 0 || mapping.price < 0}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === "REVIEW" && (
          <>
            {existingCount > 0 && (
              <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                You already have {existingCount} holding{existingCount === 1 ? "" : "s"} in this category — matching
                rows will be added to those positions instead of duplicating them.
              </div>
            )}

            {matchProgress && matchProgress.done < matchProgress.total && (
              <div className="flex items-center gap-2 rounded-lg bg-surface-alt px-3 py-2 text-xs text-muted">
                <Loader2 size={13} className="animate-spin" />
                Matching mutual fund schemes… {matchProgress.done}/{matchProgress.total}
              </div>
            )}

            <div className="card divide-y divide-border overflow-hidden">
              {rows.map((row) => (
                <label key={row.key} className="flex items-start gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={row.include}
                    disabled={row.status === "invalid" || row.status === "unmatched" || row.status === "matching"}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, include: e.target.checked } : r))
                      )
                    }
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {row.status === "matched" ? row.resolvedName : row.rawSymbol}
                    </div>
                    <div className="text-xs text-muted">
                      {formatNumber(row.quantity, 4)} @ {formatNumber(row.price)} · {row.date}
                    </div>
                    {row.status === "invalid" && (
                      <div className="mt-0.5 text-xs text-negative">Missing or invalid quantity/price — skipped</div>
                    )}
                    {row.status === "unmatched" && (
                      <div className="mt-0.5 text-xs text-negative">
                        No matching scheme found — add this one manually from Invest
                      </div>
                    )}
                    {row.status === "matched" && (
                      <div className="mt-0.5 text-xs text-muted">Matched · {row.resolvedSymbol}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep("MAP")}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={readyCount === 0 || importing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                {importing && <Loader2 size={15} className="animate-spin" />}
                Import {readyCount} holding{readyCount === 1 ? "" : "s"}
              </button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
