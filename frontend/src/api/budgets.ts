import apiClient from "./client";
import type { Budget } from "@/types";

export async function getBudgets(): Promise<Budget[]> {
  const { data } = await apiClient.get<Budget[]>("/budgets");
  return data;
}

export async function createBudget(payload: {
  category_id?: string;
  amount_limit: number;
  period: string;
  period_start: string;
  period_end?: string;
  team_id?: string;
}): Promise<Budget> {
  const { data } = await apiClient.post<Budget>("/budgets", payload);
  return data;
}

export async function updateBudget(
  id: string,
  payload: { amount_limit?: number; period_end?: string },
): Promise<Budget> {
  const { data } = await apiClient.put<Budget>(`/budgets/${id}`, payload);
  return data;
}
