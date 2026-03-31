import { chromium } from "/home/user/PycharmProjects/hackaton/frontend/node_modules/playwright/index.mjs";

const BASE = "http://localhost:5173";
const OUT = "/home/user/PycharmProjects/hackaton/screenshots";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const email = `demo_${Date.now()}@shot.com`;

// 1. Register
await page.goto(`${BASE}/register`);
await page.fill('input[id="name"]', "Alex Johnson");
await page.fill('input[id="email"]', email);
await page.fill('input[id="password"]', "demo12345");
await page.fill('input[id="confirm"]', "demo12345");
await page.screenshot({ path: `${OUT}/01-register.png` });
console.log("1/16 Register");

// Submit and land on dashboard
await page.click('button:has-text("Create Account")');
await page.waitForSelector("text=Total Balance", { timeout: 15000 });

// 2. Login page
await page.evaluate(() => { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); });
await page.goto(`${BASE}/login`);
await page.waitForSelector("text=BudgetSphere");
await page.screenshot({ path: `${OUT}/02-login.png` });
console.log("2/16 Login");

// Login back
await page.fill('input[id="email"]', email);
await page.fill('input[id="password"]', "demo12345");
await page.click('button:has-text("Sign In")');
await page.waitForSelector("text=Total Balance", { timeout: 15000 });

// 3. Dashboard
await page.screenshot({ path: `${OUT}/03-dashboard.png` });
console.log("3/16 Dashboard");

// 4. Transactions + create one
await page.goto(`${BASE}/transactions`);
await page.waitForSelector("text=Transactions", { timeout: 5000 });
await page.click('button:has-text("Add Transaction")');
await page.waitForTimeout(500);
await page.fill('input[type="number"]', "85.50");
await page.waitForSelector("text=Groceries", { timeout: 5000 }).catch(() => {});
try { await page.click("text=Groceries"); } catch {}
await page.screenshot({ path: `${OUT}/04-add-transaction.png` });
console.log("4/16 Add Transaction Modal");
await page.click('button:has-text("Save Transaction")');
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/05-transactions.png` });
console.log("5/16 Transactions");

// 6. Investments
await page.goto(`${BASE}/investments`);
await page.waitForSelector("text=My Portfolio", { timeout: 5000 });
await page.screenshot({ path: `${OUT}/06-investments.png` });
console.log("6/16 Investments");

// 7. Market
await page.click("text=Market");
await page.waitForTimeout(5000);
await page.screenshot({ path: `${OUT}/07-market.png` });
console.log("7/16 Market");

// 8. Budgets
await page.goto(`${BASE}/budgets`);
await page.waitForSelector("text=Budgets", { timeout: 5000 });
await page.screenshot({ path: `${OUT}/08-budgets.png` });
console.log("8/16 Budgets");

// 9. Team
await page.goto(`${BASE}/team`);
await page.waitForSelector("text=Team", { timeout: 5000 });
await page.fill('input[placeholder="Team name"]', "Household");
await page.click('button:has-text("Create Team")');
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/09-team.png` });
console.log("9/16 Team");

// 10. Analytics
await page.goto(`${BASE}/analytics`);
await page.waitForSelector("text=Analytics", { timeout: 5000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/10-analytics.png` });
console.log("10/16 Analytics");

// 11. Settings
await page.goto(`${BASE}/settings`);
await page.waitForSelector("text=Settings", { timeout: 5000 });
await page.screenshot({ path: `${OUT}/11-settings.png` });
console.log("11/16 Settings");

// ── DARK MODE ──
await page.evaluate(() => { localStorage.setItem("theme", "dark"); document.documentElement.classList.add("dark"); });

// 12. Dashboard Dark
await page.goto(`${BASE}/`);
await page.waitForSelector("text=Total Balance", { timeout: 10000 });
await page.screenshot({ path: `${OUT}/12-dashboard-dark.png` });
console.log("12/16 Dashboard Dark");

// 13. Transactions Dark
await page.goto(`${BASE}/transactions`);
await page.waitForSelector("text=Transactions", { timeout: 5000 });
await page.screenshot({ path: `${OUT}/13-transactions-dark.png` });
console.log("13/16 Transactions Dark");

// 14. Market Dark
await page.goto(`${BASE}/investments`);
await page.waitForSelector("text=My Portfolio", { timeout: 5000 });
await page.click("text=Market");
await page.waitForTimeout(5000);
await page.screenshot({ path: `${OUT}/14-market-dark.png` });
console.log("14/16 Market Dark");

await ctx.close();

// ── MOBILE ──
const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mCtx.newPage();
await mp.goto(`${BASE}/login`);
await mp.fill('input[id="email"]', email);
await mp.fill('input[id="password"]', "demo12345");
await mp.screenshot({ path: `${OUT}/15-mobile-login.png` });
console.log("15/16 Mobile Login");
await mp.click('button:has-text("Sign In")');
await mp.waitForSelector("text=Total Balance", { timeout: 15000 });
await mp.screenshot({ path: `${OUT}/16-mobile-dashboard.png` });
console.log("16/16 Mobile Dashboard");

await mCtx.close();
await browser.close();
console.log("All done!");
