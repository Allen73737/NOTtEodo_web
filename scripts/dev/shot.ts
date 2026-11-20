/** Dev helper: screenshot a running page. Usage: tsx scripts/dev/shot.ts <url> <out.png> [width] [theme] [view] [full] */
import { chromium } from "@playwright/test";
const [url = "http://localhost:3000/", out = "shot.png", w = "1280", theme = "light", view = "cards", full = ""] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(w) < 600 ? 860 : 820 }, colorScheme: theme as "light" | "dark" });
await page.addInitScript(([t, v]) => { localStorage.setItem("nt-theme", t!); localStorage.setItem("nt-view", v!); }, [theme, view]);
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
await page.screenshot({ path: out, fullPage: full === "full" });
if (errors.length) console.log("ERRORS:\n" + errors.slice(0, 10).join("\n"));
await browser.close();
