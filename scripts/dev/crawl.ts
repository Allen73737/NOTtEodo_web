/**
 * Dev helper: visits every page in the sitemap plus every internal link found on them, on desktop
 * and a phone, and reports anything wrong: non-200 responses, console errors, page errors, failed
 * requests, horizontal overflow, a missing <h1> and images that did not load.
 * Usage: tsx scripts/dev/crawl.ts <base-url>
 */
import { chromium, devices } from "@playwright/test";

const [base = "http://localhost:3100"] = process.argv.slice(2);
const browser = await chromium.launch();
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname));
urls.add("/");
const problems: string[] = [];
const seen = new Set<string>();
const linkStatus = new Map<string, number>();

for (const [label, opts] of [
  ["desktop", { viewport: { width: 1366, height: 860 } }],
  ["mobile", devices["Pixel 7"]],
] as const) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" });
  const queue = [...urls];
  const visited = new Set<string>();
  while (queue.length) {
    const path = queue.shift()!;
    if (visited.has(path)) continue;
    visited.add(path);
    const page = await ctx.newPage();
    const errs: string[] = [];
    page.on("console", (m) => m.type() === "error" && errs.push(`console: ${m.text().slice(0, 200)}`));
    page.on("pageerror", (e) => errs.push(`pageerror: ${e.message.slice(0, 200)}`));
    page.on("requestfailed", (r) => !/_rsc|favicon|\/api\/(track|vitals)/.test(r.url()) && errs.push(`requestfailed: ${r.url().replace(base, "")} ${r.failure()?.errorText}`));
    page.on("response", (r) => r.status() >= 400 && r.url().startsWith(base) && errs.push(`http ${r.status()}: ${r.url().replace(base, "")}`));
    try {
      const res = await page.goto(base + path, { waitUntil: "load", timeout: 60000 });
      if (!res || res.status() !== 200) errs.push(`status ${res?.status()}`);
      await page.waitForTimeout(600);
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        h1: document.querySelectorAll("h1").length,
        brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== "lazy").map((i) => i.src).slice(0, 3),
        links: [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].map((a) => a.href),
      }));
      if (info.overflow > 1) errs.push(`horizontal overflow ${info.overflow}px`);
      if (info.h1 !== 1 && !path.startsWith("/admin")) errs.push(`${info.h1} <h1> elements`);
      for (const s of info.brokenImgs) errs.push(`broken image ${s}`);
      for (const href of info.links) {
        const u = new URL(href);
        if (u.origin !== new URL(base).origin) continue;
        const p = u.pathname;
        if (/\.(apk|xml|txt|json|png|webp|svg|pdf)$/.test(p) || p.startsWith("/api/")) continue;
        if (!seen.has(p)) {
          seen.add(p);
          const r = await fetch(base + p, { redirect: "manual" });
          linkStatus.set(p, r.status);
          if (r.status >= 400) problems.push(`[link] ${p} -> ${r.status} (found on ${path})`);
        }
        if (!visited.has(p) && !p.startsWith("/admin") && linkStatus.get(p) === 200) queue.push(p);
      }
    } catch (e) {
      errs.push(`failed: ${String(e).slice(0, 160)}`);
    }
    for (const e of errs) problems.push(`[${label}] ${path}: ${e}`);
    await page.close();
  }
  console.log(label, "pages visited:", visited.size);
  await ctx.close();
}
await browser.close();
console.log(problems.length ? problems.join("\n") : "no problems found");
