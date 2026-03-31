import { useQuery } from "@tanstack/react-query";
import {
  getSpendingByCategory,
  getIncomeVsExpenses,
  getBalanceOverTime,
  getInvestmentSummary,
} from "@/api/analytics";

export function useSpendingByCategory(dateFrom: string, dateTo: string, userId?: string) {
  return useQuery({
    queryKey: ["analytics", "spending", dateFrom, dateTo, userId],
    queryFn: () => getSpendingByCategory(dateFrom, dateTo, userId),
  });
}

export function useIncomeVsExpenses(dateFrom: string, dateTo: string, userId?: string) {
  return useQuery({
    queryKey: ["analytics", "income", dateFrom, dateTo, userId],
    queryFn: () => getIncomeVsExpenses(dateFrom, dateTo, userId),
  });
}

export function useBalanceOverTime(dateFrom: string, dateTo: string, userId?: string) {
  return useQuery({
    queryKey: ["analytics", "balance", dateFrom, dateTo, userId],
    queryFn: () => getBalanceOverTime(dateFrom, dateTo, userId),
  });
}

export function useInvestmentSummary() {
  return useQuery({
    queryKey: ["analytics", "investments"],
    queryFn: getInvestmentSummary,
  });
}
