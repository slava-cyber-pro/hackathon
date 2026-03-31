import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SpendingPieChart from "@/components/charts/SpendingPieChart";

describe("SpendingPieChart", () => {
  it("renders without crashing with valid data", () => {
    const data = [{ name: "Food", value: 300, color: "#f00" }];
    expect(() => render(<SpendingPieChart data={data} />)).not.toThrow();
  });

  it("renders with empty data array", () => {
    expect(() => render(<SpendingPieChart data={[]} />)).not.toThrow();
  });
});
