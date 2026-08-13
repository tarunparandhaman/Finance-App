"use client";

import { useTheme } from "./theme";
import type { AssetCategory, AllocationBucket } from "./types";

/** Brighter, lower-saturation variants read better on the dark surface. */
const CATEGORY_LIGHT: Record<AssetCategory, string> = {
  IN_STOCK: "#2563eb",
  US_STOCK: "#7c3aed",
  MUTUAL_FUND: "#059669",
  PF: "#d97706",
  NPS: "#dc2626",
  OTHER: "#64748b",
};

const CATEGORY_DARK: Record<AssetCategory, string> = {
  IN_STOCK: "#60a5fa",
  US_STOCK: "#c084fc",
  MUTUAL_FUND: "#34d399",
  PF: "#fbbf24",
  NPS: "#f87171",
  OTHER: "#94a3b8",
};

const BUCKET_LIGHT: Record<AllocationBucket, string> = {
  EQUITY: "#2563eb",
  DEBT: "#059669",
  REAL_ESTATE: "#d97706",
  COMMODITIES: "#b45309",
  CASH: "#64748b",
};

const BUCKET_DARK: Record<AllocationBucket, string> = {
  EQUITY: "#60a5fa",
  DEBT: "#34d399",
  REAL_ESTATE: "#fbbf24",
  COMMODITIES: "#fb923c",
  CASH: "#94a3b8",
};

export interface ChartTheme {
  categoryColors: Record<AssetCategory, string>;
  bucketColors: Record<AllocationBucket, string>;
  income: string;
  expense: string;
  investment: string;
  axis: string;
  grid: string;
  tooltip: React.CSSProperties;
}

export function useChartTheme(): ChartTheme {
  const { resolved } = useTheme();
  const dark = resolved === "dark";

  return {
    categoryColors: dark ? CATEGORY_DARK : CATEGORY_LIGHT,
    bucketColors: dark ? BUCKET_DARK : BUCKET_LIGHT,
    income: dark ? "#4ade80" : "#16a34a",
    expense: dark ? "#f87171" : "#dc2626",
    investment: dark ? "#60a5fa" : "#2563eb",
    axis: dark ? "#94a3b8" : "#64748b",
    grid: dark ? "#263349" : "#e5e9f0",
    tooltip: {
      borderRadius: 10,
      border: `1px solid ${dark ? "#263349" : "#e5e9f0"}`,
      background: dark ? "#151d2e" : "#ffffff",
      color: dark ? "#e8edf7" : "#0f172a",
      fontSize: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  };
}
