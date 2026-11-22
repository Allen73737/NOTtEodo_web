/**
 * Real app screenshots → public/screenshots/.
 *   raw/<file>.png                     committed copy of the app's PNG
 *   <screen>-<view>-<theme>-<w>.{webp,avif}
 *   src/content/generated/screenshots.json   manifest (screen, view, theme, size, sha256, blur)
 * Screen and view come from scripts/screenshot-map.json (hand-verified), not the filename.
 * `--check` fails if the app has screenshots the committed manifest doesn't know about.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { APP_DIR, CHECK, GENERATED_HEADER, ROOT, emit, requireApp } from "./lib/sync-util";

const WIDTHS = [480, 960, 1084] as const; // 1084 is the capture width; we never upscale.
const map = JSON.parse(readFileSync(resolve(ROOT, "scripts/screenshot-map.json"), "utf8")) as {
  files: Record<string, { screen: string; view: "cards" | "editorial"; note?: string }>;
};

type Entry = {
  file: string;
  screen: string;
  view: "cards" | "editorial";
  theme: "light" | "dark";
  width: number;
  height: number;
  sha256: string;
  blur: string;
  sources: { webp: string[]; avif: string[] };
};

async function main() {
  if (!requireApp("sync-screenshots")) return;
  const dir = resolve(APP_DIR, "assets/screenshots");
  const files = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
  const outDir = resolve(ROOT, "public/screenshots");
  mkdirSync(resolve(outDir, "raw"), { recursive: true });

  const entries: Entry[] = [];
  for (const file of files) {
    const m = /^(.+)_(light|dark)\.png$/.exec(file);
    if (!m) continue;
    const info = map.files[m[1]!];
    if (!info) {
      console.error(`✗ ${file} is not in scripts/screenshot-map.json. Verify what it shows and add it.`);
      process.exitCode = 1;
      continue;
    }
    const buf = readFileSync(resolve(dir, file));
    const sha256 = createHash("sha256").update(buf).digest("hex");
    const theme = m[2] as "light" | "dark";
    const base = `${info.screen}-${info.view}-${theme}`;
    const meta = await sharp(buf).metadata();
    const blurBuf = await sharp(buf).resize(12).webp({ quality: 40 }).toBuffer();
    const entry: Entry = {
      file,
      screen: info.screen,
      view: info.view,
      theme,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      sha256,
      blur: `data:image/webp;base64,${blurBuf.toString("base64")}`,
      sources: { webp: [], avif: [] },
    };
    for (const w of WIDTHS) {
      for (const fmt of ["webp", "avif"] as const) {
        const name = `${base}-${w}.${fmt}`;
        entry.sources[fmt].push(`/screenshots/${name} ${w}w`);
        if (CHECK) continue;
        const target = resolve(outDir, name);
        const marker = resolve(outDir, `.${name}.sha`);
        if (existsSync(target) && existsSync(marker) && readFileSync(marker, "utf8") === sha256) continue;
        const img = sharp(buf).resize(w);
        await (fmt === "webp" ? img.webp({ quality: 82 }) : img.avif({ quality: 55 })).toFile(target);
        writeFileSync(marker, sha256);
      }
    }
    const rawTarget = resolve(outDir, "raw", file);
    if (!CHECK && (!existsSync(rawTarget) || readFileSync(rawTarget).length !== buf.length)) {
      writeFileSync(rawTarget, buf);
    }
    entries.push(entry);
  }

  const manifest = { $comment: GENERATED_HEADER, count: entries.length, entries };
  const ok = emit("src/content/generated/screenshots.json", JSON.stringify(manifest, null, 2) + "\n");
  if (CHECK && !ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
