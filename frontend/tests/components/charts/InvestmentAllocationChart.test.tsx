import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import InvestmentAllocationChart from "@/components/charts/InvestmentAllocationChart";

describe("InvestmentAllocationChart", () => {
  it("renders without crashing", () => {
    const data = [{ name: "Stocks", value: 5000, color: "#0f0" }];
    expect(() => render(<InvestmentAllocationChart data={data} />)).not.toThrow();
  });

  it("renders with empty data", () => {
    expect(() => render(<InvestmentAllocationChart data={[]} />)).not.toThrow();
  });
});
