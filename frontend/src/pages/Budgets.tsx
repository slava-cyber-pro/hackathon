import { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { cn } from "@/utils/cn";
import { useBudgets } from "@/hooks/useBudgets";
import AddBudgetModal from "@/components/forms/AddBudgetModal";
import { useMyTeamMembers } from "@/hooks/useTeamMembers";

type PeriodFilter = "weekly" | "monthly" | "quarterly" | "yearly";

const periodLabels: Record<PeriodFilter, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const periods: PeriodFilter[] = ["weekly", "monthly", "quarterly", "yearly"];

function Budgets() {
  const formatCurrency = useFormatCurrency();
  const [activePeriod, setActivePeriod] = useState<PeriodFilter>("monthly");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const { data: budgets, isLoading } = useBudgets();
  const { hasTeam, isOwner, teamId } = useMyTeamMembers();

  const filteredBudgets = useMemo(
    () =>
      (budgets ?? []).filter(
        (b) => b.period === activePeriod || b.period === "custom",
      ),
    [budgets, activePeriod],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Budgets
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)}>Set New Limit</Button>
          {hasTeam && isOwner && (
            <Button variant="secondary" onClick={() => setShowTeamModal(true)}>Set Team Limit</Button>
          )}
        </div>
      </div>

      {/* Period Toggle Pills */}
      <div className="flex flex-wrap gap-2">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activePeriod === period
                ? "bg-primary-600 text-white dark:bg-primary-500"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
            )}
          >
            {periodLabels[period]}
          </button>
        ))}
      </div>

      {/* Budget Cards Grid */}
      {filteredBudgets.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">No budgets yet</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a budget to start tracking your spending limits.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredBudgets.map((budget) => {
            const spent = parseFloat(String(budget.spent ?? 0));
            const limit = parseFloat(String(budget.amount_limit));
            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const exceeded = spent > limit;
            const remaining = limit - spent;

            const catName = budget.category_name;
            const catIcon = budget.category_icon ?? "";

            return (
              <Card key={budget.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {catIcon && <span className="text-xl">{catIcon}</span>}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {catName}
                    </span>
                    {budget.is_team_budget && <Badge color="blue">Team</Badge>}
                  </div>
                  <Badge
                    color={exceeded ? "red" : pct >= 80 ? "amber" : "teal"}
                  >
                    {pct}%
                  </Badge>
                </div>
                {budget.user_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{budget.user_name}</p>
                )}

                <ProgressBar value={spent} max={limit} />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatCurrency(spent)} / {formatCurrency(limit)}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      exceeded
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {exceeded
                      ? `${formatCurrency(Math.abs(remaining))} exceeded`
                      : `${formatCurrency(remaining)} remaining`}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddBudgetModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      {hasTeam && isOwner && teamId && (
        <AddBudgetModal open={showTeamModal} onClose={() => setShowTeamModal(false)} teamId={teamId} />
      )}
    </div>
  );
}

export default Budgets;
