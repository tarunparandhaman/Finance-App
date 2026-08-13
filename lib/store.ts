import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Holding,
  FxRate,
  Liability,
  NetWorthSnapshot,
  AllocationTarget,
  Transaction,
  Trade,
  WatchItem,
} from "./types";
import { baseSymbol, preferredSymbol } from "./stocks";
import { isTradeable, withDerivedPosition } from "./trades";

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Backfills a single opening BUY for holdings saved before trades existed, so
 * every position has a transaction history to show.
 */
function ensureTrades(holdings: Holding[]): Holding[] {
  return holdings.map((h) => {
    if (!isTradeable(h) || (h.trades && h.trades.length > 0)) return h;
    const quantity = h.category === "MUTUAL_FUND" ? h.units : h.quantity;
    const price = h.category === "MUTUAL_FUND" ? h.avgNav : h.avgPrice;
    const openingTrade: Trade = {
      id: makeId(),
      type: "BUY",
      quantity,
      price,
      date: (h.createdAt ?? new Date().toISOString()).slice(0, 10),
      note: "Opening balance",
      createdAt: h.createdAt ?? new Date().toISOString(),
    };
    return { ...h, trades: [openingTrade] };
  });
}

/**
 * Merges holdings that represent the same position (e.g. added twice before
 * the add-flow started merging automatically, or the same stock bought via
 * both its NSE and BSE listing) into a single row, combining their trade
 * histories and re-deriving the position from them.
 */
function dedupeHoldings(holdings: Holding[]): Holding[] {
  const merged: Holding[] = [];
  const indexByKey = new Map<string, number>();

  for (const h of holdings) {
    const key =
      h.category === "IN_STOCK" || h.category === "US_STOCK"
        ? `${h.category}:${baseSymbol(h.symbol)}`
        : h.category === "MUTUAL_FUND"
          ? `MUTUAL_FUND:${h.schemeCode}`
          : null;

    if (!key) {
      merged.push(h);
      continue;
    }

    const existingIndex = indexByKey.get(key);
    if (existingIndex === undefined) {
      indexByKey.set(key, merged.length);
      merged.push(h);
      continue;
    }

    const existing = merged[existingIndex];
    if (!isTradeable(existing) || !isTradeable(h) || existing.category !== h.category) continue;

    const combined = { ...existing, trades: [...existing.trades, ...h.trades] };
    if (combined.category !== "MUTUAL_FUND" && h.category !== "MUTUAL_FUND") {
      combined.symbol = preferredSymbol(combined.symbol, h.symbol);
      combined.currentPrice = h.currentPrice ?? combined.currentPrice;
    } else if (combined.category === "MUTUAL_FUND" && h.category === "MUTUAL_FUND") {
      combined.currentNav = h.currentNav ?? combined.currentNav;
    }
    combined.lastFetched = h.lastFetched ?? combined.lastFetched;
    merged[existingIndex] = withDerivedPosition(combined);
  }

  return merged;
}

export const DEFAULT_TARGET_ALLOCATION: AllocationTarget = {
  EQUITY: 50,
  DEBT: 30,
  REAL_ESTATE: 10,
  COMMODITIES: 5,
  CASH: 5,
};

/**
 * `Omit` on a union collapses it to the shared keys, which would drop
 * category-specific fields like `symbol` and `schemeCode`. Distributing over
 * the union preserves each member's own shape.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** A holding as callers supply it: no id/timestamps, and trades without ids. */
export type NewHolding = DistributiveOmit<Holding, "id" | "createdAt" | "updatedAt" | "trades"> & {
  trades?: Omit<Trade, "id" | "createdAt">[];
};

export interface BackupData {
  holdings: Holding[];
  watchlist: WatchItem[];
  liabilities: Liability[];
  transactions: Transaction[];
  snapshots: NetWorthSnapshot[];
  targetAllocation: AllocationTarget;
  fxRate: FxRate | null;
}

interface FinanceState {
  holdings: Holding[];
  watchlist: WatchItem[];
  liabilities: Liability[];
  transactions: Transaction[];
  snapshots: NetWorthSnapshot[];
  targetAllocation: AllocationTarget;
  fxRate: FxRate | null;
  hydrated: boolean;

  addHolding: (h: NewHolding) => void;
  updateHolding: (id: string, patch: Partial<Holding>) => void;
  deleteHolding: (id: string) => void;

  addTrade: (holdingId: string, trade: Omit<Trade, "id" | "createdAt">) => void;
  updateTrade: (holdingId: string, tradeId: string, patch: Partial<Trade>) => void;
  deleteTrade: (holdingId: string, tradeId: string) => void;

  addLiability: (l: Omit<Liability, "id" | "createdAt" | "updatedAt">) => void;
  updateLiability: (id: string, patch: Partial<Liability>) => void;
  deleteLiability: (id: string) => void;

  addTransaction: (t: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addWatchItem: (w: Omit<WatchItem, "id" | "createdAt">) => void;
  updateWatchItem: (id: string, patch: Partial<WatchItem>) => void;
  deleteWatchItem: (id: string) => void;

  takeSnapshot: (assetsInr: number, liabilitiesInr: number, note?: string) => void;
  deleteSnapshot: (id: string) => void;

  setTargetAllocation: (target: AllocationTarget) => void;
  setFxRate: (rate: FxRate) => void;
  restoreBackup: (data: Partial<BackupData>) => void;
  clearAll: () => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      holdings: [],
      watchlist: [],
      liabilities: [],
      transactions: [],
      snapshots: [],
      targetAllocation: DEFAULT_TARGET_ALLOCATION,
      fxRate: null,
      hydrated: false,

      addHolding: (h) =>
        set((state) => {
          const now = new Date().toISOString();
          // Callers pass trades without ids; they're minted here so no caller
          // needs to know how ids are generated.
          const trades: Trade[] = (h.trades ?? []).map((t) => ({ ...t, id: makeId(), createdAt: now }));
          let holding = { ...h, trades, id: makeId(), createdAt: now, updatedAt: now } as Holding;
          if (isTradeable(holding)) holding = withDerivedPosition(holding);
          return { holdings: [...state.holdings, holding] };
        }),
      updateHolding: (id, patch) =>
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === id
              ? ({ ...h, ...patch, updatedAt: new Date().toISOString() } as Holding)
              : h
          ),
        })),
      deleteHolding: (id) =>
        set((state) => ({ holdings: state.holdings.filter((h) => h.id !== id) })),

      addTrade: (holdingId, trade) =>
        set((state) => ({
          holdings: state.holdings.map((h) => {
            if (h.id !== holdingId || !isTradeable(h)) return h;
            const next: Trade = { ...trade, id: makeId(), createdAt: new Date().toISOString() };
            return withDerivedPosition({
              ...h,
              trades: [...h.trades, next],
              updatedAt: new Date().toISOString(),
            });
          }),
        })),
      updateTrade: (holdingId, tradeId, patch) =>
        set((state) => ({
          holdings: state.holdings.map((h) => {
            if (h.id !== holdingId || !isTradeable(h)) return h;
            return withDerivedPosition({
              ...h,
              trades: h.trades.map((t) => (t.id === tradeId ? { ...t, ...patch } : t)),
              updatedAt: new Date().toISOString(),
            });
          }),
        })),
      deleteTrade: (holdingId, tradeId) =>
        set((state) => ({
          holdings: state.holdings.flatMap((h) => {
            if (h.id !== holdingId || !isTradeable(h)) return [h];
            const trades = h.trades.filter((t) => t.id !== tradeId);
            // Removing the last transaction removes the position entirely.
            if (trades.length === 0) return [];
            return [withDerivedPosition({ ...h, trades, updatedAt: new Date().toISOString() })];
          }),
        })),

      addLiability: (l) =>
        set((state) => {
          const now = new Date().toISOString();
          const liability: Liability = { ...l, id: makeId(), createdAt: now, updatedAt: now };
          return { liabilities: [...state.liabilities, liability] };
        }),
      updateLiability: (id, patch) =>
        set((state) => ({
          liabilities: state.liabilities.map((l) =>
            l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l
          ),
        })),
      deleteLiability: (id) =>
        set((state) => ({ liabilities: state.liabilities.filter((l) => l.id !== id) })),

      addTransaction: (t) =>
        set((state) => {
          const now = new Date().toISOString();
          const transaction: Transaction = { ...t, id: makeId(), createdAt: now, updatedAt: now };
          return { transactions: [...state.transactions, transaction] };
        }),
      updateTransaction: (id, patch) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),

      addWatchItem: (w) =>
        set((state) => {
          // Following the same symbol twice is always a mistake, not an intent.
          if (state.watchlist.some((x) => x.symbol === w.symbol)) return state;
          const item: WatchItem = { ...w, id: makeId(), createdAt: new Date().toISOString() };
          return { watchlist: [...state.watchlist, item] };
        }),
      updateWatchItem: (id, patch) =>
        set((state) => ({
          watchlist: state.watchlist.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),
      deleteWatchItem: (id) =>
        set((state) => ({ watchlist: state.watchlist.filter((w) => w.id !== id) })),

      takeSnapshot: (assetsInr, liabilitiesInr, note) =>
        set((state) => {
          const snapshot: NetWorthSnapshot = {
            id: makeId(),
            date: new Date().toISOString().slice(0, 10),
            assetsInr,
            liabilitiesInr,
            netWorthInr: assetsInr - liabilitiesInr,
            note,
            createdAt: new Date().toISOString(),
          };
          return { snapshots: [...state.snapshots, snapshot] };
        }),
      deleteSnapshot: (id) =>
        set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== id) })),

      setTargetAllocation: (target) => set({ targetAllocation: target }),
      setFxRate: (rate) => set({ fxRate: rate }),
      restoreBackup: (data) =>
        set({
          holdings: dedupeHoldings(ensureTrades(data.holdings ?? [])),
          watchlist: data.watchlist ?? [],
          liabilities: data.liabilities ?? [],
          transactions: data.transactions ?? [],
          snapshots: data.snapshots ?? [],
          targetAllocation: data.targetAllocation ?? DEFAULT_TARGET_ALLOCATION,
          fxRate: data.fxRate ?? null,
        }),
      clearAll: () =>
        set({
          holdings: [],
          watchlist: [],
          liabilities: [],
          transactions: [],
          snapshots: [],
          targetAllocation: DEFAULT_TARGET_ALLOCATION,
          fxRate: null,
        }),
    }),
    {
      name: "finance-tracker-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        holdings: state.holdings,
        watchlist: state.watchlist,
        liabilities: state.liabilities,
        transactions: state.transactions,
        snapshots: state.snapshots,
        targetAllocation: state.targetAllocation,
        fxRate: state.fxRate,
      }),
    }
  )
);

// Promise.resolve(...).finally() guarantees this runs whether hydration
// succeeds, errors (e.g. localStorage blocked in private browsing), or
// resolves synchronously — without it the app could hang on the loading
// spinner forever.
if (typeof window !== "undefined") {
  Promise.resolve(useFinanceStore.persist.rehydrate()).finally(() => {
    const migrated = dedupeHoldings(ensureTrades(useFinanceStore.getState().holdings));
    useFinanceStore.setState({ holdings: migrated, hydrated: true });
  });
}
