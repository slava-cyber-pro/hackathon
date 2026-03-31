import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/hooks/useFormatCurrency", () => ({
  useFormatCurrency: () => (n: number) => `$${n.toFixed(2)}`,
}));
vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: () => ({ data: { items: [] }, isLoading: false }),
}));
vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/hooks/useBudgets", () => ({
  useBudgets: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/hooks/useAnalytics", () => ({
  useSpendingByCategory: () => ({ data: [], isLoading: false }),
  useIncomeVsExpenses: () => ({ data: [], isLoading: false }),
  useInvestmentSummary: () => ({ data: { total_invested: "0", total_current_value: "0", total_return_pct: "0" }, isLoading: false }),
}));
vi.mock("@/hooks/useTeamMembers", () => ({
  useMyTeamMembers: () => ({ members: [], hasTeam: false }),
}));
vi.mock("@/stores/authStore", () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: { display_name: "Alex" }, isAuthenticated: true }),
}));
vi.mock("@/components/charts/SpendingPieChart", () => ({ default: () => <div /> }));
vi.mock("@/components/charts/IncomeTrendChart", () => ({ default: () => <div /> }));

import Dashboard from "@/pages/Dashboard";

describe("Dashboard", () => {
  it("renders greeting with user name", () => {
    render(<Dashboard />);
    expect(screen.getByText(/Alex/)).toBeInTheDocument();
  });

  it("renders summary cards", () => {
    render(<Dashboard />);
    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("Monthly Income")).toBeInTheDocument();
    expect(screen.getByText("Monthly Spending")).toBeInTheDocument();
    expect(screen.getByText("Investments")).toBeInTheDocument();
  });

  it('renders "Spending by Category" section', () => {
    render(<Dashboard />);
    expect(screen.getByText("Spending by Category")).toBeInTheDocument();
  });

  it('renders "Income vs Expenses" section', () => {
    render(<Dashboard />);
    expect(screen.getByText("Income vs Expenses")).toBeInTheDocument();
  });

  it('renders "Recent Transactions" section', () => {
    render(<Dashboard />);
    expect(screen.getByText("Recent Transactions")).toBeInTheDocument();
  });
});
