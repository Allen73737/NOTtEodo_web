/** Favicons and PWA icons from the ribbon N monogram, in Ivory and OLED. */
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { MONOGRAM, MONOGRAM_STROKE } from "../src/components/brand/monogram-paths";
import { colors } from "../src/content/generated/tokens";

const paths = Object.values(MONOGRAM)
  .map((d) => `<path d="${d}"/>`)
  .join("");
const svg = (bg: string, ink: string, pad = 14, radius = 22) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="${radius}" fill="${bg}"/><g transform="translate(${pad} ${pad}) scale(${(100 - pad * 2) / 100})" fill="none" stroke="${ink}" stroke-width="${MONOGRAM_STROKE * 1.2}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;

const light = svg(colors.light.canvas, colors.light.accent);
const dark = svg(colors.dark.canvas, colors.dark.accent);
writeFileSync("public/icon-light.svg", light);
writeFileSync("public/icon-dark.svg", dark);
writeFileSync("public/monogram.svg", svg("none", colors.light.accent, 0, 0).replace('fill="none"/>', 'fill="none" stroke="none"/>'));
await sharp(Buffer.from(svg(colors.dark.canvas, colors.dark.accent, 18, 0))).resize(180).png().toFile("public/apple-touch-icon.png");
await sharp(Buffer.from(svg(colors.dark.canvas, colors.dark.accent, 14, 22))).resize(192).png().toFile("public/icon-192.png");
await sharp(Buffer.from(svg(colors.dark.canvas, colors.dark.accent, 14, 22))).resize(512).png().toFile("public/icon-512.png");
// Maskable: safe zone is the inner 80%, so the mark gets extra padding and a full-bleed square.
await sharp(Buffer.from(svg(colors.dark.canvas, colors.dark.accent, 24, 0))).resize(512).png().toFile("public/icon-maskable-512.png");
console.log("icons written");
