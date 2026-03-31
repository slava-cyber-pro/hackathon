import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import BalanceAreaChart from "@/components/charts/BalanceAreaChart";

describe("BalanceAreaChart", () => {
  it("renders without crashing", () => {
    const data = [{ month: "Jan", balance: 10000 }];
    expect(() => render(<BalanceAreaChart data={data} />)).not.toThrow();
  });

  it("renders with empty data", () => {
    expect(() => render(<BalanceAreaChart data={[]} />)).not.toThrow();
  });
});
