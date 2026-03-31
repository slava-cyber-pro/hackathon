import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MobileNav from "@/components/layout/MobileNav";

function renderMobileNav() {
  return render(
    <MemoryRouter>
      <MobileNav />
    </MemoryRouter>,
  );
}

describe("MobileNav", () => {
  it("renders 5 tab items", () => {
    renderMobileNav();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
  });

  it("renders Home, Txns, Invest, Budgets, More labels", () => {
    renderMobileNav();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Txns")).toBeInTheDocument();
    expect(screen.getByText("Invest")).toBeInTheDocument();
    expect(screen.getByText("Budgets")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });
});
