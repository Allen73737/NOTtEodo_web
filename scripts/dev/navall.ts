/** Dev helper: click through every primary nav link (and back home) and report how long each URL change takes, plus console errors. */
import { chromium, devices } from "@playwright/test";

const [base = "http://localhost:3100", mode = "desktop"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"] });
const ctx = await browser.newContext(mode === "mobile" ? devices["Pixel 7"] : { viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("console error:", m.text().slice(0, 300)));
page.on("pageerror", (e) => console.log("page error:", e.message.slice(0, 300)));
await page.goto(`${base}/`, { waitUntil: "load" });
await page.waitForFunction(() => !document.querySelector(".intro"), null, { timeout: 30000 }).catch(() => console.log("intro stuck"));
const hrefs = ["/features", "/try", "/nodo", "/download", "/privacy", "/help", "/"];
for (const href of hrefs) {
  const t0 = Date.now();
  const link = page.locator(`a[href="${href}"]:visible`).first();
  if (!(await link.count())) {
    await page.goto(`${base}${href === "/" ? "/features" : "/"}`);
    console.log(href, "no visible link; skipped");
    continue;
  }
  await link.click();
  const ok = await page.waitForURL((u) => u.pathname === href, { timeout: 25000 }).then(() => true, () => false);
  const url = Date.now() - t0;
  await page.waitForFunction(() => !document.querySelector(".curtain.is-covering, .curtain.is-lifting"), null, { timeout: 25000 }).catch(() => {});
  console.log(href, ok ? "ok" : "FAILED", "url", url, "ms, curtain clear", Date.now() - t0, "ms, now at", new URL(page.url()).pathname);
}
await browser.close();
