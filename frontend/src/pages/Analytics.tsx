import { useMemo } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SpendingPieChart from "@/components/charts/SpendingPieChart";
import IncomeTrendChart from "@/components/charts/IncomeTrendChart";
import BalanceAreaChart from "@/components/charts/BalanceAreaChart";
import InvestmentAllocationChart from "@/components/charts/InvestmentAllocationChart";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { cn } from "@/utils/cn";
import { useCategories } from "@/hooks/useCategories";
import { useInvestments } from "@/hooks/useInvestments";
import {
  useSpendingByCategory,
  useIncomeVsExpenses,
  useBalanceOverTime,
  useInvestmentSummary,
} from "@/hooks/useAnalytics";

const COLORS = [
  "#6366f1", "#14b8a6", "#f59e0b", "#f43f5e", "#8b5cf6",
  "#ec4899", "#10b981", "#64748b", "#06b6d4", "#84cc16",
];

const INV_COLORS: Record<string, string> = {
  stocks: "#6366f1", bonds: "#14b8a6", crypto: "#f43f5e",
  real_estate: "#f59e0b", mutual_funds: "#8b5cf6", etfs: "#10b981", custom: "#64748b",
};

function Analytics() {
  const formatCurrency = useFormatCurrency();
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const dateFrom = sixMonthsAgo.toISOString().slice(0, 10);
  const dateTo = now.toISOString().slice(0, 10);

  const { data: categories } = useCategories();
  const { data: spendingRaw, isLoading: l1 } = useSpendingByCategory(dateFrom, dateTo);
  const { data: incomeRaw, isLoading: l2 } = useIncomeVsExpenses(dateFrom, dateTo);
  const { data: balanceRaw, isLoading: l3 } = useBalanceOverTime(dateFrom, dateTo);
  const { data: investSummary, isLoading: l4 } = useInvestmentSummary();
  const { data: investPage } = useInvestments();

  const catMap = useMemo(() => {
    const m = new Map<string, string>();
    categories?.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const spendingData = useMemo(
    () => (spendingRaw ?? []).map((s, i) => ({
      name: catMap.get(s.category_id) ?? "Other",
      value: parseFloat(s.total),
      color: COLORS[i % COLORS.length],
    })),
    [spendingRaw, catMap],
  );

  const incomeData = useMemo(
    () => (incomeRaw ?? []).map((r) => ({
      month: r.month?.slice(0, 7) ?? "",
      income: parseFloat(r.income),
      expenses: parseFloat(r.expenses),
    })),
    [incomeRaw],
  );

  const balanceData = useMemo(
    () => (balanceRaw ?? []).map((r) => ({
      month: r.month?.slice(0, 7) ?? "",
      balance: parseFloat(r.balance),
    })),
    [balanceRaw],
  );

  const investmentChartData = useMemo(() => {
    const investments = investPage?.items ?? [];
    const grouped = new Map<string, number>();
    for (const inv of investments) {
      const cat = inv.category;
      grouped.set(cat, (grouped.get(cat) ?? 0) + parseFloat(String(inv.current_value)));
    }
    return Array.from(grouped.entries()).map(([cat, val]) => ({
      name: cat.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: val,
      color: INV_COLORS[cat] ?? "#64748b",
    }));
  }, [investPage]);

  const avgSpending = incomeData.length > 0
    ? incomeData.reduce((s, r) => s + r.expenses, 0) / incomeData.length
    : 0;
  const totalIncome = incomeData.reduce((s, r) => s + r.income, 0);
  const totalExpenses = incomeData.reduce((s, r) => s + r.expenses, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
  const topCategory = spendingData.length > 0
    ? [...spendingData].sort((a, b) => b.value - a.value)[0]?.name ?? "-"
    : "-";

  const isLoading = l1 || l2 || l3 || l4;

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last 6 months</p>
        </div>
        <Button variant="secondary">Export</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
          {spendingData.length > 0 ? <SpendingPieChart data={spendingData} /> : <p className="py-12 text-center text-sm text-gray-400">No spending data</p>}
        </Card>
        <Card>
          <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
          {incomeData.length > 0 ? <IncomeTrendChart data={incomeData} /> : <p className="py-12 text-center text-sm text-gray-400">No data</p>}
        </Card>
        <Card>
          <CardHeader><CardTitle>Balance Over Time</CardTitle></CardHeader>
          {balanceData.length > 0 ? <BalanceAreaChart data={balanceData} /> : <p className="py-12 text-center text-sm text-gray-400">No data</p>}
        </Card>
        <Card>
          <CardHeader><CardTitle>Investment Allocation</CardTitle></CardHeader>
          {investmentChartData.length > 0 ? <InvestmentAllocationChart data={investmentChartData} /> : <p className="py-12 text-center text-sm text-gray-400">No investments</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Monthly Spending</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(avgSpending)}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Savings Rate</p>
          <p className={cn("mt-2 text-2xl font-bold", savingsRate >= 0 ? "text-green-600" : "text-red-600")}>{savingsRate.toFixed(1)}%</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Category</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{topCategory}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invested</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(investSummary ? parseFloat(investSummary.total_current_value) : 0)}
            </p>
            {investSummary && parseFloat(investSummary.total_return_pct) !== 0 && (
              <Badge color={parseFloat(investSummary.total_return_pct) >= 0 ? "green" : "red"}>
                {parseFloat(investSummary.total_return_pct) >= 0 ? "+" : ""}{parseFloat(investSummary.total_return_pct).toFixed(1)}%
              </Badge>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Analytics;
