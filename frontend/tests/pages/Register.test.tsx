import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Register from "@/pages/Register";

vi.mock("@/api/auth", () => ({
  register: vi.fn(),
}));

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );
}

describe("Register", () => {
  it("renders registration form with all fields", () => {
    renderRegister();
    expect(screen.getByPlaceholderText("Alex")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Min. 8 characters")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm your password")).toBeInTheDocument();
  });

  it('renders "Create your account" heading', () => {
    renderRegister();
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("shows password strength indicator when typing", () => {
    renderRegister();
    const passwordInput = screen.getByPlaceholderText("Min. 8 characters");
    fireEvent.change(passwordInput, { target: { value: "ab" } });
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it('shows "Sign in" link pointing to /login', () => {
    renderRegister();
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toHaveAttribute("href", "/login");
  });

  it('"Create Account" button is present', () => {
    renderRegister();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });
});
