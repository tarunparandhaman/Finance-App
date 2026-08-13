"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import PageShell from "@/components/PageShell";
import SegmentedControl from "@/components/SegmentedControl";
import Sheet from "@/components/Sheet";
import IndicesStrip from "@/components/IndicesStrip";
import FloatingActionButton from "@/components/FloatingActionButton";
import Field from "@/components/Field";
import Autocomplete, { AutocompleteOption } from "@/components/Autocomplete";
import { useFinanceStore, WATCHLIST_LIMIT } from "@/lib/store";
import { formatNumber, formatPercent, timeAgo } from "@/lib/format";
import { baseSymbol } from "@/lib/stocks";

type Market = "IN_STOCK" | "US_STOCK";

const MARKET_OPTIONS: { value: Market; label: string }[] = [
  { value: "IN_STOCK", label: "India" },
  { value: "US_STOCK", label: "US" },
];

export default function WatchlistPage() {
  const watchlist = useFinanceStore((s) => s.watchlist);
  const addWatchItem = useFinanceStore((s) => s.addWatchItem);
  const updateWatchItem = useFinanceStore((s) => s.updateWatchItem);
  const deleteWatchItem = useFinanceStore((s) => s.deleteWatchItem);

  const [market, setMarket] = useState<Market>("IN_STOCK");
  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const shown = useMemo(() => watchlist.filter((w) => w.market === market), [watchlist, market]);

  // Writes quotes straight into the store; deliberately holds no React state so
  // it's safe to call from an effect.
  const fetchQuotes = useCallback(async () => {
    const current = useFinanceStore.getState().watchlist;
    if (current.length === 0) return;
    try {
      const symbols = current.map((w) => w.symbol).join(",");
      const res = await fetch(`/api/quote?symbols=${encodeURIComponent(symbols)}`);
      const data = await res.json();
      const bySymbol: Record<string, { price?: number; previousClose?: number }> = {};
      for (const q of data.quotes ?? []) bySymbol[q.symbol] = q;
      for (const w of current) {
        const q = bySymbol[w.symbol];
        if (q?.price) {
          updateWatchItem(w.id, {
            price: q.price,
            previousClose: q.previousClose,
            lastFetched: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Keep last known quotes on failure.
    }
  }, [updateWatchItem]);

  async function handleManualRefresh() {
    setRefreshing(true);
    try {
      await fetchQuotes();
    } finally {
      setRefreshing(false);
    }
  }

  // Watchlist quotes are only worth fetching while this page is actually open.
  useEffect(() => {
    fetchQuotes();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") fetchQuotes();
    }, 2 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchQuotes]);

  async function search(query: string): Promise<AutocompleteOption[]> {
    const res = await fetch(`/api/stock-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const results: { symbol: string; name: string; exchange?: string }[] = data.results ?? [];
    const filtered = results.filter((r) =>
      market === "IN_STOCK" ? r.symbol.endsWith(".NS") || r.symbol.endsWith(".BO") : !r.symbol.includes(".")
    );
    const byCompany = new Map<string, { symbol: string; name: string; exchange?: string }>();
    for (const r of filtered) {
      const key = market === "IN_STOCK" ? baseSymbol(r.symbol) : r.symbol;
      if (!byCompany.has(key) || r.symbol.endsWith(".NS")) byCompany.set(key, r);
    }
    return [...byCompany.values()].map((r) => ({
      key: r.symbol,
      label: r.name,
      sublabel: `${r.symbol} · ${r.exchange ?? ""}`,
    }));
  }

  const currency = market === "US_STOCK" ? "$" : "₹";
  const atLimit = watchlist.length >= WATCHLIST_LIMIT;

  return (
    <PageShell
      title="Watchlist"
      subtitle={`Follow what you don't own yet · ${watchlist.length}/${WATCHLIST_LIMIT}`}
      wide
      action={
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium shadow-sm disabled:opacity-60"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      }
    >
      <div className="space-y-4">
        <IndicesStrip />

        <div className="md:max-w-xs">
          <SegmentedControl options={MARKET_OPTIONS} value={market} onChange={setMarket} />
        </div>

        {atLimit && (
          <div className="rounded-lg bg-surface-alt px-3 py-2 text-xs text-muted">
            Watchlist is full at {WATCHLIST_LIMIT}. Remove one to follow something else.
          </div>
        )}

        {shown.length === 0 ? (
          <div className="card border-dashed p-8 text-center text-sm text-muted">
            Nothing on your {market === "IN_STOCK" ? "India" : "US"} watchlist yet. Tap + to follow a stock.
          </div>
        ) : (
          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
            {shown.map((w) => {
              const change =
                w.price && w.previousClose ? ((w.price - w.previousClose) / w.previousClose) * 100 : null;
              const up = (change ?? 0) >= 0;
              return (
                <div key={w.id} className="card flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{w.name}</div>
                    <div className="truncate text-xs text-muted">
                      {w.symbol}
                      {w.lastFetched && ` · ${timeAgo(w.lastFetched)}`}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold tabular-nums">
                      {w.price ? `${currency}${formatNumber(w.price)}` : "—"}
                    </div>
                    {change !== null && (
                      <div className={`text-xs tabular-nums ${up ? "text-positive" : "text-negative"}`}>
                        {up ? "▲" : "▼"} {formatPercent(change)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteWatchItem(w.id)}
                    aria-label={`Remove ${w.name}`}
                    className="shrink-0 text-muted hover:text-negative"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!atLimit && <FloatingActionButton onClick={() => setAddOpen(true)} label="Add to watchlist" wide />}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Follow a stock">
        <div className="space-y-4">
          <SegmentedControl options={MARKET_OPTIONS} value={market} onChange={setMarket} />
          <Field label="Search symbol or company">
            <Autocomplete
              placeholder={market === "IN_STOCK" ? "e.g. Reliance, TCS" : "e.g. Apple, Nvidia"}
              onSearch={search}
              onSelect={(opt) => {
                addWatchItem({ symbol: opt.key, name: opt.label, market });
                setAddOpen(false);
                // Give the store a tick to commit before quoting the new symbol.
                setTimeout(fetchQuotes, 0);
              }}
            />
          </Field>
          <p className="text-xs text-muted">
            Watchlist items aren&apos;t counted in your net worth — they&apos;re just for keeping an eye on
            things.
          </p>
        </div>
      </Sheet>
    </PageShell>
  );
}
