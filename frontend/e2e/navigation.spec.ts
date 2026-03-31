import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Navigation & Pages", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, "NavUser");
  });

  test("dashboard loads with greeting and cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /NavUser/ })).toBeVisible();
    await expect(page.locator("text=Total Balance")).toBeVisible();
    await expect(page.locator("text=Monthly Income")).toBeVisible();
  });

  test("all main pages load without error", async ({ page }) => {
    const pages = [
      { path: "/transactions", text: "Transactions" },
      { path: "/investments", text: "My Portfolio" },
      { path: "/budgets", text: "Budgets" },
      { path: "/team", text: "Team" },
      { path: "/analytics", text: "Analytics" },
      { path: "/settings", text: "Settings" },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await expect(page.locator(`text=${p.text}`).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test("settings has all sections", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Security")).toBeVisible();
    await expect(page.locator("text=Notifications")).toBeVisible();
    await expect(page.locator("text=Appearance")).toBeVisible();
  });

  test("budgets shows empty state", async ({ page }) => {
    await page.goto("/budgets");
    await expect(page.locator("text=No budgets").first()).toBeVisible({ timeout: 5000 });
  });

  test("team shows create team prompt", async ({ page }) => {
    await page.goto("/team");
    await expect(page.locator("text=No team yet")).toBeVisible({ timeout: 5000 });
  });

  test("analytics shows chart sections", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.locator("text=Spending by Category")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Income vs Expenses")).toBeVisible();
  });
});
