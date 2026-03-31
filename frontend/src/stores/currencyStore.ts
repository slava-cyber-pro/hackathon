import { create } from "zustand";

export interface CurrencyInfo {
  code: string;
  name: string;
}

// Well-known symbols for common currencies. Others show the code.
const SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "\u20AC", GBP: "\u00A3", JPY: "\u00A5", CNY: "\u00A5",
  CAD: "C$", AUD: "A$", CHF: "Fr", INR: "\u20B9", UAH: "\u20B4",
  KRW: "\u20A9", BRL: "R$", MXN: "Mex$", PLN: "z\u0142", SEK: "kr",
  NOK: "kr", DKK: "kr", CZK: "K\u010D", HUF: "Ft", TRY: "\u20BA",
  THB: "\u0E3F", ILS: "\u20AA", ZAR: "R", SGD: "S$", HKD: "HK$",
  NZD: "NZ$", PHP: "\u20B1", TWD: "NT$", RUB: "\u20BD",
};

export function getCurrencySymbol(code: string): string {
  return SYMBOLS[code] ?? code;
}

interface CurrencyState {
  currency: string;
  rates: Record<string, number>;
  allCurrencies: CurrencyInfo[];
  lastFetched: number | null;
  loading: boolean;
  setCurrency: (code: string) => void;
  setRates: (rates: Record<string, number>, names: Record<string, string>) => void;
  setLoading: (loading: boolean) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: localStorage.getItem("currency") ?? "USD",
  rates: { USD: 1 },
  allCurrencies: [{ code: "USD", name: "US Dollar" }],
  lastFetched: null,
  loading: false,
  setCurrency: (currency) => {
    localStorage.setItem("currency", currency);
    set({ currency });
  },
  setRates: (rates, names) => {
    const allCurrencies = Object.keys(rates)
      .sort()
      .map((code) => ({ code, name: names[code] ?? code }));
    set({ rates, allCurrencies, lastFetched: Date.now() });
  },
  setLoading: (loading) => set({ loading }),
}));
