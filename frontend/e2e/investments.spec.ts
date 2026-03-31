import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Investments", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, "InvUser");
  });

  test("loads with portfolio and market tabs", async ({ page }) => {
    await page.goto("/investments");
    await expect(page.locator("text=My Portfolio")).toBeVisible();
    await expect(page.locator("text=Market")).toBeVisible();
  });

  test("switch to market tab shows category tabs", async ({ page }) => {
    await page.goto("/investments");
    await page.click("text=Market");
    await expect(page.locator("text=Stocks")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Crypto")).toBeVisible();
  });

  test("add investment button opens modal", async ({ page }) => {
    await page.goto("/investments");
    await page.click('button:has-text("Add Investment")');
    await expect(page.locator("text=Search Asset").first()).toBeVisible({ timeout: 5000 });
  });
});
