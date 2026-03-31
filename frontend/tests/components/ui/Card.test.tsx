import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Card, { CardTitle } from "@/components/ui/Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies default card styles (rounded-lg, border, bg-white)", () => {
    const { container } = render(<Card>Styled</Card>);
    const card = container.firstElementChild!;
    expect(card).toHaveClass("rounded-lg", "border", "bg-white");
  });

  it("applies dark mode classes", () => {
    const { container } = render(<Card>Dark</Card>);
    const card = container.firstElementChild!;
    expect(card).toHaveClass("dark:border-gray-700", "dark:bg-gray-800");
  });

  it("CardTitle renders heading text", () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("My Title");
  });

  it("applies custom className", () => {
    const { container } = render(<Card className="extra-class">Test</Card>);
    expect(container.firstElementChild!).toHaveClass("extra-class");
  });
});
