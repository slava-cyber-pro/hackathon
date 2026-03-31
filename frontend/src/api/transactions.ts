import apiClient from "./client";
import type { Transaction } from "@/types";

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export async function getTransactions(params?: {
  page?: number;
  size?: number;
  type?: string;
  category_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  user_id?: string;
}): Promise<PaginatedTransactions> {
  const { data } = await apiClient.get<PaginatedTransactions>("/transactions", { params });
  return data;
}

export async function createTransaction(payload: {
  category_id: string;
  type: "income" | "expense";
  amount: number;
  description?: string;
  date: string;
}): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>("/transactions", payload);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
