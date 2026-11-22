/** Dev helper: loads a page and prints its console messages, page errors and failed requests. */
import { chromium } from "@playwright/test";
const [url = "http://localhost:3100/", wait = "10000"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
page.on("console", (m) => console.log(`${m.type()}: ${m.text().slice(0, 300)}`));
page.on("pageerror", (e) => console.log(`pageerror: ${String(e).slice(0, 500)}`));
page.on("requestfailed", (r) => console.log(`failed: ${r.url()} ${r.failure()?.errorText}`));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(Number(wait));
console.log("state:", await page.evaluate("JSON.stringify({film: document.documentElement.dataset.film, cls: document.documentElement.className, intro: !!document.querySelector('.intro')})"));
await browser.close();
