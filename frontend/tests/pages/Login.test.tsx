import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "@/pages/Login";

function renderLogin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Login", () => {
  it("renders login form with email and password inputs", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
  });

  it('renders "BudgetSphere" branding', () => {
    renderLogin();
    expect(screen.getByText("BudgetSphere")).toBeInTheDocument();
  });

  it('renders "Sign In" button', () => {
    renderLogin();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it('renders "Create an account" button', () => {
    renderLogin();
    expect(screen.getByRole("button", { name: "Create an account" })).toBeInTheDocument();
  });

  it("shows email validation error on submit with invalid email", async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "bad" } });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "password123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => {
      expect(screen.getByText("Invalid email format")).toBeInTheDocument();
    });
  });

  it("shows password validation error on submit with short password", async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "short" } });
    fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });
  });

  it("password show/hide toggle works", () => {
    renderLogin();
    const input = screen.getByPlaceholderText("Enter your password");
    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByText("Show"));
    expect(input).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByText("Hide"));
    expect(input).toHaveAttribute("type", "password");
  });

  it('"Create an account" link points to /register', () => {
    renderLogin();
    const link = screen.getByRole("link", { name: /Create an account/i });
    expect(link).toHaveAttribute("href", "/register");
  });
});
