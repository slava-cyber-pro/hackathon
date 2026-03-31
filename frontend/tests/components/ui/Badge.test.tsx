import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Badge from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies teal color by default", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toHaveClass("bg-primary-100", "text-primary-700");
  });

  it("applies specified color variant (green, red, amber)", () => {
    const { rerender } = render(<Badge color="green">Green</Badge>);
    expect(screen.getByText("Green")).toHaveClass("bg-green-100", "text-green-700");

    rerender(<Badge color="red">Red</Badge>);
    expect(screen.getByText("Red")).toHaveClass("bg-red-100", "text-red-700");

    rerender(<Badge color="amber">Amber</Badge>);
    expect(screen.getByText("Amber")).toHaveClass("bg-amber-100", "text-amber-700");
  });

  it("applies custom className", () => {
    render(<Badge className="ml-2">Custom</Badge>);
    expect(screen.getByText("Custom")).toHaveClass("ml-2");
  });
});
