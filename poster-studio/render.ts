/**
 * Renders every poster to public/posters/ and writes src/content/generated/posters.json.
 * Deterministic: same inputs → byte-identical HTML (no randomness, local fonts, local images).
 * Usage: pnpm posters            (all)
 *        pnpm posters --only=og  (series filter)
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import guide from "../src/content/generated/app_guide.json";
import { modules } from "../src/content/site";
import {
  collage,
  dataArt,
  diptychThemes,
  diptychViews,
  duotone,
  featureGraphic,
  magazineCover,
  og,
  playShot,
  swiss,
  typographic,
  type Poster,
  type Theme,
} from "./templates";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "public/posters");
const CACHE = join(ROOT, "poster-studio/.cache");
const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const themes: Theme[] = ["light", "dark"];
const f = (base: string, t: Theme) => `${base}_${t}.png`;

const posters: Poster[] = [];
const add = (p: Omit<Poster, "html"> & { html: string }) => posters.push(p);

// 1. Magazine covers
const covers = [
  { module: "Notes", slug: "notes", file: "02_notes", line: "Your thoughts, connected.", kicker: "Curate" },
  { module: "Tasks", slug: "tasks", file: "03_tasks", line: "Cross it off. Feel it.", kicker: "Plan" },
  { module: "Planner", slug: "planner", file: "04_plan", line: "Time, well kept.", kicker: "Plan" },
  { module: "Habits", slug: "habits", file: "05_habits", line: "Small things, done often.", kicker: "Live" },
  { module: "Money", slug: "expenses", file: "01_bento_home", line: "Every rupee, accounted for.", kicker: "Live" },
  { module: "Focus", slug: "focus-dial", file: "07_focus_dial", line: "A watchmaker’s dial for deep work.", kicker: "Live" },
  { module: "Ledger", slug: "expenses", file: "06_expenses", line: "A quiet page for your money.", kicker: "Remember" },
];
covers.forEach((cv, i) =>
  themes.forEach((t) =>
    add({
      id: `cover-${cv.slug}-${cv.module.toLowerCase()}-${t}`,
      series: "covers",
      title: `The ${cv.module} Issue`,
      alt: `Magazine-style poster: "The ${cv.module} Issue" with a real NOTtEodo screenshot of ${cv.module.toLowerCase()} on a phone`,
      theme: t,
      size: { w: 1080, h: 1350 },
      module: cv.slug,
      html: magazineCover({ t, file: f(cv.file, t), issue: i + 1, module: cv.module, coverLine: cv.line, kicker: cv.kicker }),
    }),
  ),
);

// 2. Typographic
const words = [
  { word: "Capture.", file: "03_tasks", cap: "Say it once. It finds its place." },
  { word: "Curate.", file: "02_notes", cap: "Your thoughts, connected." },
  { word: "Plan.", file: "04_plan", cap: "An open day, well planned." },
  { word: "Live.", file: "05_habits", cap: "Small things, done often." },
  { word: "Remember.", file: "06_expenses", cap: "Keep what mattered." },
];
words.forEach((w) =>
  themes.forEach((t) =>
    add({
      id: `type-${w.word.replace(".", "").toLowerCase()}-${t}`,
      series: "typographic",
      title: w.word,
      alt: `Typographic poster: the word "${w.word}" filled with a NOTtEodo screenshot`,
      theme: t,
      size: { w: 1080, h: 1350 },
      html: typographic({ t, word: w.word, file: f(w.file, t), caption: w.cap }),
    }),
  ),
);

// 3. Swiss grid (Editorial view)
const swissSet = [
  { n: "02 / Notes", title: "Notebook", file: "02_notes", slug: "notes", facts: [["Ask your notes", "with citations"], ["Map of notes", "linked ideas"], ["Deleted", "to the Bin"]] },
  { n: "03 / Tasks", title: "Tasks", file: "03_tasks", slug: "tasks", facts: [["Entry", "plain words"], ["Lists", "Today · Upcoming · Anytime"], ["Done", "struck in ink"]] },
  { n: "06 / Money", title: "November", file: "06_expenses", slug: "expenses", facts: [["Budget", "per-day allowance"], ["Limits", "category envelopes"], ["Export", "CSV"]] },
] as const;
swissSet.forEach((sw) =>
  themes.forEach((t) =>
    add({
      id: `swiss-${sw.slug}-${t}`,
      series: "swiss",
      title: sw.title,
      alt: `Swiss-grid poster for ${sw.title} with the Editorial view screenshot`,
      theme: t,
      size: { w: 1080, h: 1350 },
      module: sw.slug,
      html: swiss({ t, file: f(sw.file, t), n: sw.n, title: sw.title, facts: sw.facts.map((x) => [x[0], x[1]] as [string, string]) }),
    }),
  ),
);

// 4. Duotone / halftone (decorative)
[
  { file: "07_focus_dial", title: "Time, well kept." },
  { file: "02_notes", title: "Thoughts, connected." },
].forEach((d, i) =>
  themes.forEach((t) =>
    add({
      id: `duotone-${i + 1}-${t}`,
      series: "duotone",
      title: d.title,
      alt: `Decorative oxblood duotone and halftone treatment of a NOTtEodo screen, titled "${d.title}"`,
      theme: t,
      size: { w: 1080, h: 1350 },
      html: duotone({ t, file: f(d.file, t), title: d.title }),
    }),
  ),
);

// 5. Ivory | OLED diptychs
[
  { base: "03_tasks", title: "Tasks, by day and by night." },
  { base: "01_bento_home", title: "Money, in Cards view." },
  { base: "07_focus_dial", title: "The Focus Dial in both lights." },
].forEach((d, i) =>
  add({
    id: `diptych-theme-${i + 1}`,
    series: "diptych-themes",
    title: d.title,
    alt: `Split poster: the same NOTtEodo screen in Ivory (light) and OLED (dark) mode`,
    theme: "light",
    size: { w: 1600, h: 900 },
    html: diptychThemes({ file: f(d.base, "light"), fileDark: f(d.base, "dark"), title: d.title, focus: 0.1 }),
  }),
);

// 6. Cards | Editorial diptychs
themes.forEach((t) =>
  add({
    id: `diptych-views-expenses-${t}`,
    series: "diptych-views",
    title: "Two ways to see the same money.",
    alt: "The Expenses screen in Cards view and in Editorial view side by side",
    theme: t,
    size: { w: 1600, h: 900 },
    module: "expenses",
    html: diptychViews({ t, cards: f("01_bento_home", t), editorial: f("06_expenses", t), title: "Two ways to see the same money.", focus: 0.12 }),
  }),
);

// 7. Data art: rings = sections in the app's own guide, petals = modules on this site
themes.forEach((t) =>
  add({
    id: `guilloche-${t}`,
    series: "data-art",
    title: "Guilloché of an ordered life",
    alt: `Generative guilloché rosette with ${guide.sections.length} rings and ${modules.length} petals around a NOTtEodo screen`,
    theme: t,
    size: { w: 1080, h: 1350 },
    html: dataArt({ t, rings: guide.sections.length, petals: modules.length, file: f("05_habits", t), caption: `${guide.sections.length} chapters. ${modules.length} parts. One app.` }),
  }),
);

// 8. Collage
themes.forEach((t) =>
  add({
    id: `collage-${t}`,
    series: "collage",
    title: "Notes. Tasks. Life.",
    alt: "Collage of three NOTtEodo screens on deckled paper with the ribbon N monogram",
    theme: t,
    size: { w: 1080, h: 1350 },
    html: collage({ t, files: [f("02_notes", t), f("03_tasks", t), f("04_plan", t)], title: "Notes. Tasks. Life." }),
  }),
);

// Play Store screenshots (captions describe exactly what is shown)
const play = [
  { file: "01_bento_home", t: "light", cap: "Every rupee, accounted for.", sub: "A monthly budget with what you can spend each day, in Cards view.", slug: "expenses" },
  { file: "03_tasks", t: "light", cap: "Cross it off.", sub: "Write tasks the way you’d say them. Today, Upcoming, Anytime and Done.", slug: "tasks" },
  { file: "02_notes", t: "light", cap: "Your thoughts, connected.", sub: "Ask your notes, see them as a map, and get a briefing.", slug: "notes" },
  { file: "04_plan", t: "light", cap: "An open day, well planned.", sub: "Events and dated tasks on one calm timeline.", slug: "planner" },
  { file: "07_focus_dial", t: "light", cap: "Time, well kept.", sub: "A watch-style focus dial with session lengths and ambient sound.", slug: "focus" },
  { file: "05_habits", t: "light", cap: "Small things, done often.", sub: "Start with one habit and let the streak grow.", slug: "habits" },
  { file: "01_bento_home", t: "dark", cap: "Pure black at night.", sub: "Every screen has an OLED dark mode.", slug: "dark" },
  { file: "06_expenses", t: "dark", cap: "Or a quieter page.", sub: "Editorial view: the same app as a calm, magazine-like layout.", slug: "editorial" },
] as const;
play.forEach((p, i) =>
  add({
    id: `play-screenshot-${String(i + 1).padStart(2, "0")}-${p.slug}-${p.t}`,
    series: "play",
    title: p.cap,
    alt: `Google Play screenshot: ${p.cap} ${p.sub}`,
    theme: p.t,
    size: { w: 1080, h: 1920 },
    png: true,
    html: playShot({ t: p.t, file: f(p.file, p.t), caption: p.cap, sub: p.sub }),
  }),
);
themes.forEach((t) =>
  add({ id: `feature-graphic-${t}`, series: "play", title: "Feature graphic", alt: "NOTtEodo wordmark, tagline and ribbon N monogram", theme: t, size: { w: 1024, h: 500 }, png: true, html: featureGraphic(t) }),
);

// Open Graph images (1200×630)
const ogs = [
  { id: "default", eyebrow: "Notes. Tasks. Life.", title: "Curate your", italic: "everyday.", file: "06_expenses" },
  { id: "features", eyebrow: "Features", title: "One app, every part of", italic: "life.", file: "02_notes" },
  { id: "download", eyebrow: "Download for Android", title: "Get", italic: "NOTtEodo.", file: "01_bento_home" },
  { id: "privacy", eyebrow: "Privacy", title: "Encrypted on", italic: "your phone." },
  { id: "nodo", eyebrow: "Nodo", title: "A companion that", italic: "forgets on request." },
  { id: "try", eyebrow: "Try it in your browser", title: "Don’t take our word.", italic: "Touch it.", file: "03_tasks" },
  { id: "help", eyebrow: "Help centre", title: "Everything, explained", italic: "plainly." },
];
ogs.forEach((o) =>
  themes.forEach((t) =>
    add({
      id: `og-${o.id}-${t}`,
      series: "og",
      title: `${o.title} ${o.italic}`,
      alt: `${o.eyebrow}: ${o.title} ${o.italic}`,
      theme: t,
      size: { w: 1200, h: 630 },
      png: true,
      html: og({ t, eyebrow: o.eyebrow, title: o.title, italic: o.italic, file: o.file ? f(o.file, t) : undefined, focus: 0.1 }),
    }),
  ),
);

// Social story size (1080×1920) from the covers
themes.forEach((t) =>
  add({
    id: `story-money-${t}`,
    series: "social",
    title: "The Money Issue (story)",
    alt: "Story-size poster: The Money Issue",
    theme: t,
    size: { w: 1080, h: 1920 },
    module: "expenses",
    html: magazineCover({ t, file: f("01_bento_home", t), issue: 5, module: "Money", coverLine: "Every rupee, accounted for.", kicker: "Live", size: { w: 1080, h: 1920 } }),
  }),
);

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(CACHE, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const manifest: Record<string, unknown>[] = [];
  const list = only ? posters.filter((p) => p.series === only) : posters;
  for (const p of list) {
    const dir = join(OUT, p.series);
    mkdirSync(dir, { recursive: true });
    const hash = createHash("sha256").update(p.html).digest("hex").slice(0, 16);
    const webp = join(dir, `${p.id}.webp`);
    const stamp = join(CACHE, `${p.id}.sha`);
    const fresh = existsSync(webp) && existsSync(stamp) && readFileSync(stamp, "utf8") === hash;
    if (!fresh) {
      const htmlFile = join(CACHE, `${p.id}.html`);
      writeFileSync(htmlFile, p.html);
      await page.setViewportSize({ width: p.size.w, height: p.size.h });
      await page.goto(`file:///${htmlFile.replace(/\\/g, "/")}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ type: "png" });
      await sharp(png).webp({ quality: 86 }).toFile(webp);
      if (p.png) await sharp(png).png({ compressionLevel: 9 }).toFile(join(dir, `${p.id}.png`));
      writeFileSync(stamp, hash);
      console.log("✓", p.series, p.id);
    }
    manifest.push({
      id: p.id,
      series: p.series,
      title: p.title,
      alt: p.alt,
      theme: p.theme,
      width: p.size.w,
      height: p.size.h,
      src: `/posters/${p.series}/${p.id}.webp`,
      png: p.png ? `/posters/${p.series}/${p.id}.png` : undefined,
      module: p.module,
      hash,
    });
  }
  await browser.close();
  if (!only) {
    writeFileSync(
      join(ROOT, "src/content/generated/posters.json"),
      JSON.stringify({ $comment: "Generated by poster-studio/render.ts", count: manifest.length, posters: manifest }, null, 2) + "\n",
    );
  }
  console.log(`${list.length} posters`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
