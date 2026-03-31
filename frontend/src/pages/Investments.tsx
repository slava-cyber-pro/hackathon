import { lazy, Suspense, useId, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { BadgeColor } from "@/components/ui/Badge";
import { formatPercent } from "@/utils/format";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { cn } from "@/utils/cn";
import InvestmentAllocationChart from "@/components/charts/InvestmentAllocationChart";
import Sparkline from "@/components/charts/Sparkline";
import { useInvestments } from "@/hooks/useInvestments";
import { useInvestmentSummary } from "@/hooks/useAnalytics";
import { useQuote, usePriceHistory } from "@/hooks/useMarket";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import AddInvestmentModal from "@/components/forms/AddInvestmentModal";
import type { Investment, InvestmentCategory } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const categoryBadgeColor: Record<InvestmentCategory, BadgeColor> = {
  stocks: "blue",
  bonds: "purple",
  crypto: "amber",
  real_estate: "green",
  mutual_funds: "teal",
  etfs: "teal",
  custom: "gray",
};

const categoryChartColor: Record<InvestmentCategory, string> = {
  stocks: "#3b82f6",
  bonds: "#8b5cf6",
  crypto: "#f59e0b",
  real_estate: "#22c55e",
  mutual_funds: "#14b8a6",
  etfs: "#06b6d4",
  custom: "#6b7280",
};

const categoryLabel: Record<InvestmentCategory, string> = {
  stocks: "Stocks",
  bonds: "Bonds",
  crypto: "Crypto",
  real_estate: "Real Estate",
  mutual_funds: "Mutual Funds",
  etfs: "ETFs",
  custom: "Custom",
};

const PERIOD_OPTIONS = [
  { label: "1W", value: "1wk" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  subtext,
  positive,
}: {
  label: string;
  value: string;
  subtext?: string;
  positive?: boolean | null;
}) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "text-xl font-bold",
          positive === true && "text-green-600 dark:text-green-400",
          positive === false && "text-red-600 dark:text-red-400",
          positive === null || positive === undefined
            ? "text-gray-900 dark:text-gray-100"
            : "",
        )}
      >
        {value}
      </p>
      {subtext && (
        <p
          className={cn(
            "text-xs font-medium",
            positive === true && "text-green-600 dark:text-green-400",
            positive === false && "text-red-600 dark:text-red-400",
            positive === null || positive === undefined
              ? "text-gray-500 dark:text-gray-400"
              : "",
          )}
        >
          {subtext}
        </p>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// LivePriceBadge — shows quote price + 24h change with a pulsing dot
// ---------------------------------------------------------------------------

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
      {/* Pulsing live dot */}
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

// ---------------------------------------------------------------------------
// SparklineWrapper — fetches history + renders Sparkline
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// InvestmentCard
// ---------------------------------------------------------------------------

function InvestmentCard({
  inv,
  isSelected,
  onSelect,
  formatCurrency,
}: {
  inv: Investment;
  isSelected: boolean;
  onSelect: () => void;
  formatCurrency: (n: number) => string;
}) {
  const amountInvested = parseFloat(String(inv.amount_invested));
  const currentValue = parseFloat(String(inv.current_value));
  const gain = currentValue - amountInvested;
  const gainPct = amountInvested > 0 ? (gain / amountInvested) * 100 : 0;
  const isPositive = gain >= 0;
  const badgeColor = categoryBadgeColor[inv.category] ?? "gray";
  const label = categoryLabel[inv.category] ?? inv.category;
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
          {/* Live price */}
          {hasTicker && (
            <div className="hidden sm:block">
              <LivePriceBadge
                ticker={inv.ticker!}
                category={inv.category}
                formatCurrency={formatCurrency}
              />
            </div>
          )}

          {/* Sparkline */}
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

// ---------------------------------------------------------------------------
// PriceChart — full price history chart for selected holding
// ---------------------------------------------------------------------------

function PriceChart({
  ticker,
  category,
  name,
}: {
  ticker: string;
  category: string;
  name: string;
}) {
  const [period, setPeriod] = useState("3mo");
  const { data: history, isLoading, isError } = usePriceHistory(ticker, category, period);
  const gradientId = useId();

  const chartData = useMemo(
    () =>
      history
        ? history.map((p) => ({
            date: new Date(p.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            close: p.close,
          }))
        : [],
    [history],
  );

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {ticker} &mdash; {name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Price history
          </p>
        </div>
        <div className="flex items-center gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={period === opt.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : isError || chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Price history unavailable
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v) =>
                v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(2)}`
              }
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Price"]}
              contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#14b8a6"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function PortfolioTab() {
  const formatCurrency = useFormatCurrency();
  const [showAddModal, setShowAddModal] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const investParams = useMemo(
    () => ({
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    }),
    [dateFrom, dateTo],
  );

  const { data: investmentPage, isLoading: invLoading } =
    useInvestments(investParams);
  const { data: summary, isLoading: sumLoading } = useInvestmentSummary();

  const investments = investmentPage?.items ?? [];

  // Portfolio aggregates from the summary endpoint
  const totalCurrentValue = summary
    ? parseFloat(String(summary.total_current_value))
    : 0;
  const totalReturnPct = summary
    ? parseFloat(String(summary.total_return_pct))
    : 0;

  // Calculated aggregates from the holdings list
  const totalInvested = useMemo(
    () =>
      investments.reduce(
        (sum, inv) => sum + parseFloat(String(inv.amount_invested)),
        0,
      ),
    [investments],
  );

  const totalPL = totalCurrentValue - totalInvested;
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  // Allocation data for donut chart
  const allocationData = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const inv of investments) {
      const cat = inv.category;
      grouped.set(
        cat,
        (grouped.get(cat) ?? 0) + parseFloat(String(inv.current_value)),
      );
    }
    return Array.from(grouped.entries()).map(([cat, value]) => ({
      name: categoryLabel[cat as InvestmentCategory] ?? cat,
      value,
      color: categoryChartColor[cat as InvestmentCategory] ?? "#6b7280",
    }));
  }, [investments]);

  const selectedInvestment = selectedId
    ? investments.find((inv) => inv.id === selectedId) ?? null
    : null;

  const isLoading = invLoading || sumLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Investments
        </h1>
        <Button onClick={() => setShowAddModal(true)}>+ Add Investment</Button>
      </div>

      <DateRangeFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={() => {
          setDateFrom("");
          setDateTo("");
        }}
      />

      {investments.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">
              No investments yet
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add your first investment to start tracking your portfolio.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* A. Portfolio Summary — 4 stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Value"
              value={formatCurrency(totalCurrentValue)}
            />
            <StatCard
              label="Total Invested"
              value={formatCurrency(totalInvested)}
            />
            <StatCard
              label="Unrealized P&L"
              value={`${totalPL >= 0 ? "+" : ""}${formatCurrency(totalPL)}`}
              subtext={formatPercent(totalPLPct)}
              positive={totalPL >= 0 ? true : totalPL < 0 ? false : null}
            />
            <StatCard
              label="All-Time Return"
              value={formatPercent(totalReturnPct)}
              positive={
                totalReturnPct >= 0
                  ? true
                  : totalReturnPct < 0
                    ? false
                    : null
              }
            />
          </div>

          {/* B. Holdings List + D. Allocation donut */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Holdings */}
            <div className="space-y-3 lg:col-span-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Holdings
              </h2>
              {investments.map((inv) => (
                <InvestmentCard
                  key={inv.id}
                  inv={inv}
                  isSelected={selectedId === inv.id}
                  onSelect={() =>
                    setSelectedId((prev) =>
                      prev === inv.id ? null : inv.id,
                    )
                  }
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>

            {/* Allocation donut */}
            <Card className="lg:col-span-2">
              <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Portfolio Allocation
              </h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Distribution by asset class
              </p>
              <div className="flex flex-col items-center">
                <div className="h-56 w-56">
                  <InvestmentAllocationChart data={allocationData} />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalCurrentValue)}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm font-medium",
                      totalReturnPct >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {formatPercent(totalReturnPct)} all-time return
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* C. Price Chart (when a holding is selected) */}
          {selectedInvestment && selectedInvestment.ticker && (
            <PriceChart
              ticker={selectedInvestment.ticker}
              category={selectedInvestment.category}
              name={selectedInvestment.name}
            />
          )}
        </>
      )}

      <AddInvestmentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab wrapper — My Portfolio | Market
// ---------------------------------------------------------------------------

const MarketTab = lazy(() => import("@/pages/Market"));

type InvestTab = "portfolio" | "market";

export default function Investments() {
  const [tab, setTab] = useState<InvestTab>("portfolio");

  return (
    <div className="space-y-6">
      {/* Tab header */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {([
          { key: "portfolio" as const, label: "My Portfolio", icon: "📈" },
          { key: "market" as const, label: "Market", icon: "🏛️" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors -mb-px",
              tab === t.key
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "portfolio" ? (
        <PortfolioTab />
      ) : (
        <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>}>
          <MarketTab />
        </Suspense>
      )}
    </div>
  );
}
