import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBudgets, createBudget } from "@/api/budgets";

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: getBudgets,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
