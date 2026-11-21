/**
 * Dev helper: films the homepage story. Captures the opening title mid-way, then the centre of
 * every act. Usage: tsx scripts/dev/story.ts <base-url> <out-dir> [width] [theme] [film]
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const [base = "http://localhost:3100", out = "story", w = "1440", theme = "light", film = "full"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11", "--enable-unsafe-swiftshader"] });
const width = Number(w);
const page = await browser.newPage({ viewport: { width, height: width < 600 ? 860 : 860 }, colorScheme: theme as "light" | "dark" });
await page.addInitScript((t) => localStorage.setItem("nt-theme", t), theme);
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto(`${base}/?film=${film}`, { waitUntil: "domcontentloaded", timeout: 180000 });
const t0 = Date.now();
for (const ms of [700, 1700, 2700, 3700, 4100, 4500, 4900]) {
  await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
  await page.screenshot({ path: `${out}/intro-${ms}.png` });
}
await page.waitForFunction(() => !document.querySelector(".intro"), null, { timeout: 30000 }).catch(() => errors.push("intro never left"));
await page.waitForTimeout(1500);
const acts = await page.$$eval("[data-act]", (els) => els.map((e) => ({ id: (e as HTMLElement).dataset.act!, top: (e as HTMLElement).offsetTop, h: (e as HTMLElement).offsetHeight })));
const info = await page.evaluate(() => ({ film: document.documentElement.dataset.film, ready: document.documentElement.classList.contains("journey-ready") }));
console.log(JSON.stringify(info));
for (const a of acts) {
  await page.evaluate((y) => window.scrollTo(0, y), a.top + a.h / 2 - 430);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/${String(acts.indexOf(a)).padStart(2, "0")}-${a.id}.png` });
}
if (errors.length) console.log("ERRORS:\n" + [...new Set(errors)].slice(0, 15).join("\n"));
await browser.close();
