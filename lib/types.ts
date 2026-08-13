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
