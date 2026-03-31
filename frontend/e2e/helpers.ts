import type { Page } from "@playwright/test";

const unique = () => `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export async function registerAndLogin(page: Page, name = "E2EUser"): Promise<string> {
  const email = `${unique()}@test.com`;
  await page.goto("/register");
  await page.fill('input[id="name"]', name);
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', "testpass123");
  await page.fill('input[id="confirm"]', "testpass123");
  await page.click('button:has-text("Create Account")');
  // Wait for dashboard to load (URL becomes "/" and content appears)
  await page.waitForSelector("text=Total Balance", { timeout: 15_000 });
  return email;
}

export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("team_id");
  });
}
