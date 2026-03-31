import { useMemo, useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import SpendingPieChart from "@/components/charts/SpendingPieChart";
import IncomeTrendChart from "@/components/charts/IncomeTrendChart";
import { formatDate } from "@/utils/format";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { cn } from "@/utils/cn";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAuthStore } from "@/stores/authStore";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useBudgets } from "@/hooks/useBudgets";
import { useSpendingByCategory, useIncomeVsExpenses, useInvestmentSummary } from "@/hooks/useAnalytics";
import { useMyTeamMembers } from "@/hooks/useTeamMembers";

const COLORS = [
  "#6366f1", "#f43f5e", "#f59e0b", "#14b8a6", "#8b5cf6",
  "#64748b", "#ec4899", "#06b6d4", "#84cc16", "#ef4444",
];

const NoData = ({ msg = "No data yet" }: { msg?: string }) => (
  <p className="py-12 text-center text-sm text-gray-400">{msg}</p>
);

function Dashboard() {
  const formatCurrency = useFormatCurrency();
  const user = useAuthStore((s) => s.user);
  const { members, hasTeam } = useMyTeamMembers();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);

  const now = new Date();
  const dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const dateTo = now.toISOString().slice(0, 10);

  const { data: txPage, isLoading: l1 } = useTransactions({ size: 5, ...(selectedUserId ? { user_id: selectedUserId } : {}) });
  const { data: categories, isLoading: l2 } = useCategories();
  const { data: spendingRaw, isLoading: l3 } = useSpendingByCategory(dateFrom, dateTo, selectedUserId);
  const { data: incomeRaw, isLoading: l4 } = useIncomeVsExpenses(dateFrom, dateTo, selectedUserId);
  const { data: investments, isLoading: l5 } = useInvestmentSummary();
  const { data: budgets, isLoading: l6 } = useBudgets();

  const catMap = useMemo(() => {
    const m = new Map<string, string>();
    categories?.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const spendingData = useMemo(
    () => (spendingRaw ?? []).map((s, i) => ({
      name: catMap.get(s.category_id) ?? "Unknown",
      value: parseFloat(s.total),
      color: COLORS[i % COLORS.length],
    })),
    [spendingRaw, catMap],
  );

  const incomeData = useMemo(
    () => (incomeRaw ?? []).map((r) => ({
      month: r.month,
      income: parseFloat(r.income),
      expenses: parseFloat(r.expenses),
    })),
    [incomeRaw],
  );

  const monthlyIncome = incomeData.reduce((s, r) => s + r.income, 0);
  const monthlySpending = incomeData.reduce((s, r) => s + r.expenses, 0);
  const totalInvested = investments ? parseFloat(investments.total_current_value) : 0;
  const investPct = investments ? parseFloat(investments.total_return_pct) : 0;

  const cards = [
    { label: "Total Balance", value: monthlyIncome - monthlySpending + totalInvested, icon: "\u{1F4B0}" },
    { label: "Monthly Income", value: monthlyIncome, icon: "\u{1F4C8}" },
    { label: "Monthly Spending", value: monthlySpending, icon: "\u{1F6D2}" },
    { label: "Investments", value: totalInvested, icon: "\u{1F4CA}", trend: investPct },
  ];

  if (l1 || l2 || l3 || l4 || l5 || l6) {
    return <div className="flex h-64 items-center justify-center"><p className="text-gray-500 dark:text-gray-400">Loading...</p></div>;
  }

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const today = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const transactions = txPage?.items ?? [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {greeting}, {user?.display_name ?? "there"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{today}</p>
      </div>

      {hasTeam && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedUserId(undefined)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              !selectedUserId
                ? "bg-primary-600 text-white dark:bg-primary-500"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
            )}
          >
            All
          </button>
          <button
            onClick={() => setSelectedUserId(user?.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              selectedUserId === user?.id
                ? "bg-primary-600 text-white dark:bg-primary-500"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
            )}
          >
            My Data
          </button>
          {members.filter((m) => m.user_id !== user?.id).map((m) => (
            <button
              key={m.user_id}
              onClick={() => setSelectedUserId(m.user_id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                selectedUserId === m.user_id
                  ? "bg-primary-600 text-white dark:bg-primary-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
              )}
            >
              {m.display_name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{c.label}</span>
              <span className="text-2xl">{c.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(c.value)}</p>
            {c.trend !== undefined && (
              <p className={cn("mt-1 text-sm font-medium", c.trend >= 0 ? "text-green-500" : "text-red-500")}>
                {c.trend >= 0 ? "\u2191" : "\u2193"} {Math.abs(c.trend).toFixed(1)}% return
              </p>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
          {spendingData.length > 0 ? <SpendingPieChart data={spendingData} /> : <NoData />}
        </Card>
        <Card>
          <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
          {incomeData.length > 0 ? <IncomeTrendChart data={incomeData} /> : <NoData />}
        </Card>
      </div>

      {(budgets ?? []).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Budget Usage</CardTitle></CardHeader>
          <div className="space-y-4">
            {(budgets ?? []).map((b) => {
              const spent = parseFloat(String(b.spent ?? 0));
              const limit = parseFloat(String(b.amount_limit));
              const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
              return (
                <div key={b.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {b.category_icon ?? ""} {b.category_name}
                    </span>
                    <span className={cn("font-medium", pct > 100 ? "text-red-500" : pct >= 80 ? "text-amber-500" : "text-gray-500")}>
                      {formatCurrency(spent)} / {formatCurrency(limit)} ({pct}%)
                    </span>
                  </div>
                  <ProgressBar value={spent} max={limit} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        {transactions.length === 0 ? <NoData msg="No transactions yet" /> : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {transactions.map((tx, i) => (
              <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {tx.description ?? tx.category?.name ?? "Transaction"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tx.category?.name ?? "Uncategorized"} &middot; {formatDate(tx.date)}{tx.user_name ? ` \u00b7 ${tx.user_name}` : ""}
                    </p>
                  </div>
                </div>
                <span className={cn("text-sm font-semibold", tx.type === "income" ? "text-green-500" : "text-red-500")}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default Dashboard;
