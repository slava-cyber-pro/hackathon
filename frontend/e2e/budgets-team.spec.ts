import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Budgets", () => {
  test("create a budget via modal", async ({ page }) => {
    await registerAndLogin(page, "BudgetUser");
    await page.goto("/budgets");
    await page.click('button:has-text("Set New Limit")');
    await expect(page.locator("text=Set Budget Limit")).toBeVisible();

    await page.fill('input[id="budget-amount"]', "500");
    await page.click('button:has-text("Set Limit")');
    await page.waitForTimeout(1500);
    await expect(page.locator("text=500").first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Team", () => {
  test("create a team", async ({ page }) => {
    await registerAndLogin(page, "TeamOwner");
    await page.goto("/team");
    await expect(page.locator("text=No team yet")).toBeVisible();

    await page.fill('input[placeholder="Team name"]', "Test Team");
    await page.click('button:has-text("Create Team")');
    await expect(page.locator("text=Test Team")).toBeVisible({ timeout: 5000 });
  });
});
