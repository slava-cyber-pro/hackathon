import apiClient from "./client";
import type { Investment } from "@/types";

export interface PaginatedInvestments {
  items: Investment[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export async function getInvestments(params?: {
  page?: number;
  size?: number;
  date_from?: string;
  date_to?: string;
}): Promise<PaginatedInvestments> {
  const { data } = await apiClient.get<PaginatedInvestments>("/investments", { params });
  return data;
}

export async function createInvestment(payload: {
  category: string;
  name: string;
  ticker?: string;
  quantity?: number;
  purchase_price?: number;
  amount_invested: number;
  current_value: number;
  expected_return_pct: number;
  income_allocation_pct: number;
}): Promise<Investment> {
  const { data } = await apiClient.post<Investment>("/investments", payload);
  return data;
}
