import { useEffect, useCallback } from "react";
import { useCurrencyStore, getCurrencySymbol } from "@/stores/currencyStore";

const RATE_API = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json";
const NAMES_API = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export function useCurrency() {
  const { currency, rates, allCurrencies, lastFetched, loading, setCurrency, setRates, setLoading } =
    useCurrencyStore();

  useEffect(() => {
    const shouldFetch = !lastFetched || Date.now() - lastFetched > CACHE_TTL;
    if (!shouldFetch || loading) return;

    setLoading(true);
    Promise.all([fetch(RATE_API).then((r) => r.json()), fetch(NAMES_API).then((r) => r.json())])
      .then(([rateData, nameData]) => {
        if (rateData?.usd) {
          const normalized: Record<string, number> = {};
          for (const [code, rate] of Object.entries(rateData.usd)) {
            if (typeof rate === "number" && rate > 0) {
              normalized[code.toUpperCase()] = rate;
            }
          }
          normalized["USD"] = 1;

          const names: Record<string, string> = {};
          if (nameData && typeof nameData === "object") {
            for (const [code, name] of Object.entries(nameData)) {
              if (typeof name === "string") {
                names[code.toUpperCase()] = name;
              }
            }
          }
          setRates(normalized, names);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lastFetched, loading, setLoading, setRates]);

  const convert = useCallback(
    (amountUsd: number): number => {
      if (currency === "USD") return amountUsd;
      const rate = rates[currency];
      return rate ? amountUsd * rate : amountUsd;
    },
    [currency, rates],
  );

  const formatAmount = useCallback(
    (amountUsd: number): string => {
      const converted = convert(amountUsd);
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(converted);
      } catch {
        // Fallback for unknown currency codes
        return `${getCurrencySymbol(currency)} ${converted.toFixed(2)}`;
      }
    },
    [convert, currency],
  );

  return {
    currency,
    setCurrency,
    convert,
    formatAmount,
    loading,
    allCurrencies,
    symbol: getCurrencySymbol(currency),
  };
}
