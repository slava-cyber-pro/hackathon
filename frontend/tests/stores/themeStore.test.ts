import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "@/stores/themeStore";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  useThemeStore.setState({ theme: "light" });
});

describe("themeStore", () => {
  it("default theme is light when no localStorage or prefers-color-scheme", () => {
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("toggle switches from light to dark", () => {
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggle switches from dark to light", () => {
    useThemeStore.setState({ theme: "dark" });
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("setTheme sets specific theme", () => {
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("persists theme to localStorage", () => {
    useThemeStore.getState().setTheme("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("updates document.documentElement dark class", () => {
    useThemeStore.getState().setTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    useThemeStore.getState().setTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
