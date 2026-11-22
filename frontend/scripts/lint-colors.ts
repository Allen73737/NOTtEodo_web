/**
 * Brand rule: no colour outside the app's token set (no blue, teal, green, gold, neon).
 * Scans source, styles, shaders and poster code for hex / rgb() / hsl() literals.
 * Colours should come from CSS variables (var(--c-*)) or src/content/generated/tokens.ts.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { allowedHex } from "../src/content/generated/tokens";

const ROOT = join(import.meta.dirname, "..");
const DIRS = ["src", "poster-studio"];
const EXT = /\.(tsx?|css|glsl|frag|vert|svg|mdx?)$/;
const SKIP = [/src[\/]content[\/]generated/, /src[\/]styles[\/]tokens\.css$/, /poster-studio[\/]fonts/];
const allowed = new Set([...allowedHex.map((h) => h.toUpperCase()), "#000000", "#FFFFFF", "#000", "#FFF"]);

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.test(name)) yield p;
  }
}

let bad = 0;
for (const d of DIRS) {
  for (const file of walk(join(ROOT, d))) {
    const rel = relative(ROOT, file);
    if (SKIP.some((r) => r.test(rel))) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (line.includes("lint-colors-ignore")) return;
      for (const m of line.matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
        const raw = m[0].toUpperCase();
        const hex = raw.length === 9 ? raw.slice(0, 7) : raw;
        // Ignore URL fragments / ids such as href="#main" (not valid hex anyway) and CSS ids.
        if (!allowed.has(hex)) {
          console.error(`${rel}:${i + 1}  ${m[0]} is not a NOTtEodo token`);
          bad++;
        }
      }
      for (const m of line.matchAll(/\b(?:rgba?|hsla?)\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g)) {
        const [r, g, b] = [m[1], m[2], m[3]].map(Number);
        const mono = (r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255);
        if (!mono || m[0].startsWith("hsl")) {
          console.error(`${rel}:${i + 1}  ${m[0]}… use a token via var(--c-*) or color-mix()`);
          bad++;
        }
      }
    });
  }
}
if (bad) {
  console.error(`\n${bad} colour(s) outside the brand palette.`);
  process.exit(1);
}
console.log("✓ colours: every literal is a NOTtEodo token");
