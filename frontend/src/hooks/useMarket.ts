import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  searchAssets,
  getQuote,
  getPriceHistory,
  browseMarket,
  getAssetDetail,
} from "@/api/market";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useAssetSearch(query: string, category?: string) {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery({
    queryKey: ["market", "search", debouncedQuery, category],
    queryFn: () => searchAssets(debouncedQuery, category),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useQuote(ticker: string | undefined, category: string | undefined) {
  return useQuery({
    queryKey: ["market", "quote", ticker, category],
    queryFn: () => getQuote(ticker!, category!),
    enabled: !!ticker && !!category,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePriceHistory(
  ticker: string | undefined,
  category: string | undefined,
  period?: string,
) {
  return useQuery({
    queryKey: ["market", "history", ticker, category, period],
    queryFn: () => getPriceHistory(ticker!, category!, period),
    enabled: !!ticker && !!category,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useMarketBrowse(category: string) {
  return useQuery({
    queryKey: ["market", "browse", category],
    queryFn: () => browseMarket(category),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useAssetDetail(
  ticker: string | undefined,
  category: string | undefined,
) {
  return useQuery({
    queryKey: ["market", "detail", ticker, category],
    queryFn: () => getAssetDetail(ticker!, category!),
    enabled: !!ticker && !!category,
    staleTime: 60_000,
    retry: 1,
  });
}
