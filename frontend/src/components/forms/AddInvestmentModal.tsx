import { useState, useRef, useEffect, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCreateInvestment } from "@/hooks/useInvestments";
import { useAssetSearch, useQuote } from "@/hooks/useMarket";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { cn } from "@/utils/cn";

const categoryLabel: Record<string, string> = {
  stocks: "Stocks",
  bonds: "Bonds",
  crypto: "Crypto",
  real_estate: "Real Estate",
  mutual_funds: "Mutual Funds",
  etfs: "ETFs",
  custom: "Custom",
};

interface Props {
  open: boolean;
  onClose: () => void;
  prefillTicker?: string;
  prefillName?: string;
  prefillCategory?: string;
}

export default function AddInvestmentModal({
  open,
  onClose,
  prefillTicker,
  prefillName,
  prefillCategory,
}: Props) {
  const formatCurrency = useFormatCurrency();

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  // Apply prefill values when modal opens with them
  useEffect(() => {
    if (open && prefillTicker) {
      setTicker(prefillTicker);
      setSearchQuery(prefillTicker);
      if (prefillName) setName(prefillName);
      if (prefillCategory) setCategory(prefillCategory);
    }
  }, [open, prefillTicker, prefillName, prefillCategory]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults, isLoading: searchLoading } = useAssetSearch(searchQuery);
  const { data: quote, isLoading: quoteLoading } = useQuote(
    ticker || undefined,
    category || undefined,
  );

  const create = useCreateInvestment();

  const qty = Number(quantity) || 0;
  const purchPx = Number(purchasePrice) || 0;
  const totalInvested = qty * purchPx;
  const marketPrice = quote?.price ?? 0;
  const currentValue = ticker && qty > 0 && marketPrice > 0 ? qty * marketPrice : 0;

  const reset = () => {
    setSearchQuery("");
    setShowDropdown(false);
    setTicker("");
    setName("");
    setCategory("");
    setQuantity("");
    setPurchasePrice("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectAsset = (asset: { symbol: string; name: string; category: string }) => {
    setTicker(asset.symbol);
    setName(asset.name);
    setCategory(asset.category);
    setSearchQuery(asset.symbol);
    setShowDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || qty <= 0 || purchPx <= 0) return;

    create.mutate(
      {
        name: name.trim(),
        ticker: ticker || undefined,
        category: category || "custom",
        quantity: qty,
        purchase_price: purchPx,
        amount_invested: totalInvested,
        current_value: currentValue > 0 ? currentValue : totalInvested,
        expected_return_pct: 0,
        income_allocation_pct: 0,
      },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Investment" className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ticker search */}
        <div className="relative" ref={dropdownRef}>
          <label
            htmlFor="inv-search"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Search Asset
          </label>
          <input
            ref={searchInputRef}
            id="inv-search"
            type="text"
            placeholder="Search by ticker or name..."
            className={cn(
              "mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500",
              "border-gray-300 dark:border-gray-600",
            )}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
              // Clear selection if user edits the search after selecting
              if (ticker && e.target.value !== ticker) {
                setTicker("");
                setName("");
                setCategory("");
              }
            }}
            onFocus={() => {
              if (searchQuery.length >= 2) setShowDropdown(true);
            }}
            autoComplete="off"
          />
          {showDropdown && searchQuery.length >= 2 && (
            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {searchLoading ? (
                <div className="flex items-center justify-center px-4 py-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    Searching...
                  </span>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((asset) => (
                  <button
                    key={`${asset.symbol}-${asset.category}`}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSelectAsset(asset)}
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {asset.symbol.slice(0, 3)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {asset.symbol}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {asset.name}
                      </p>
                    </div>
                    <Badge color="gray">
                      {categoryLabel[asset.category] ?? asset.category}
                    </Badge>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected asset info */}
        {ticker && (
          <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 dark:border-primary-800 dark:bg-primary-950">
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              {ticker}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{name}</span>
            <Badge color="teal">{categoryLabel[category] ?? category}</Badge>
            <div className="ml-auto text-right">
              {quoteLoading ? (
                <span className="text-xs text-gray-400">Loading price...</span>
              ) : quote ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(quote.price)}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      quote.change_24h_pct >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {quote.change_24h_pct >= 0 ? "+" : ""}
                    {quote.change_24h_pct.toFixed(2)}%
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Price unavailable</span>
              )}
            </div>
          </div>
        )}

        {/* Name (auto-filled or manual) */}
        <Input
          label="Name"
          id="inv-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={ticker ? "Auto-filled from search" : "e.g. Apple Inc."}
        />

        {/* Quantity */}
        <Input
          label="Quantity"
          id="inv-quantity"
          type="number"
          required
          min={0.000001}
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Number of shares/units"
        />

        {/* Purchase price per unit */}
        <Input
          label="Purchase Price per Unit"
          id="inv-purchase-price"
          type="number"
          required
          min={0.01}
          step="any"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          placeholder="Price you paid per unit"
        />

        {/* Computed fields */}
        {qty > 0 && purchPx > 0 && (
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Invested</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current Value</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {currentValue > 0 ? formatCurrency(currentValue) : "\u2014"}
              </p>
            </div>
            {currentValue > 0 && (
              <>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">P&L</p>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      currentValue >= totalInvested
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {currentValue >= totalInvested ? "+" : ""}
                    {formatCurrency(currentValue - totalInvested)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">P&L %</p>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      currentValue >= totalInvested
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {currentValue >= totalInvested ? "+" : ""}
                    {(((currentValue - totalInvested) / totalInvested) * 100).toFixed(2)}%
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Saving..." : "Add Investment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
