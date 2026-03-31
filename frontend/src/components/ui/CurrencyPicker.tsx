import { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";
import { useCurrency } from "@/hooks/useCurrency";
import { getCurrencySymbol } from "@/stores/currencyStore";

export default function CurrencyPicker({ className }: { className?: string }) {
  const { currency, setCurrency, allCurrencies, loading, symbol } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const filtered = search
    ? allCurrencies.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allCurrencies;

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <span className="font-medium">{symbol}</span>
        <span>{currency}</span>
        {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />}
        <span className="text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-64 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-2 dark:border-gray-700">
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currency..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-center text-sm text-gray-400">No currencies found</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setCurrency(c.code); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700",
                    currency === c.code ? "font-medium text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-300",
                  )}
                >
                  <span className="w-8 text-right text-xs text-gray-400">{getCurrencySymbol(c.code)}</span>
                  <span className="font-medium">{c.code}</span>
                  <span className="truncate text-gray-500 dark:text-gray-400">{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
