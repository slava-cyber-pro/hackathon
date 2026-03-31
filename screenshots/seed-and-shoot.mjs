import { chromium } from "/home/user/PycharmProjects/hackaton/frontend/node_modules/playwright/index.mjs";

const BASE_API = "http://localhost:8000/api/v1";
const BASE_UI = "http://localhost:5173";
const OUT = "/home/user/PycharmProjects/hackaton/screenshots";

// ── Helper: API call ──
async function api(token, method, path, body) {
  const opts = {
    method,
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${BASE_API}${path}`, opts);
  return r.json();
}

// ── 1. Seed data via API ──
console.log("Seeding data...");

// Register user
const regResp = await fetch(`${BASE_API}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: `demo_${Date.now()}@pres.com`, password: "demo12345", display_name: "Alex Johnson" }),
});
const { access_token: token } = await regResp.json();

// Get categories
const cats = await api(token, "GET", "/categories");
const catMap = {};
for (const c of cats) catMap[c.name] = c.id;

// Create transactions (mix of income and expenses over 3 months)
const txns = [
  { cat: "Groceries", type: "expense", amount: 156.80, desc: "Whole Foods Market", date: "2026-03-28" },
  { cat: "Groceries", type: "expense", amount: 89.50, desc: "Trader Joe's", date: "2026-03-22" },
  { cat: "Groceries", type: "expense", amount: 64.30, desc: "Costco run", date: "2026-03-15" },
  { cat: "Dining Out", type: "expense", amount: 78.40, desc: "Italian dinner", date: "2026-03-26" },
  { cat: "Dining Out", type: "expense", amount: 32.00, desc: "Lunch with team", date: "2026-03-20" },
  { cat: "Transportation", type: "expense", amount: 55.00, desc: "Uber rides", date: "2026-03-25" },
  { cat: "Transportation", type: "expense", amount: 120.00, desc: "Monthly metro pass", date: "2026-03-01" },
  { cat: "Entertainment", type: "expense", amount: 15.99, desc: "Netflix subscription", date: "2026-03-01" },
  { cat: "Entertainment", type: "expense", amount: 24.99, desc: "Spotify + Audible", date: "2026-03-01" },
  { cat: "Entertainment", type: "expense", amount: 45.00, desc: "Movie night", date: "2026-03-18" },
  { cat: "Utilities", type: "expense", amount: 142.50, desc: "Electric bill", date: "2026-03-05" },
  { cat: "Utilities", type: "expense", amount: 89.00, desc: "Internet + phone", date: "2026-03-05" },
  { cat: "Rent/Mortgage", type: "expense", amount: 1850.00, desc: "March rent", date: "2026-03-01" },
  { cat: "Healthcare", type: "expense", amount: 35.00, desc: "Pharmacy", date: "2026-03-12" },
  { cat: "Clothing", type: "expense", amount: 129.00, desc: "Spring jacket", date: "2026-03-14" },
  { cat: "Subscriptions", type: "expense", amount: 9.99, desc: "iCloud storage", date: "2026-03-01" },
  { cat: "Education", type: "expense", amount: 49.99, desc: "Udemy course", date: "2026-03-10" },
  { cat: "Gifts", type: "expense", amount: 75.00, desc: "Birthday present", date: "2026-03-08" },
  // Income
  { cat: "Groceries", type: "income", amount: 5200.00, desc: "Salary deposit", date: "2026-03-01" },
  { cat: "Groceries", type: "income", amount: 5200.00, desc: "Salary deposit", date: "2026-02-01" },
  { cat: "Groceries", type: "income", amount: 5200.00, desc: "Salary deposit", date: "2026-01-01" },
  { cat: "Groceries", type: "income", amount: 1200.00, desc: "Freelance payment", date: "2026-03-15" },
  { cat: "Groceries", type: "income", amount: 850.00, desc: "Freelance payment", date: "2026-02-20" },
  { cat: "Groceries", type: "income", amount: 320.00, desc: "Dividend income", date: "2026-03-20" },
  // Feb expenses
  { cat: "Rent/Mortgage", type: "expense", amount: 1850.00, desc: "February rent", date: "2026-02-01" },
  { cat: "Groceries", type: "expense", amount: 280.00, desc: "February groceries", date: "2026-02-15" },
  { cat: "Dining Out", type: "expense", amount: 95.00, desc: "Valentine's dinner", date: "2026-02-14" },
  { cat: "Utilities", type: "expense", amount: 198.00, desc: "February utilities", date: "2026-02-05" },
  // Jan expenses
  { cat: "Rent/Mortgage", type: "expense", amount: 1850.00, desc: "January rent", date: "2026-01-01" },
  { cat: "Groceries", type: "expense", amount: 310.00, desc: "January groceries", date: "2026-01-15" },
  { cat: "Utilities", type: "expense", amount: 210.00, desc: "January utilities", date: "2026-01-05" },
];

for (const t of txns) {
  await api(token, "POST", "/transactions", {
    category_id: catMap[t.cat] || cats[0].id,
    type: t.type, amount: t.amount, description: t.desc, date: t.date,
  });
}
console.log(`Created ${txns.length} transactions`);

// Create investments
const invs = [
  { category: "stocks", name: "Apple Inc.", ticker: "AAPL", quantity: 15, purchase_price: 178.50, amount_invested: 2677.50, current_value: 3709.35 },
  { category: "stocks", name: "Microsoft Corp.", ticker: "MSFT", quantity: 8, purchase_price: 310.00, amount_invested: 2480.00, current_value: 2917.76 },
  { category: "crypto", name: "Bitcoin", ticker: "bitcoin", quantity: 0.12, purchase_price: 42000, amount_invested: 5040.00, current_value: 5280.00 },
  { category: "etfs", name: "Vanguard S&P 500", ticker: "VOO", quantity: 10, purchase_price: 420.00, amount_invested: 4200.00, current_value: 4650.00 },
  { category: "bonds", name: "US Treasury Bond ETF", ticker: "TLT", quantity: 25, purchase_price: 95.00, amount_invested: 2375.00, current_value: 2250.00 },
];
for (const inv of invs) {
  await api(token, "POST", "/investments", { ...inv, expected_return_pct: 0, income_allocation_pct: 0 });
}
console.log(`Created ${invs.length} investments`);

// Create budgets
const budgets = [
  { cat: "Groceries", limit: 400, period: "monthly" },
  { cat: "Dining Out", limit: 200, period: "monthly" },
  { cat: "Entertainment", limit: 100, period: "monthly" },
  { cat: "Transportation", limit: 200, period: "monthly" },
  { cat: "Utilities", limit: 250, period: "monthly" },
  { cat: "Clothing", limit: 150, period: "monthly" },
];
for (const b of budgets) {
  await api(token, "POST", "/budgets", {
    category_id: catMap[b.cat] || cats[0].id,
    amount_limit: b.limit, period: b.period, period_start: "2026-03-01",
  });
}
console.log(`Created ${budgets.length} budgets`);

// Create team
await api(token, "POST", "/teams", { name: "Johnson Family" });
console.log("Created team");

// ── 2. Take screenshots ──
console.log("\nTaking screenshots...");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Login
await page.goto(`${BASE_UI}/login`);
const emailVal = (await regResp.url, `demo_${Date.now()}@pres.com`); // won't work, need to store
// Actually login with the token directly
await page.evaluate((t) => {
  localStorage.setItem("access_token", t);
  localStorage.setItem("theme", "light");
}, token);
await page.goto(`${BASE_UI}/`);
await page.waitForSelector("text=Alex Johnson", { timeout: 15000 });
await page.waitForTimeout(1500);

// Dashboard (with data!)
await page.screenshot({ path: `${OUT}/03-dashboard.png` });
console.log("  Dashboard light");

// Transactions
await page.goto(`${BASE_UI}/transactions`);
await page.waitForSelector("text=Whole Foods", { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/05-transactions.png` });
console.log("  Transactions");

// Add transaction modal
await page.click('button:has-text("Add Transaction")');
await page.waitForTimeout(500);
await page.fill('input[type="number"]', "42.50");
await page.waitForSelector("text=Groceries", { timeout: 5000 }).catch(() => {});
try { await page.click("text=Groceries"); } catch {}
await page.screenshot({ path: `${OUT}/04-add-transaction.png` });
console.log("  Add Transaction Modal");
await page.keyboard.press("Escape");

// Investments
await page.goto(`${BASE_UI}/investments`);
await page.waitForSelector("text=Apple", { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/06-investments.png` });
console.log("  Investments");

// Market
await page.click("text=Market");
await page.waitForTimeout(6000);
await page.screenshot({ path: `${OUT}/07-market.png` });
console.log("  Market");

// Budgets
await page.goto(`${BASE_UI}/budgets`);
await page.waitForSelector("text=Groceries", { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/08-budgets.png` });
console.log("  Budgets");

// Team
await page.goto(`${BASE_UI}/team`);
await page.waitForSelector("text=Johnson Family", { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/09-team.png` });
console.log("  Team");

// Analytics
await page.goto(`${BASE_UI}/analytics`);
await page.waitForSelector("text=Spending by Category", { timeout: 10000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/10-analytics.png` });
console.log("  Analytics");

// Settings
await page.goto(`${BASE_UI}/settings`);
await page.waitForSelector("text=Profile", { timeout: 5000 });
await page.screenshot({ path: `${OUT}/11-settings.png` });
console.log("  Settings");

// ── DARK MODE ──
await page.evaluate(() => { localStorage.setItem("theme", "dark"); document.documentElement.classList.add("dark"); });

await page.goto(`${BASE_UI}/`);
await page.waitForSelector("text=Total Balance", { timeout: 10000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/12-dashboard-dark.png` });
console.log("  Dashboard Dark");

await page.goto(`${BASE_UI}/transactions`);
await page.waitForSelector("text=Whole Foods", { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/13-transactions-dark.png` });
console.log("  Transactions Dark");

await page.goto(`${BASE_UI}/investments`);
await page.waitForSelector("text=My Portfolio", { timeout: 5000 });
await page.click("text=Market");
await page.waitForTimeout(6000);
await page.screenshot({ path: `${OUT}/14-market-dark.png` });
console.log("  Market Dark");

await ctx.close();

// ── MOBILE ──
const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mCtx.newPage();
await mp.goto(`${BASE_UI}/login`);
await mp.evaluate((t) => { localStorage.setItem("access_token", t); localStorage.setItem("theme", "light"); }, token);

await mp.goto(`${BASE_UI}/`);
await mp.waitForSelector("text=Total Balance", { timeout: 15000 });
await mp.waitForTimeout(1000);
await mp.screenshot({ path: `${OUT}/16-mobile-dashboard.png` });
console.log("  Mobile Dashboard");

await mp.goto(`${BASE_UI}/transactions`);
await mp.waitForTimeout(2000);
await mp.screenshot({ path: `${OUT}/18-mobile-transactions.png` });
console.log("  Mobile Transactions");

await mCtx.close();
await browser.close();

// ── 3. Delete the demo user's data ──
console.log("\nCleaning up demo data...");
// Get all transactions and delete them
const txList = await api(token, "GET", "/transactions?size=100");
const items = txList.items || txList;
if (Array.isArray(items)) {
  for (const t of items) {
    await api(token, "DELETE", `/transactions/${t.id}`);
  }
  console.log(`Deleted ${items.length} transactions`);
}

// Delete investments
const invList = await api(token, "GET", "/investments?size=100");
const invItems = invList.items || invList;
if (Array.isArray(invItems)) {
  for (const i of invItems) {
    await api(token, "DELETE", `/investments/${i.id}`);
  }
  console.log(`Deleted ${invItems.length} investments`);
}

console.log("\nAll done! Screenshots with rich data saved, demo data cleaned up.");
