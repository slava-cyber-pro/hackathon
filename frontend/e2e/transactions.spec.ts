import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Transactions", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, "TxnUser");
  });

  test("shows empty state when no transactions", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("text=No transactions yet")).toBeVisible({ timeout: 5000 });
  });

  test("create a transaction via modal", async ({ page }) => {
    await page.goto("/transactions");
    await page.click('button:has-text("Add Transaction")');
    await expect(page.locator("text=Add Transaction").first()).toBeVisible();

    // Fill amount
    await page.fill('input[type="number"]', "42.50");

    // Wait for categories to load and select first one
    await page.waitForSelector("text=Groceries", { timeout: 5000 });
    await page.click("text=Groceries");

    // Submit
    await page.click('button:has-text("Save Transaction")');

    // Wait for modal to close and list to refresh
    await page.waitForTimeout(2000);

    // Should see the amount somewhere on the page
    await expect(page.locator("text=/42\\.50/").first()).toBeVisible({ timeout: 10_000 });
  });

  test("type filter buttons work without crashing", async ({ page }) => {
    await page.goto("/transactions");
    await page.click('button:has-text("Income")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Expense")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("All")');
    await expect(page.locator("text=Transactions").first()).toBeVisible();
  });
});
