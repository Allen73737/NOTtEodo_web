/** Dev helper: open the story at one act and screenshot it after a delay. Usage: tsx scripts/dev/probe-act.ts <base> <act> <out.png> [theme] [waitMs] [width] */
import { chromium } from "@playwright/test";

const [base = "http://localhost:3000", act = "open", out = "probe.png", theme = "light", wait = "5000", w = "1440"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: Number(w), height: 860 }, colorScheme: theme as "light" | "dark" });
await page.addInitScript((t) => {
  localStorage.setItem("nt-theme", t);
  sessionStorage.setItem("nt-intro", "1");
}, theme);
const logs: string[] = [];
page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on("pageerror", (e) => logs.push(`pageerror: ${e}`));
page.on("requestfailed", (r) => logs.push(`failed: ${r.url()}`));
await page.goto(`${base}/?film=full`, { waitUntil: "load", timeout: 180000 });
await page.waitForFunction(() => document.documentElement.classList.contains("journey-ready"), null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.evaluate((id) => {
  const el = document.querySelector<HTMLElement>(`[data-act="${id}"]`)!;
  window.scrollTo(0, el.offsetTop + el.offsetHeight / 2 - innerHeight / 2);
}, act);
await page.waitForTimeout(Number(wait));
await page.screenshot({ path: out });
console.log(logs.filter((l) => !l.includes("hydrat") && !l.startsWith("debug") && !l.startsWith("info")).slice(0, 15).join("\n"));
await browser.close();
