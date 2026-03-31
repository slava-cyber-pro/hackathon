import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/authStore";

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null, isAuthenticated: false });
});

describe("authStore", () => {
  it("initial state: user is null", () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("initial state: isAuthenticated is false when no token in localStorage", () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("setUser sets user and isAuthenticated to true", () => {
    const user = { id: "1", email: "a@b.com", display_name: "Test", created_at: "2024-01-01" };
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("logout clears user and sets isAuthenticated to false", () => {
    useAuthStore.setState({ user: { id: "1", email: "a@b.com", display_name: "T", created_at: "" }, isAuthenticated: true });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("logout removes tokens from localStorage", () => {
    localStorage.setItem("access_token", "tok");
    localStorage.setItem("refresh_token", "ref");
    useAuthStore.getState().logout();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });
});
