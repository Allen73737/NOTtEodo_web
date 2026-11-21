/** Favicons and PWA icons from the ribbon N (traced from the app's logo), in one ink colour on Ivory or OLED black. */
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { LOGO_MONOGRAM } from "../src/components/brand/logo-paths";
import { colors } from "../src/content/generated/tokens";

const { d, w, h } = LOGO_MONOGRAM;
/** pad is the share of the square left empty on each side, in percent. */
const svg = (bg: string, ink: string, pad = 16, radius = 22) => {
  const size = 100 - pad * 2;
  const k = size / Math.max(w, h);
  const x = (100 - w * k) / 2;
  const y = (100 - h * k) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="${radius}" fill="${bg}"/><path transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(5)})" fill="${ink}" fill-rule="evenodd" d="${d}"/></svg>`;
};

writeFileSync("public/icon-light.svg", svg(colors.light.canvas, colors.light.text));
writeFileSync("public/icon-dark.svg", svg(colors.dark.canvas, colors.dark.text));
writeFileSync("public/monogram.svg", svg("none", colors.light.text, 0, 0));
await sharp(Buffer.from(svg(colors.light.canvas, colors.light.text, 20, 0))).resize(180).png().toFile("public/apple-touch-icon.png");
await sharp(Buffer.from(svg(colors.light.canvas, colors.light.text, 16, 22))).resize(192).png().toFile("public/icon-192.png");
await sharp(Buffer.from(svg(colors.light.canvas, colors.light.text, 16, 22))).resize(512).png().toFile("public/icon-512.png");
// Maskable: safe zone is the inner 80%, so the mark gets extra padding and a full-bleed square.
await sharp(Buffer.from(svg(colors.light.canvas, colors.light.text, 26, 0))).resize(512).png().toFile("public/icon-maskable-512.png");
console.log("icons written");
