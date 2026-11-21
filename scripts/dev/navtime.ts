/** Dev helper: times internal navigation (click → new URL → curtain gone) from a few pages. */
import { chromium } from "@playwright/test";

const [base = "http://localhost:3100"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const hops: [string, string][] = [
  ["/", "Features"],
  ["/features", "Nodo"],
  ["/nodo", "Download"],
  ["/download", "Privacy"],
];
for (const [from, text] of hops) {
  await page.goto(base + from, { waitUntil: "load" });
  await page.waitForFunction(() => !document.querySelector(".intro"), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const link = page.locator("nav[aria-label=Primary] a", { hasText: text }).first();
  const href = await link.getAttribute("href");
  const t0 = Date.now();
  await link.click();
  await page.waitForURL((u) => u.pathname === href, { timeout: 15000 }).catch(() => {});
  const tUrl = Date.now() - t0;
  await page.waitForFunction(() => !document.querySelector(".curtain.is-covering, .curtain.is-lifting"), null, { timeout: 15000 }).catch(() => {});
  console.log(`${from} → ${href}: url ${tUrl}ms, settled ${Date.now() - t0}ms, at ${new URL(page.url()).pathname}`);
}
await browser.close();
