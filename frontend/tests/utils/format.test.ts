import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatPercent } from "@/utils/format";

describe("formatCurrency", () => {
  it("formats positive number with $", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats negative number", () => {
    expect(formatCurrency(-500)).toBe("-$500.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    expect(formatDate("2024-03-15")).toBe("Mar 15, 2024");
  });
});

describe("formatPercent", () => {
  it("formats positive percentage with +", () => {
    expect(formatPercent(12.34)).toBe("+12.3%");
  });

  it("formats negative percentage", () => {
    expect(formatPercent(-5.67)).toBe("-5.7%");
  });
});
