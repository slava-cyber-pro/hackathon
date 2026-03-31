import { test, expect } from "@playwright/test";
import { registerAndLogin, logout } from "./helpers";

test.describe("Authentication", () => {
  test("register new account and land on dashboard", async ({ page }) => {
    await registerAndLogin(page, "AuthTest");
    await expect(page.getByRole("heading", { name: /AuthTest/ })).toBeVisible();
  });

  test("register with duplicate email shows error", async ({ page }) => {
    const email = await registerAndLogin(page, "First");
    await logout(page);

    await page.goto("/register");
    await page.fill('input[id="name"]', "Second");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', "testpass123");
    await page.fill('input[id="confirm"]', "testpass123");
    await page.click('button:has-text("Create Account")');
    await expect(page.locator("text=already exists")).toBeVisible({ timeout: 10_000 });
  });

  test("login with valid credentials", async ({ page }) => {
    const email = await registerAndLogin(page, "LoginTest");
    await logout(page);

    await page.goto("/login");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', "testpass123");
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector("text=Total Balance", { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /LoginTest/ })).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "nobody@nowhere.com");
    await page.fill('input[id="password"]', "wrongpass1");
    await page.click('button:has-text("Sign In")');
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
  });

  test("unauthenticated user sees login page", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    });
    await page.goto("/transactions");
    await expect(page.locator("text=BudgetSphere")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});
