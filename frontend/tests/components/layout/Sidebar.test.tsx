import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: { display_name: "Test User", email: "test@test.com" }, isAuthenticated: true, logout: vi.fn() }),
}));
vi.mock("@/hooks/useCurrency", () => ({
  useCurrency: () => ({ currency: "USD", symbol: "$", allCurrencies: [], loading: false, setCurrency: vi.fn() }),
}));
vi.mock("@/stores/currencyStore", () => ({
  getCurrencySymbol: () => "$",
  useCurrencyStore: () => ({}),
}));

import Sidebar from "@/components/layout/Sidebar";

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  it("renders BudgetSphere logo", () => {
    renderSidebar();
    expect(screen.getByText("BudgetSphere")).toBeInTheDocument();
  });

  it("renders 6 navigation items", () => {
    renderSidebar();
    const labels = ["Dashboard", "Transactions", "Investments", "Budgets", "Team", "Analytics"];
    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renders user profile section", () => {
    renderSidebar();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@test.com")).toBeInTheDocument();
  });
});
