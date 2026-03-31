import apiClient from "./client";

export interface SpendingByCategory {
  category_id: string;
  total: string;
}

export interface IncomeVsExpenses {
  month: string;
  income: string;
  expenses: string;
}

export interface BalanceOverTime {
  month: string;
  balance: string;
}

export interface InvestmentSummary {
  total_invested: string;
  total_current_value: string;
  total_return_pct: string;
}

export async function getSpendingByCategory(dateFrom: string, dateTo: string, userId?: string): Promise<SpendingByCategory[]> {
  const { data } = await apiClient.get<SpendingByCategory[]>("/analytics/spending", {
    params: { date_from: dateFrom, date_to: dateTo, ...(userId ? { user_id: userId } : {}) },
  });
  return data;
}

export async function getIncomeVsExpenses(dateFrom: string, dateTo: string, userId?: string): Promise<IncomeVsExpenses[]> {
  const { data } = await apiClient.get<IncomeVsExpenses[]>("/analytics/income", {
    params: { date_from: dateFrom, date_to: dateTo, ...(userId ? { user_id: userId } : {}) },
  });
  return data;
}

export async function getBalanceOverTime(dateFrom: string, dateTo: string, userId?: string): Promise<BalanceOverTime[]> {
  const { data } = await apiClient.get<BalanceOverTime[]>("/analytics/balance", {
    params: { date_from: dateFrom, date_to: dateTo, ...(userId ? { user_id: userId } : {}) },
  });
  return data;
}

export async function getInvestmentSummary(): Promise<InvestmentSummary> {
  const { data } = await apiClient.get<InvestmentSummary>("/analytics/investments");
  return data;
}
