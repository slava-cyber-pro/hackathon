import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Toggle from "@/components/ui/Toggle";

describe("Toggle", () => {
  it("renders unchecked state", () => {
    render(<Toggle checked={false} onChange={() => {}} />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveClass("bg-gray-300");
  });

  it("renders checked state with primary color", () => {
    render(<Toggle checked={true} onChange={() => {}} />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveClass("bg-primary-600");
  });

  it("calls onChange when clicked", () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders label text", () => {
    render(<Toggle checked={false} onChange={() => {}} label="Dark mode" />);
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });

  it("has correct aria-checked attribute", () => {
    const { rerender } = render(<Toggle checked={false} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");

    rerender(<Toggle checked={true} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });
});
