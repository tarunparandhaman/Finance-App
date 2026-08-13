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

export interface StockHolding extends BaseHolding {
  category: "IN_STOCK" | "US_STOCK";
  symbol: string; // e.g. RELIANCE.NS or AAPL
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  currency: "INR" | "USD";
  lastFetched?: string;
}

export interface MutualFundHolding extends BaseHolding {
  category: "MUTUAL_FUND";
  schemeCode: string;
  schemeName: string;
  units: number;
  avgNav: number;
  currentNav?: number;
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
