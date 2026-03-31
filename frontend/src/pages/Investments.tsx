import { lazy, Suspense, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatPercent } from "@/utils/format";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { cn } from "@/utils/cn";
import { INVESTMENT_CATEGORY_COLORS, INVESTMENT_CATEGORY_LABELS } from "@/utils/constants";
import InvestmentAllocationChart from "@/components/charts/InvestmentAllocationChart";
import { useInvestments } from "@/hooks/useInvestments";
import { useInvestmentSummary } from "@/hooks/useAnalytics";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import AddInvestmentModal from "@/components/forms/AddInvestmentModal";
import StatCard from "@/components/investments/StatCard";
import InvestmentCard from "@/components/investments/InvestmentCard";
import PriceChart from "@/components/investments/PriceChart";
import type { InvestmentCategory } from "@/types";

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
      name: INVESTMENT_CATEGORY_LABELS[cat as InvestmentCategory] ?? cat,
      value,
      color: INVESTMENT_CATEGORY_COLORS[cat as InvestmentCategory] ?? "#6b7280",
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
