/** Dev helper: prints the stacking-relevant styles from the story's copy up to the root, and the 3D stage's. */
import { chromium } from "@playwright/test";

const [base = "http://localhost:3000"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
await page.goto(`${base}/?film=full`, { waitUntil: "load", timeout: 180000 });
await page.waitForFunction(() => document.documentElement.classList.contains("journey-ready"), null, { timeout: 60000 });
await page.waitForTimeout(6000);
// A string, so the bundler's helper names never reach the page.
const out = (await page.evaluate(`(() => {
  function chain(el) {
    const rows = [];
    while (el && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      rows.push(el.tagName.toLowerCase() + "." + String(el.className).slice(0, 40) + " pos=" + cs.position + " z=" + cs.zIndex + " iso=" + cs.isolation + " tf=" + (cs.transform !== "none") + " op=" + cs.opacity + " filter=" + (cs.filter !== "none") + " cont=" + cs.contain + " wc=" + cs.willChange);
      el = el.parentElement;
    }
    return rows;
  }
  return { title: chain(document.querySelector("#tour-title")), stage: chain(document.querySelector(".journey")) };
})()`)) as { title: string[]; stage: string[] };
console.log("TITLE\n" + out.title.join("\n") + "\n\nSTAGE\n" + out.stage.join("\n"));
await browser.close();
