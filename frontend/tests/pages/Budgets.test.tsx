import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/hooks/useFormatCurrency", () => ({
  useFormatCurrency: () => (n: number) => `$${n.toFixed(2)}`,
}));
vi.mock("@/hooks/useBudgets", () => ({
  useBudgets: () => ({
    data: [
      { id: "1", category_name: "Groceries", category_icon: "🛒", amount_limit: "600", spent: "450", period: "monthly", period_start: "2026-03-01" },
      { id: "2", category_name: "Rent", category_icon: "🏠", amount_limit: "1500", spent: "1500", period: "monthly", period_start: "2026-03-01" },
    ],
    isLoading: false,
  }),
  useCreateBudget: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/useTeamMembers", () => ({
  useMyTeamMembers: () => ({ hasTeam: false, isOwner: false, teamId: null }),
}));
vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({ data: [] }),
}));

import Budgets from "@/pages/Budgets";

describe("Budgets", () => {
  it('renders "Budgets" heading', () => {
    render(<Budgets />);
    expect(screen.getByText("Budgets")).toBeInTheDocument();
  });

  it('renders "Set New Limit" button', () => {
    render(<Budgets />);
    expect(screen.getByRole("button", { name: "Set New Limit" })).toBeInTheDocument();
  });

  it("renders period toggle pills", () => {
    render(<Budgets />);
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Quarterly")).toBeInTheDocument();
    expect(screen.getByText("Yearly")).toBeInTheDocument();
  });

  it("renders budget cards with category names", () => {
    render(<Budgets />);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
  });

  it("renders progress bars", () => {
    const { container } = render(<Budgets />);
    const bars = container.querySelectorAll(".rounded-full.h-2");
    expect(bars.length).toBeGreaterThanOrEqual(2);
  });

  it("shows spent/limit amounts", () => {
    render(<Budgets />);
    expect(screen.getByText(/\$450\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$600\.00/)).toBeInTheDocument();
  });
});
