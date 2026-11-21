/** Dev helper: why is leaving the homepage slow? Logs long tasks and frame gaps around a nav click. */
import { chromium } from "@playwright/test";

const [base = "http://localhost:3100", film = "full"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("console", (m) => console.log("console:", m.text()));
await page.goto(`${base}/?film=${film}`, { waitUntil: "load" });
await page.waitForFunction(() => !document.querySelector(".intro"), null, { timeout: 20000 }).catch(() => console.log("intro stuck"));
await page.waitForTimeout(2000);
await page.evaluate(`(() => {
  window.__long = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: "longtask" });
  let last = performance.now(); window.__gaps = [];
  const f = (t) => { if (t - last > 100) window.__gaps.push([Math.round(last), Math.round(t - last)]); last = t; requestAnimationFrame(f); };
  requestAnimationFrame(f);
  window.__click = 0;
  window.addEventListener("click", () => (window.__click = performance.now()), true);
})()`);
const fps = await page.evaluate(`new Promise((r) => { let n = 0; const s = performance.now(); const f = () => { n++; if (performance.now() - s < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); })`);
console.log("fps before click", fps);
const t0 = Date.now();
await page.locator("nav[aria-label=Primary] a", { hasText: "Features" }).first().click();
await page.waitForURL((u) => u.pathname === "/features", { timeout: 20000 }).catch(() => {});
console.log("url after", Date.now() - t0, "ms");
const r = await page.evaluate(`({ click: Math.round(window.__click), long: window.__long, gaps: window.__gaps })`);
console.log(JSON.stringify(r));
await browser.close();
