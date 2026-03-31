import type { InvestmentCategory } from "@/types";

export const CHART_COLORS = [
  "#6366f1", "#f43f5e", "#f59e0b", "#14b8a6", "#8b5cf6",
  "#64748b", "#ec4899", "#06b6d4", "#84cc16", "#ef4444",
] as const;

export const INVESTMENT_CATEGORY_COLORS: Record<InvestmentCategory, string> = {
  stocks: "#3b82f6",
  bonds: "#8b5cf6",
  crypto: "#f59e0b",
  real_estate: "#22c55e",
  mutual_funds: "#14b8a6",
  etfs: "#06b6d4",
  custom: "#6b7280",
};

export const INVESTMENT_CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  stocks: "Stocks",
  bonds: "Bonds",
  crypto: "Crypto",
  real_estate: "Real Estate",
  mutual_funds: "Mutual Funds",
  etfs: "ETFs",
  custom: "Custom",
};
