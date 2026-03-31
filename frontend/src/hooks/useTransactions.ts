import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTransactions, createTransaction, deleteTransaction } from "@/api/transactions";

export function useTransactions(params?: {
  page?: number;
  size?: number;
  type?: string;
  category_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  user_id?: string;
}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => getTransactions(params),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}
