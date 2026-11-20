import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const path of ["/?film=reduced", "/?film=lite", "/?film=full", "/privacy", "/try"]) {
  const p = await b.newPage();
  let initial = 0, total = 0;
  let loaded = false;
  p.on("response", async (r) => {
    if (!r.url().endsWith(".js") && !r.url().includes(".js?")) return;
    const len = (await import("node:zlib")).gzipSync(await r.body().catch(() => Buffer.alloc(0))).length;
    total += len;
    if (!loaded) initial += len;
  });
  const t = Date.now();
  await p.goto(`http://localhost:3100${path}`, { waitUntil: "load" });
  loaded = true;
  const lcp = await p.evaluate(() => new Promise<number>((res) => new PerformanceObserver((l) => { const e = l.getEntries().at(-1); res(e ? e.startTime : 0); }).observe({ type: "largest-contentful-paint", buffered: true })));
  await p.waitForTimeout(4000);
  console.log(path.padEnd(16), "JS until load:", Math.round(initial / 1024), "KB  JS after 4s:", Math.round(total / 1024), "KB  LCP(local):", Math.round(lcp), "ms  load:", Date.now() - t, "ms");
  await p.close();
}
await b.close();
