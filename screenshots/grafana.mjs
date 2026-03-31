import { chromium } from "/home/user/PycharmProjects/hackaton/frontend/node_modules/playwright/index.mjs";

const OUT = "/home/user/PycharmProjects/hackaton/screenshots";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Login to Grafana
await page.goto("http://localhost:3000/login");
await page.fill('input[name="user"]', "admin");
await page.fill('input[name="password"]', "admin");
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

// API Performance
await page.goto("http://localhost:3000/d/budgetsphere-api-perf?orgId=1&from=now-1h&to=now");
await page.waitForTimeout(5000);
await page.screenshot({ path: `${OUT}/20-grafana-api.png` });
console.log("Grafana API Performance");

// Business Metrics
await page.goto("http://localhost:3000/d/budgetsphere-business?orgId=1&from=now-24h&to=now");
await page.waitForTimeout(5000);
await page.screenshot({ path: `${OUT}/21-grafana-business.png` });
console.log("Grafana Business Metrics");

// Logs
await page.goto("http://localhost:3000/d/budgetsphere-logs?orgId=1&from=now-1h&to=now");
await page.waitForTimeout(5000);
await page.screenshot({ path: `${OUT}/22-grafana-logs.png` });
console.log("Grafana Logs");

await browser.close();
console.log("Done!");
