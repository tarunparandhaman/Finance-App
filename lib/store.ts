import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Holding,
  FxRate,
  Liability,
  NetWorthSnapshot,
  AllocationTarget,
  Transaction,
} from "./types";

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const DEFAULT_TARGET_ALLOCATION: AllocationTarget = {
  EQUITY: 50,
  DEBT: 30,
  REAL_ESTATE: 10,
  COMMODITIES: 5,
  CASH: 5,
};

export interface BackupData {
  holdings: Holding[];
  liabilities: Liability[];
  transactions: Transaction[];
  snapshots: NetWorthSnapshot[];
  targetAllocation: AllocationTarget;
  fxRate: FxRate | null;
}

interface FinanceState {
  holdings: Holding[];
  liabilities: Liability[];
  transactions: Transaction[];
  snapshots: NetWorthSnapshot[];
  targetAllocation: AllocationTarget;
  fxRate: FxRate | null;
  hydrated: boolean;

  addHolding: (h: Omit<Holding, "id" | "createdAt" | "updatedAt">) => void;
  updateHolding: (id: string, patch: Partial<Holding>) => void;
  deleteHolding: (id: string) => void;

  addLiability: (l: Omit<Liability, "id" | "createdAt" | "updatedAt">) => void;
  updateLiability: (id: string, patch: Partial<Liability>) => void;
  deleteLiability: (id: string) => void;

  addTransaction: (t: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

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
      liabilities: [],
      transactions: [],
      snapshots: [],
      targetAllocation: DEFAULT_TARGET_ALLOCATION,
      fxRate: null,
      hydrated: false,

      addHolding: (h) =>
        set((state) => {
          const now = new Date().toISOString();
          const holding = { ...h, id: makeId(), createdAt: now, updatedAt: now } as Holding;
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
          holdings: data.holdings ?? [],
          liabilities: data.liabilities ?? [],
          transactions: data.transactions ?? [],
          snapshots: data.snapshots ?? [],
          targetAllocation: data.targetAllocation ?? DEFAULT_TARGET_ALLOCATION,
          fxRate: data.fxRate ?? null,
        }),
      clearAll: () =>
        set({
          holdings: [],
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
    useFinanceStore.setState({ hydrated: true });
  });
}
