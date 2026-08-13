export type AssetCategory =
  | "IN_STOCK"
  | "US_STOCK"
  | "MUTUAL_FUND"
  | "PF"
  | "NPS"
  | "OTHER";

export type OtherSubType = "FD" | "GOLD" | "CASH" | "REAL_ESTATE" | "OTHER";

interface BaseHolding {
  id: string;
  category: AssetCategory;
  name: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** An individual buy or sell of a stock or mutual fund. */
export interface Trade {
  id: string;
  type: "BUY" | "SELL";
  /** Shares for stocks, units for mutual funds. */
  quantity: number;
  /** Per share/unit, in the holding's own currency. */
  price: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface StockHolding extends BaseHolding {
  category: "IN_STOCK" | "US_STOCK";
  symbol: string; // e.g. RELIANCE.NS or AAPL
  /** Derived from `trades` — never edit directly, use the store's trade actions. */
  quantity: number;
  /** Derived from `trades` (average cost method). */
  avgPrice: number;
  trades: Trade[];
  currentPrice?: number;
  /** Prior session's close, used for the day-change figure. */
  previousClose?: number;
  currency: "INR" | "USD";
  lastFetched?: string;
}

export interface MutualFundHolding extends BaseHolding {
  category: "MUTUAL_FUND";
  schemeCode: string;
  schemeName: string;
  /** Derived from `trades`. */
  units: number;
  /** Derived from `trades` (average cost method). */
  avgNav: number;
  trades: Trade[];
  currentNav?: number;
  /** Prior published NAV, used for the day-change figure. */
  previousNav?: number;
  lastFetched?: string;
}

export interface RetirementHolding extends BaseHolding {
  category: "PF" | "NPS";
  currentBalance: number;
  monthlyContribution?: number;
  asOfDate: string;
}

export interface OtherHolding extends BaseHolding {
  category: "OTHER";
  subType: OtherSubType;
  currentValue: number;
  currency: "INR" | "USD";
  asOfDate: string;
}

export type Holding =
  | StockHolding
  | MutualFundHolding
  | RetirementHolding
  | OtherHolding;

export interface FxRate {
  usdInr: number;
  updatedAt: string;
}

/** A symbol being followed without owning it. */
export interface WatchItem {
  id: string;
  symbol: string;
  name: string;
  /** Which Invest tab it belongs to, so currency and search behave correctly. */
  market: "IN_STOCK" | "US_STOCK";
  price?: number;
  previousClose?: number;
  lastFetched?: string;
  createdAt: string;
}

export type LiabilityType = "HOME_LOAN" | "VEHICLE_LOAN" | "PERSONAL_LOAN" | "CREDIT_CARD" | "OTHER";

export interface Liability {
  id: string;
  type: LiabilityType;
  name: string;
  currentBalance: number;
  currency: "INR" | "USD";
  interestRate?: number;
  asOfDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NetWorthSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  assetsInr: number;
  liabilitiesInr: number;
  netWorthInr: number;
  note?: string;
  createdAt: string;
}

export type AllocationBucket = "EQUITY" | "DEBT" | "REAL_ESTATE" | "COMMODITIES" | "CASH";

export type AllocationTarget = Record<AllocationBucket, number>;

export type TransactionType = "INCOME" | "EXPENSE" | "INVESTMENT";

export const EXPENSE_CATEGORIES = [
  "Groceries",
  "Food & Dining",
  "Shopping",
  "Transport",
  "Utilities",
  "Entertainment",
  "Health",
  "Rent",
  "Other",
] as const;

export const INCOME_CATEGORIES = ["Salary", "Business", "Freelance", "Dividend", "Interest", "Other"] as const;

export const INVESTMENT_CATEGORY = "Investment";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  recurring?: boolean;
  createdAt: string;
  updatedAt: string;
}
