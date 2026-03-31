import { useState, useCallback, useMemo } from "react";
import { cn } from "@/utils/cn";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { useMarketBrowse, useAssetSearch } from "@/hooks/useMarket";
import AssetRow from "@/components/market/AssetRow";
import AssetDetail from "@/components/market/AssetDetail";
import MarketSkeleton from "@/components/market/MarketSkeleton";
import AddInvestmentModal from "@/components/forms/AddInvestmentModal";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { key: "crypto", label: "Crypto", icon: "\uD83E\uDE99" },
  { key: "stocks", label: "Stocks", icon: "\uD83D\uDCC8" },
  { key: "etfs", label: "ETFs", icon: "\uD83D\uDCCA" },
  { key: "commodities", label: "Commodities", icon: "\uD83D\uDEE2\uFE0F" },
  { key: "indices", label: "Indices", icon: "\uD83D\uDCC9" },
  { key: "forex", label: "Forex", icon: "\uD83D\uDCB1" },
  { key: "bonds", label: "Bonds", icon: "\uD83C\uDFE6" },
] as const;

// ---------------------------------------------------------------------------
// Market page
// ---------------------------------------------------------------------------

export default function Market() {
  const formatCurrency = useFormatCurrency();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].key);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefill, setPrefill] = useState<{
    ticker: string;
    name: string;
    category: string;
  } | null>(null);

  const { data: assets, isLoading, isError } = useMarketBrowse(activeCategory);

  // Backend search when user types 2+ chars
  const { data: searchResults, isLoading: searchLoading } = useAssetSearch(search, activeCategory);

  // If searching, show search results mapped to BrowseAsset shape; otherwise filter local list
  const displayAssets = useMemo(() => {
    if (!search.trim()) return assets ?? [];

    const q = search.toLowerCase();

    // First try client-side filter on already-loaded assets
    const localMatches = (assets ?? []).filter(
      (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
    );

    if (localMatches.length > 0) return localMatches;

    // Fall back to backend search results
    if (searchResults && searchResults.length > 0) {
      return searchResults.map((r) => ({
        symbol: r.symbol,
        name: r.name,
        price: 0,
        change_24h_pct: 0,
        category: r.category || activeCategory,
      }));
    }

    return [];
  }, [assets, search, searchResults, activeCategory]);

  const handleCategoryChange = useCallback((key: string) => {
    setActiveCategory(key);
    setSelectedTicker(null);
    setSearch("");
  }, []);

  const openAddModal = useCallback(
    (ticker: string, name: string, category: string) => {
      setPrefill({ ticker, name, category });
      setShowAddModal(true);
    },
    [],
  );

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setPrefill(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Market
      </h1>

      {/* Category tabs */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max border-b border-gray-200 dark:border-gray-700">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
                activeCategory === cat.key
                  ? "border-b-2 border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
              )}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      {!selectedTicker && (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ticker..."
            className={cn(
              "w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-colors",
              "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500",
              "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
            )}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
          {searchLoading && search.length >= 2 && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {selectedTicker ? (
        <AssetDetail
          ticker={selectedTicker}
          category={activeCategory}
          formatCurrency={formatCurrency}
          onBack={() => setSelectedTicker(null)}
          onAdd={() => {
            const asset = assets?.find((a) => a.symbol === selectedTicker);
            openAddModal(
              selectedTicker,
              asset?.name ?? selectedTicker,
              activeCategory,
            );
          }}
        />
      ) : (
        <>
          {isLoading && <MarketSkeleton />}

          {isError && (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Failed to load market data. Try again.
              </p>
            </div>
          )}

          {!isLoading && !isError && displayAssets.length === 0 && (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {search ? "No assets found matching your search" : "No data available for this category"}
              </p>
            </div>
          )}

          {!isLoading && !isError && displayAssets.length > 0 && (
            <div className="space-y-2">
              {displayAssets.map((asset) => (
                <AssetRow
                  key={asset.symbol}
                  asset={asset}
                  formatCurrency={formatCurrency}
                  onSelect={() => setSelectedTicker(asset.symbol)}
                  onAdd={() =>
                    openAddModal(asset.symbol, asset.name, asset.category || activeCategory)
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Investment Modal */}
      <AddInvestmentModal
        open={showAddModal}
        onClose={closeAddModal}
        prefillTicker={prefill?.ticker}
        prefillName={prefill?.name}
        prefillCategory={prefill?.category}
      />
    </div>
  );
}
