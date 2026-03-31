import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const OUT = "./screenshots";

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Register and login
  const email = `demo_${Date.now()}@screenshots.com`;
  await page.goto(`${BASE}/register`);
  await page.fill('input[id="name"]', "Alex Johnson");
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', "demo12345");
  await page.fill('input[id="confirm"]', "demo12345");

  // Screenshot: Register page
  await page.screenshot({ path: `${OUT}/01-register.png`, fullPage: false });

  await page.click('button:has-text("Create Account")');
  await page.waitForSelector("text=Total Balance", { timeout: 15000 });

  // Screenshot: Login page
  await page.evaluate(() => { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); });
  await page.goto(`${BASE}/login`);
  await page.waitForSelector("text=BudgetSphere");
  await page.screenshot({ path: `${OUT}/02-login.png`, fullPage: false });

  // Login back
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', "demo12345");
  await page.click('button:has-text("Sign In")');
  await page.waitForSelector("text=Total Balance", { timeout: 15000 });

  // Screenshot: Dashboard light
  await page.screenshot({ path: `${OUT}/03-dashboard-light.png`, fullPage: false });

  // Add some data for richer screenshots
  // Create a transaction
  await page.goto(`${BASE}/transactions`);
  await page.waitForSelector("text=Transactions");
  await page.click('button:has-text("Add Transaction")');
  await page.waitForSelector("text=Add Transaction");
  await page.fill('input[type="number"]', "85.50");
  await page.waitForSelector("text=Groceries", { timeout: 5000 });
  await page.click("text=Groceries");
  await page.click('button:has-text("Save Transaction")');
  await page.waitForTimeout(1500);

  // Add income
  await page.click('button:has-text("Add Transaction")');
  await page.waitForSelector("text=Add Transaction");
  await page.click("text=Income");
  await page.fill('input[type="number"]', "5000");
  await page.waitForSelector("text=Groceries", { timeout: 5000 });
  await page.click("text=Groceries");
  await page.click('button:has-text("Save Transaction")');
  await page.waitForTimeout(1500);

  // Screenshot: Transactions page
  await page.screenshot({ path: `${OUT}/04-transactions.png`, fullPage: false });

  // Screenshot: Add Transaction Modal
  await page.click('button:has-text("Add Transaction")');
  await page.waitForSelector("text=Add Transaction");
  await page.fill('input[type="number"]', "42.50");
  await page.screenshot({ path: `${OUT}/05-add-transaction-modal.png`, fullPage: false });
  await page.keyboard.press("Escape");

  // Investments page
  await page.goto(`${BASE}/investments`);
  await page.waitForSelector("text=My Portfolio");
  await page.screenshot({ path: `${OUT}/06-investments-portfolio.png`, fullPage: false });

  // Market tab
  await page.click("text=Market");
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/07-market.png`, fullPage: false });

  // Budgets page
  await page.goto(`${BASE}/budgets`);
  await page.waitForSelector("text=Budgets");
  // Create a budget
  await page.click('button:has-text("Set New Limit")');
  await page.waitForSelector("text=Set Budget Limit");
  await page.fill('input[id="budget-amount"]', "500");
  await page.click('button:has-text("Set Limit")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/08-budgets.png`, fullPage: false });

  // Team page
  await page.goto(`${BASE}/team`);
  await page.waitForSelector("text=Team");
  await page.fill('input[placeholder="Team name"]', "Household");
  await page.click('button:has-text("Create Team")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/09-team.png`, fullPage: false });

  // Analytics page
  await page.goto(`${BASE}/analytics`);
  await page.waitForSelector("text=Analytics");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/10-analytics.png`, fullPage: false });

  // Settings page
  await page.goto(`${BASE}/settings`);
  await page.waitForSelector("text=Settings");
  await page.screenshot({ path: `${OUT}/11-settings.png`, fullPage: false });

  // ---- DARK MODE ----
  // Toggle dark mode via localStorage + reload
  await page.evaluate(() => { localStorage.setItem("theme", "dark"); });
  await page.reload();
  await page.waitForSelector("text=Settings");
  await page.screenshot({ path: `${OUT}/12-settings-dark.png`, fullPage: false });

  // Dashboard dark
  await page.goto(`${BASE}/`);
  await page.waitForSelector("text=Total Balance", { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/13-dashboard-dark.png`, fullPage: false });

  // Transactions dark
  await page.goto(`${BASE}/transactions`);
  await page.waitForSelector("text=Transactions");
  await page.screenshot({ path: `${OUT}/14-transactions-dark.png`, fullPage: false });

  // Market dark
  await page.goto(`${BASE}/investments`);
  await page.waitForSelector("text=My Portfolio");
  await page.click("text=Market");
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/15-market-dark.png`, fullPage: false });

  // ---- MOBILE ----
  await context.close();
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();

  // Login on mobile
  await mobilePage.goto(`${BASE}/login`);
  await mobilePage.fill('input[id="email"]', email);
  await mobilePage.fill('input[id="password"]', "demo12345");
  await mobilePage.screenshot({ path: `${OUT}/16-mobile-login.png`, fullPage: false });

  await mobilePage.click('button:has-text("Sign In")');
  await mobilePage.waitForSelector("text=Total Balance", { timeout: 15000 });
  await mobilePage.screenshot({ path: `${OUT}/17-mobile-dashboard.png`, fullPage: false });

  await mobilePage.goto(`${BASE}/transactions`);
  await mobilePage.waitForSelector("text=Transactions");
  await mobilePage.screenshot({ path: `${OUT}/18-mobile-transactions.png`, fullPage: false });

  await mobileContext.close();
  await browser.close();

  console.log("All screenshots taken!");
}

main().catch(console.error);
