/**
 * Dev helper: full-page screenshots of several pages, scrolled through first so reveals have run.
 * Usage: tsx scripts/dev/pages.ts <base> <out-dir> <width> <theme> /features /try ...
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const [base = "http://localhost:3100", out = "pages", w = "1440", theme = "light", ...paths] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const width = Number(w);
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 860 }, colorScheme: theme as "light" | "dark", deviceScaleFactor: 1 });
await page.addInitScript((t) => localStorage.setItem("nt-theme", t), theme);
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
for (const p of paths.length ? paths : ["/features", "/try", "/nodo", "/download", "/privacy"]) {
  await page.goto(base + p, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(1500);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
  const name = p.replace(/\//g, "_") || "_home";
  await page.screenshot({ path: `${out}/${name}-top.png` });
  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
}
if (errors.length) console.log("ERRORS:\n" + [...new Set(errors)].slice(0, 10).join("\n"));
await browser.close();
