import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import IncomeTrendChart from "@/components/charts/IncomeTrendChart";

describe("IncomeTrendChart", () => {
  it("renders without crashing", () => {
    const data = [{ month: "Jan", income: 5000, expenses: 3000 }];
    expect(() => render(<IncomeTrendChart data={data} />)).not.toThrow();
  });

  it("renders with empty data", () => {
    expect(() => render(<IncomeTrendChart data={[]} />)).not.toThrow();
  });
});
