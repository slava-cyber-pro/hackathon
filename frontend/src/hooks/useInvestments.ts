import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvestments, createInvestment } from "@/api/investments";

export function useInvestments(params?: {
  page?: number;
  size?: number;
  date_from?: string;
  date_to?: string;
}) {
  return useQuery({
    queryKey: ["investments", params],
    queryFn: () => getInvestments(params),
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInvestment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}
