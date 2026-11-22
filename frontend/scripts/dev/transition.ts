/** Dev helper: clicks an internal link and screenshots the page transition frame by frame. */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
const [base = "http://localhost:3000", from = "/features", linkText = "Nodo", out = "transition"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base + from, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(2500);
await page.locator("nav[aria-label=Primary] a", { hasText: linkText }).first().click();
const t0 = Date.now();
for (const ms of [120, 300, 600, 1000, 1500, 3000]) {
  await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
  await page.screenshot({ path: `${out}/t-${ms}.png` });
}
console.log("url:", page.url());
await browser.close();
