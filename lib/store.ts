import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Holding, FxRate } from "./types";

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface FinanceState {
  holdings: Holding[];
  fxRate: FxRate | null;
  hydrated: boolean;
  addHolding: (h: Omit<Holding, "id" | "createdAt" | "updatedAt">) => void;
  updateHolding: (id: string, patch: Partial<Holding>) => void;
  deleteHolding: (id: string) => void;
  setFxRate: (rate: FxRate) => void;
  replaceAll: (holdings: Holding[]) => void;
  clearAll: () => void;
  setHydrated: () => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      holdings: [],
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
      setFxRate: (rate) => set({ fxRate: rate }),
      replaceAll: (holdings) => set({ holdings }),
      clearAll: () => set({ holdings: [], fxRate: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "finance-tracker-storage",
      storage: createJSONStorage(() => localStorage),
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
