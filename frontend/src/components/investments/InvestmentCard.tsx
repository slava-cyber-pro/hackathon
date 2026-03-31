import { useMemo } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { BadgeColor } from "@/components/ui/Badge";
import { formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";
import { INVESTMENT_CATEGORY_LABELS } from "@/utils/constants";
import Sparkline from "@/components/charts/Sparkline";
import { useQuote, usePriceHistory } from "@/hooks/useMarket";
import type { Investment, InvestmentCategory } from "@/types";

const categoryBadgeColor: Record<InvestmentCategory, BadgeColor> = {
  stocks: "blue",
  bonds: "purple",
  crypto: "amber",
  real_estate: "green",
  mutual_funds: "teal",
  etfs: "teal",
  custom: "gray",
};

function LivePriceBadge({
  ticker,
  category,
  formatCurrency,
}: {
  ticker: string;
  category: string;
  formatCurrency: (n: number) => string;
}) {
  const { data: quote, isLoading, isError } = useQuote(ticker, category);

  if (isLoading) {
    return <span className="text-xs text-gray-400">Loading...</span>;
  }
  if (isError || !quote) {
    return <span className="text-xs text-gray-400">&mdash;</span>;
  }

  const pct = quote.change_24h_pct;
  const isUp = pct >= 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {formatCurrency(quote.price)}
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          isUp
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400",
        )}
      >
        {isUp ? "+" : ""}
        {pct.toFixed(2)}%
      </span>
    </div>
  );
}

function SparklineWrapper({
  ticker,
  category,
}: {
  ticker: string;
  category: string;
}) {
  const { data: history } = usePriceHistory(ticker, category, "1mo");
  const closes = useMemo(
    () => (history ? history.map((p) => p.close) : []),
    [history],
  );

  if (closes.length < 2) {
    return (
      <div className="flex h-[40px] w-[100px] items-center justify-center text-xs text-gray-400">
        --
      </div>
    );
  }

  const color = closes[closes.length - 1] >= closes[0] ? "#22c55e" : "#ef4444";

  return <Sparkline data={closes} color={color} width={100} height={40} />;
}

export interface InvestmentCardProps {
  inv: Investment;
  isSelected: boolean;
  onSelect: () => void;
  formatCurrency: (n: number) => string;
}

export default function InvestmentCard({
  inv,
  isSelected,
  onSelect,
  formatCurrency,
}: InvestmentCardProps) {
  const amountInvested = parseFloat(String(inv.amount_invested));
  const currentValue = parseFloat(String(inv.current_value));
  const gain = currentValue - amountInvested;
  const gainPct = amountInvested > 0 ? (gain / amountInvested) * 100 : 0;
  const isPositive = gain >= 0;
  const badgeColor = categoryBadgeColor[inv.category] ?? "gray";
  const label = INVESTMENT_CATEGORY_LABELS[inv.category] ?? inv.category;
  const tickerDisplay = inv.ticker || inv.name.slice(0, 4).toUpperCase();
  const hasTicker = !!inv.ticker;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected &&
          "ring-2 ring-primary-500 dark:ring-primary-400",
      )}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: identity */}
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {tickerDisplay.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {hasTicker && (
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                  {inv.ticker}
                </span>
              )}
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {inv.name}
              </p>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge color={badgeColor}>{label}</Badge>
              {inv.quantity != null && inv.quantity > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {inv.quantity} units
                </span>
              )}
              {inv.user_name && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {inv.user_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: metrics */}
        <div className="flex items-center gap-4 sm:gap-6">
          {hasTicker && (
            <div className="hidden sm:block">
              <LivePriceBadge
                ticker={inv.ticker!}
                category={inv.category}
                formatCurrency={formatCurrency}
              />
            </div>
          )}

          {hasTicker && (
            <div className="hidden md:block">
              <SparklineWrapper ticker={inv.ticker!} category={inv.category} />
            </div>
          )}

          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Invested</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatCurrency(amountInvested)}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(currentValue)}
            </p>
          </div>

          <div className="text-right min-w-[72px]">
            <p className="text-xs text-gray-500 dark:text-gray-400">P&L</p>
            <p
              className={cn(
                "text-sm font-semibold",
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(gain)}
            </p>
            <p
              className={cn(
                "text-xs",
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {formatPercent(gainPct)}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile live price row */}
      {hasTicker && (
        <div className="mt-2 flex items-center justify-between sm:hidden">
          <LivePriceBadge
            ticker={inv.ticker!}
            category={inv.category}
            formatCurrency={formatCurrency}
          />
          <SparklineWrapper ticker={inv.ticker!} category={inv.category} />
        </div>
      )}
    </Card>
  );
}
