import { cn } from "@/utils/cn";
import type { BrowseAsset } from "@/api/market";

interface Props {
  asset: BrowseAsset;
  formatCurrency: (n: number) => string;
  onSelect: () => void;
  onAdd: () => void;
}

export default function AssetRow({ asset, formatCurrency, onSelect, onAdd }: Props) {
  const isUp = asset.change_24h_pct >= 0;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all",
        "hover:border-primary-300 hover:shadow-md",
        "dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600",
      )}
    >
      {/* Symbol badge */}
      <span className="inline-flex h-8 min-w-[3.5rem] items-center justify-center rounded bg-gray-100 px-2 font-mono text-xs font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
        {asset.symbol}
      </span>

      {/* Name */}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
        {asset.name}
      </span>

      {/* Price */}
      <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
        {formatCurrency(asset.price)}
      </span>

      {/* 24h change */}
      <span
        className={cn(
          "min-w-[5rem] text-right text-sm font-bold tabular-nums",
          isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
        )}
      >
        {isUp ? "\u2191" : "\u2193"} {isUp ? "+" : ""}
        {asset.change_24h_pct.toFixed(2)}%
      </span>

      {/* Add to portfolio button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className={cn(
          "rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-all",
          "hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
        )}
      >
        + Portfolio
      </button>
    </div>
  );
}
