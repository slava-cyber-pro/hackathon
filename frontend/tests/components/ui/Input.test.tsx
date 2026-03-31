import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import Input from "@/components/ui/Input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("does not render label when not provided", () => {
    const { container } = render(<Input />);
    expect(container.querySelector("label")).toBeNull();
  });

  it("shows error message when error prop set", () => {
    render(<Input error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("applies error border styles when error present", () => {
    render(<Input error="Bad value" />);
    expect(screen.getByRole("textbox")).toHaveClass("border-red-500");
  });

  it("passes placeholder through", () => {
    render(<Input placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
