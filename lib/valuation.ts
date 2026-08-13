import type { Holding, Liability } from "./types";

export interface Valuation {
  currentValueInr: number;
  costValueInr: number;
  gainInr: number;
  gainPercent: number;
}

/** Converts a holding's value to INR and computes gain/loss vs its cost basis. */
export function valueHolding(h: Holding, usdInr: number): Valuation {
  switch (h.category) {
    case "IN_STOCK":
    case "US_STOCK": {
      const price = h.currentPrice ?? h.avgPrice;
      const fx = h.currency === "USD" ? usdInr : 1;
      const currentValueInr = h.quantity * price * fx;
      const costValueInr = h.quantity * h.avgPrice * fx;
      const gainInr = currentValueInr - costValueInr;
      return {
        currentValueInr,
        costValueInr,
        gainInr,
        gainPercent: costValueInr > 0 ? (gainInr / costValueInr) * 100 : 0,
      };
    }
    case "MUTUAL_FUND": {
      const nav = h.currentNav ?? h.avgNav;
      const currentValueInr = h.units * nav;
      const costValueInr = h.units * h.avgNav;
      const gainInr = currentValueInr - costValueInr;
      return {
        currentValueInr,
        costValueInr,
        gainInr,
        gainPercent: costValueInr > 0 ? (gainInr / costValueInr) * 100 : 0,
      };
    }
    case "PF":
    case "NPS": {
      return {
        currentValueInr: h.currentBalance,
        costValueInr: h.currentBalance,
        gainInr: 0,
        gainPercent: 0,
      };
    }
    case "OTHER": {
      const fx = h.currency === "USD" ? usdInr : 1;
      const currentValueInr = h.currentValue * fx;
      return {
        currentValueInr,
        costValueInr: currentValueInr,
        gainInr: 0,
        gainPercent: 0,
      };
    }
  }
}

export function totalAssets(holdings: Holding[], usdInr: number): number {
  return holdings.reduce((sum, h) => sum + valueHolding(h, usdInr).currentValueInr, 0);
}

export function valueLiability(l: Liability, usdInr: number): number {
  return l.currentBalance * (l.currency === "USD" ? usdInr : 1);
}

export function totalLiabilities(liabilities: Liability[], usdInr: number): number {
  return liabilities.reduce((sum, l) => sum + valueLiability(l, usdInr), 0);
}

export const LIABILITY_TYPE_LABELS: Record<Liability["type"], string> = {
  HOME_LOAN: "Home Loan",
  VEHICLE_LOAN: "Vehicle Loan",
  PERSONAL_LOAN: "Personal Loan",
  CREDIT_CARD: "Credit Card",
  OTHER: "Other",
};

export const CATEGORY_LABELS: Record<Holding["category"], string> = {
  IN_STOCK: "Indian Stocks",
  US_STOCK: "US Stocks",
  MUTUAL_FUND: "Mutual Funds",
  PF: "Provident Fund",
  NPS: "NPS",
  OTHER: "Other Assets",
};

export const CATEGORY_COLORS: Record<Holding["category"], string> = {
  IN_STOCK: "#2563eb",
  US_STOCK: "#7c3aed",
  MUTUAL_FUND: "#059669",
  PF: "#d97706",
  NPS: "#dc2626",
  OTHER: "#64748b",
};
