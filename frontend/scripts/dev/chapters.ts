/** Dev helper: viewport screenshots at several chapters. tsx scripts/dev/chapters.ts <url> <outPrefix> <theme> <view> <ids...> */
import { chromium } from "@playwright/test";
const [url, out, theme = "light", view = "cards", ...ids] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1440, height: 860 }, colorScheme: theme as "light" | "dark" });
await p.addInitScript(([t, v]) => { localStorage.setItem("nt-theme", t!); localStorage.setItem("nt-view", v!); sessionStorage.setItem("nt-preloaded", "1"); }, [theme, view]);
const errs: string[] = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto(url!, { waitUntil: "load" });
await p.waitForTimeout(2000);
for (const id of ids) {
  await p.evaluate((i) => {
    const el = document.getElementById(i)!;
    const top = el.getBoundingClientRect().top + scrollY + (el.offsetHeight > innerHeight * 1.5 ? el.offsetHeight * 0.35 : 0);
    window.scrollTo(0, top);
  }, id);
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${out}-${id}.png` });
}
if (errs.length) console.log("ERRORS", errs.slice(0, 5));
await b.close();
