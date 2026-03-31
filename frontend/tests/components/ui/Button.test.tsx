import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Button from "@/components/ui/Button";

describe("Button", () => {
  it("renders with children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies primary variant classes by default", () => {
    render(<Button>Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary-600", "text-white");
  });

  it("applies secondary variant when specified", () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-gray-100", "text-gray-900");
  });

  it("applies outline variant when specified", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("border", "border-primary-600", "text-primary-600");
  });

  it("renders disabled state (pointer-events-none, opacity)", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass("pointer-events-none", "opacity-50");
  });

  it("calls onClick handler when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Button className="my-custom">Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("my-custom");
  });

  it("applies size variants (sm, md, lg)", () => {
    const { rerender } = render(<Button size="sm">S</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-3", "py-1.5");

    rerender(<Button size="md">M</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-4", "py-2");

    rerender(<Button size="lg">L</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-6", "py-3", "text-base");
  });
});
