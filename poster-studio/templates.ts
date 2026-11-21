/**
 * Poster Studio compositions. Each poster is a self-contained HTML page rendered by headless
 * Chromium at an exact pixel size. Rules: the UI inside a screenshot is never altered; crops
 * only hide test-data names; captions describe what the screenshot really shows.
 */
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { colors } from "../src/content/generated/tokens";
import { LOGO_MONOGRAM, LOGO_WORDMARK } from "../src/components/brand/logo-paths";

export type Theme = "light" | "dark";
export type Size = { w: number; h: number };
export type Poster = {
  id: string;
  series: string;
  title: string;
  alt: string;
  theme: Theme;
  size: Size;
  html: string;
  /** Extra output formats besides webp. */
  png?: boolean;
  /** Which module the poster belongs to (for feature pages and the admin picker). */
  module?: string;
};

const ROOT = join(import.meta.dirname, "..");
const font = (f: string) => pathToFileURL(join(ROOT, "poster-studio/fonts", f)).href;
export const shotUrl = (file: string) => pathToFileURL(join(ROOT, "public/screenshots/raw", file)).href;

const T = (t: Theme) => colors[t];

function base(t: Theme, size: Size, body: string, extraCss = "") {
  const c = T(t);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Bodoni;src:url(${font("BodoniModa-Regular.ttf")});font-weight:400}
@font-face{font-family:Bodoni;src:url(${font("BodoniModa-Italic.ttf")});font-style:italic;font-weight:400}
@font-face{font-family:Bodoni;src:url(${font("BodoniModa-Medium.ttf")});font-weight:500}
@font-face{font-family:Bodoni;src:url(${font("BodoniModa-SemiBold.ttf")});font-weight:600}
@font-face{font-family:Bodoni;src:url(${font("BodoniModa-Bold.ttf")});font-weight:700}
@font-face{font-family:DM;src:url(${font("DMSans-Regular.ttf")});font-weight:400}
@font-face{font-family:DM;src:url(${font("DMSans-SemiBold.ttf")});font-weight:600}
@font-face{font-family:Grotesk;src:url(${font("SpaceGrotesk-Medium.ttf")});font-weight:500}
@font-face{font-family:Grotesk;src:url(${font("SpaceGrotesk-SemiBold.ttf")});font-weight:600}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${size.w}px;height:${size.h}px;overflow:hidden}
body{background:${c.canvas};color:${c.text};font-family:DM,sans-serif;position:relative;-webkit-font-smoothing:antialiased}
.it{font-style:italic;font-weight:400}
.acc{color:${c.accent}}
.mono{font-family:Grotesk,monospace;letter-spacing:.14em;text-transform:uppercase;font-weight:600}
.serif{font-family:Bodoni,serif}
.grain{position:absolute;inset:0;pointer-events:none;opacity:${t === "light" ? 0.07 : 0.05};mix-blend-mode:${t === "light" ? "multiply" : "screen"};
background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${t === "light" ? 0 : 1} 0 0 0 0 ${t === "light" ? 0 : 1} 0 0 0 0 ${t === "light" ? 0 : 1} 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.phone{position:absolute;border-radius:5.2%/2.4%;padding:1.1%;background:${t === "light" ? `linear-gradient(160deg,${c["ink-container"]},${c.ink} 60%)` : `linear-gradient(160deg,${c["surface-high"]},${c.canvas} 60%)`};
box-shadow:${t === "light" ? `0 60px 120px -50px ${c.noir}99, inset 0 0 0 2px ${c["text-soft"]}80` : `0 0 0 1.5px ${c.outline}, 0 60px 160px -40px ${c.oxblood}aa`}}
.phone .scr{width:100%;height:100%;border-radius:4.4%/2%;overflow:hidden;background:${c.canvas}}
.phone img{width:100%;height:100%;object-fit:cover;display:block}
.wm{display:inline-block;line-height:1}
.wm svg{height:.8em;width:auto;fill:currentColor;display:block}
${extraCss}
</style></head><body>${body}<div class="grain"></div></body></html>`;
}

/** The logo lettering, traced from the app's logo. One colour: it inherits the text colour. */
export const wordmark = () =>
  `<span class="wm"><svg viewBox="0 0 ${LOGO_WORDMARK.w} ${LOGO_WORDMARK.h}"><path fill-rule="evenodd" d="${LOGO_WORDMARK.d}"/></svg></span>`;

/** The ribbon N, traced from the app's logo, in one colour. */
const mono = (ink: string, size: number) =>
  `<svg viewBox="0 0 ${LOGO_MONOGRAM.w} ${LOGO_MONOGRAM.h}" width="${size}" height="${size}" fill="${ink}"><path fill-rule="evenodd" d="${LOGO_MONOGRAM.d}"/></svg>`;

/** A phone with a screenshot; `focus` crops toward a vertical position (0 top … 1 bottom). */
function phone(file: string, x: number, y: number, w: number, opts: { rotate?: number; focus?: number; aspect?: number } = {}) {
  const h = w * (opts.aspect ?? 2412 / 1084);
  return `<div class="phone" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${opts.rotate ?? 0}deg)"><div class="scr"><img src="${shotUrl(file)}" style="object-position:50% ${(opts.focus ?? 0) * 100}%"></div></div>`;
}

/* ----------------------------------------------------------------------- series */

export function magazineCover(o: { t: Theme; file: string; issue: number; module: string; coverLine: string; kicker: string; focus?: number; size?: Size }): string {
  const s = o.size ?? { w: 1080, h: 1350 };
  const c = T(o.t);
  return base(
    o.t,
    s,
    `
<div style="position:absolute;inset:48px 56px auto;display:flex;justify-content:space-between" class="mono" >
  <span style="font-size:18px;color:${c["text-soft"]}">Issue Nº ${String(o.issue).padStart(2, "0")} · Poster series</span>
  <span style="font-size:18px;color:${c.accent}">Notes. Tasks. Life.</span>
</div>
<div style="position:absolute;left:44px;right:44px;top:92px;font-size:${s.w * 0.205}px;line-height:.86;text-align:center">${wordmark()}</div>
${phone(o.file, s.w * 0.43, s.h * 0.32, s.w * 0.5, { rotate: -4, focus: o.focus })}
<div style="position:absolute;left:56px;top:${s.h * 0.4}px;width:${s.w * 0.36}px">
  <p class="mono acc" style="font-size:20px;margin-bottom:22px">${o.kicker}</p>
  <h2 class="serif" style="font-size:${s.w * 0.07}px;line-height:1;font-weight:500;letter-spacing:-.02em">The <span class="it acc">${o.module}</span> Issue</h2>
  <p class="serif it" style="font-size:${s.w * 0.034}px;line-height:1.2;margin-top:26px;color:${c["text-muted"]}">${o.coverLine}</p>
</div>
<div style="position:absolute;left:56px;bottom:56px;display:flex;gap:18px;align-items:flex-end">
  ${barcode(c.text)}
  <span class="mono" style="font-size:14px;color:${c["text-soft"]}">Real app screenshot<br>Android · Free</span>
</div>`,
  );
}

function barcode(color: string) {
  // Deterministic decorative bars (not a scannable code).
  const widths = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3, 1, 1, 2, 3, 1, 4, 2, 1];
  let x = 0;
  const bars = widths
    .map((w, i) => {
      const r = i % 2 === 0 ? `<rect x="${x}" y="0" width="${w * 2}" height="70" fill="${color}"/>` : "";
      x += w * 2 + 2;
      return r;
    })
    .join("");
  return `<svg width="${x}" height="70">${bars}</svg>`;
}

export function typographic(o: { t: Theme; word: string; file: string; caption: string; focus?: number; size?: Size }) {
  const s = o.size ?? { w: 1080, h: 1350 };
  const c = T(o.t);
  return base(
    o.t,
    s,
    `
<div style="position:absolute;inset:0;display:grid;place-items:center">
  <div class="serif knock" style="font-size:${s.w * 0.36}px;line-height:.82;font-weight:700;letter-spacing:-.05em;text-align:center;
      background:url(${shotUrl(o.file)}) 50% ${(o.focus ?? 0.3) * 100}%/120% auto;-webkit-background-clip:text;background-clip:text;color:transparent;
      -webkit-text-stroke:2px ${c.accent}">${o.word}</div>
</div>
<div style="position:absolute;left:60px;right:60px;bottom:60px;display:flex;justify-content:space-between;align-items:flex-end">
  <p class="serif it" style="font-size:34px;max-width:60%;color:${c.text}">${o.caption}</p>
  <div style="font-size:40px">${wordmark()}</div>
</div>
<p class="mono" style="position:absolute;left:60px;top:56px;font-size:18px;color:${c.accent}">${o.word.replace(".", "")} · NOTtEodo</p>`,
  );
}

export function swiss(o: { t: Theme; file: string; n: string; title: string; facts: [string, string][]; focus?: number; size?: Size }) {
  const s = o.size ?? { w: 1080, h: 1350 };
  const c = T(o.t);
  return base(
    o.t,
    s,
    `
<div style="position:absolute;inset:56px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 1fr auto;column-gap:40px">
  <div style="grid-column:1/3;border-top:3px solid ${c.text};display:flex;justify-content:space-between;padding-top:16px" class="mono">
    <span style="font-size:20px">${o.n}</span><span style="font-size:20px;color:${c.accent}">Editorial view</span>
  </div>
  <div style="padding-top:48px">
    <h2 class="serif" style="font-size:96px;line-height:.95;font-weight:500;letter-spacing:-.03em">${o.title}</h2>
    <div style="margin-top:56px;border-top:1px solid ${c.divider}">
      ${o.facts.map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid ${c.divider}"><span class="mono" style="font-size:15px;color:${c["text-soft"]}">${k}</span><span style="font-size:20px">${v}</span></div>`).join("")}
    </div>
  </div>
  <div style="position:relative;padding-top:48px">${phone(o.file, 0, 48, (s.w - 152) / 2, { focus: o.focus }).replace('class="phone"', 'class="phone" style-x')}</div>
  <div style="grid-column:1/3;display:flex;justify-content:space-between;align-items:center;border-top:1px solid ${c.text};padding-top:14px">
    <span style="font-size:34px">${wordmark()}</span><span class="mono" style="font-size:14px;color:${c["text-soft"]}">Real app screenshot · Android</span>
  </div>
</div>`,
    ".phone[style-x]{position:absolute}",
  );
}

export function duotone(o: { t: Theme; file: string; title: string; focus?: number; size?: Size }) {
  const s = o.size ?? { w: 1080, h: 1350 };
  const c = T(o.t);
  const [dark, light] = o.t === "light" ? [c.accent, c.canvas] : [c.canvas, c.blush];
  const hex = (h: string) => [1, 3, 5].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3));
  const [dr, dg, db] = hex(dark);
  const [lr, lg, lb] = hex(light);
  return base(
    o.t,
    s,
    `
<svg width="0" height="0" style="position:absolute"><filter id="duo" color-interpolation-filters="sRGB">
  <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0"/>
  <feComponentTransfer><feFuncR type="table" tableValues="${dr} ${lr}"/><feFuncG type="table" tableValues="${dg} ${lg}"/><feFuncB type="table" tableValues="${db} ${lb}"/></feComponentTransfer>
</filter></svg>
<div style="position:absolute;inset:0;overflow:hidden">
  <img src="${shotUrl(o.file)}" style="position:absolute;left:-10%;top:-${(o.focus ?? 0.2) * 40}%;width:120%;filter:url(#duo);opacity:.95">
  <div style="position:absolute;inset:0;background:radial-gradient(${c.canvas}00 30%, ${c.canvas}cc 85%)"></div>
  <div style="position:absolute;inset:0;background-image:radial-gradient(${c.canvas} 1.3px, transparent 1.6px);background-size:9px 9px;opacity:.35"></div>
</div>
<div style="position:absolute;left:64px;bottom:64px;right:64px">
  <p class="mono" style="font-size:18px;color:${o.t === "light" ? c.accent : c.blush}">Decorative treatment · not a UI view</p>
  <h2 class="serif" style="font-size:120px;line-height:.92;font-weight:500;letter-spacing:-.03em;margin-top:18px">${o.title}</h2>
  <div style="font-size:44px;margin-top:28px">${wordmark()}</div>
</div>`,
  );
}

export function diptychThemes(o: { file: string; fileDark: string; title: string; focus?: number; size?: Size }) {
  const s = o.size ?? { w: 1600, h: 900 };
  const L = T("light");
  const D = T("dark");
  const w = s.w * 0.24;
  return base(
    "light",
    s,
    `
<div style="position:absolute;inset:0 50% 0 0;background:${L.canvas}"></div>
<div style="position:absolute;inset:0 0 0 50%;background:${D.canvas}"></div>
<svg style="position:absolute;left:50%;top:0;height:100%;width:40px;transform:translateX(-20px)" viewBox="0 0 40 900" preserveAspectRatio="none"><path d="M20 0 C 26 150, 12 300, 21 450 S 15 750, 20 900" stroke="${L.accent}" stroke-width="3" fill="none"/></svg>
${phone(o.file, s.w * 0.25 - w / 2, s.h * 0.12, w, { focus: o.focus, aspect: 1.75 })}
${phone(o.fileDark, s.w * 0.75 - w / 2, s.h * 0.12, w, { focus: o.focus, aspect: 1.75 }).replace("class=\"phone\"", `class="phone" data-dark`)}
<p class="mono" style="position:absolute;left:56px;top:48px;font-size:18px;color:${L.accent}">Ivory</p>
<p class="mono" style="position:absolute;right:56px;top:48px;font-size:18px;color:${D.accent}">OLED</p>
<p class="serif it" style="position:absolute;left:56px;bottom:52px;font-size:42px;color:${L.text}">${o.title}</p>
<p style="position:absolute;right:56px;bottom:56px;font-size:40px;color:${D.text}">${wordmark()}</p>`,
    `.phone[data-dark]{background:linear-gradient(160deg,${D["surface-high"]},${D.canvas} 60%);box-shadow:0 0 0 1.5px ${D.outline},0 50px 140px -40px ${D.oxblood}aa}`,
  );
}

export function diptychViews(o: { t: Theme; cards: string; editorial: string; title: string; focus?: number; size?: Size }) {
  const s = o.size ?? { w: 1600, h: 900 };
  const c = T(o.t);
  const w = s.w * 0.22;
  return base(
    o.t,
    s,
    `
${phone(o.cards, s.w * 0.3 - w / 2, s.h * 0.1, w, { focus: o.focus, aspect: 1.8, rotate: -3 })}
${phone(o.editorial, s.w * 0.7 - w / 2, s.h * 0.1, w, { focus: o.focus, aspect: 1.8, rotate: 3 })}
<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:120px;height:120px;border-radius:50%;background:${c["accent-fill"]};color:${c["on-accent"]};display:grid;place-items:center;font-family:Bodoni;font-size:58px">A<span class="it">a</span></div>
<p class="mono" style="position:absolute;left:56px;top:48px;font-size:18px;color:${c.accent}">Cards view</p>
<p class="mono" style="position:absolute;right:56px;top:48px;font-size:18px;color:${c.accent}">Editorial view</p>
<p class="serif it" style="position:absolute;left:56px;bottom:52px;font-size:42px">${o.title}</p>
<p style="position:absolute;right:56px;bottom:56px;font-size:40px">${wordmark()}</p>`,
  );
}

/** Guilloché rosette parameterised by real app constants (number of modules, sections in the guide). */
export function dataArt(o: { t: Theme; rings: number; petals: number; file: string; size?: Size; caption: string }) {
  const s = o.size ?? { w: 1080, h: 1350 };
  const c = T(o.t);
  const cx = s.w / 2,
    cy = s.h * 0.44,
    paths: string[] = [];
  for (let r = 0; r < o.rings; r++) {
    const R = 120 + r * 16;
    const amp = 10 + (r % 5) * 3;
    let d = "";
    for (let a = 0; a <= 720; a++) {
      const th = (a / 720) * Math.PI * 2;
      const rr = R + amp * Math.sin(o.petals * th + r * 0.35);
      d += `${a ? "L" : "M"}${(cx + rr * Math.cos(th)).toFixed(1)} ${(cy + rr * Math.sin(th)).toFixed(1)}`;
    }
    paths.push(`<path d="${d}Z" fill="none" stroke="${r % 4 === 0 ? c.accent : c["text-soft"]}" stroke-width="${r % 4 === 0 ? 1.4 : 0.6}" opacity="${r % 4 === 0 ? 0.9 : 0.55}"/>`);
  }
  return base(
    o.t,
    s,
    `
<svg width="${s.w}" height="${s.h}" style="position:absolute;inset:0">${paths.join("")}</svg>
${phone(o.file, cx - 120, cy - 260, 240, { focus: 0.35, aspect: 2.15 })}
<div style="position:absolute;left:60px;right:60px;bottom:60px;display:flex;justify-content:space-between;align-items:flex-end">
  <div><p class="mono acc" style="font-size:16px">${o.rings} rings · ${o.petals} petals</p><p class="serif it" style="font-size:40px;margin-top:10px">${o.caption}</p></div>
  <div style="font-size:42px">${wordmark()}</div>
</div>`,
  );
}

export function collage(o: { t: Theme; files: string[]; title: string; size?: Size }) {
  const s = o.size ?? { w: 1080, h: 1350 };
  const c = T(o.t);
  const spots = [
    [70, 160, 300, -6],
    [400, 120, 300, 4],
    [720, 200, 300, -3],
  ] as const;
  return base(
    o.t,
    s,
    `
${o.files
  .slice(0, 3)
  .map((f, i) => {
    const [x, y, w, r] = spots[i]!;
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;padding:14px 14px 56px;background:${c.sheet};transform:rotate(${r}deg);box-shadow:0 30px 60px -30px ${c.noir}88;clip-path:polygon(0 1%,4% 0,9% 1%,15% 0,22% 1%,30% 0,38% 1%,46% 0,55% 1%,63% 0,71% 1%,80% 0,88% 1%,95% 0,100% 1%,100% 99%,94% 100%,86% 99%,77% 100%,68% 99%,59% 100%,50% 99%,41% 100%,32% 99%,23% 100%,14% 99%,6% 100%,0 99%)">
      <img src="${shotUrl(f)}" style="width:100%;height:${w * 1.5}px;object-fit:cover;object-position:50% 30%;display:block"></div>`;
  })
  .join("")}
<div style="position:absolute;left:470px;top:760px">${mono(c.text, 150)}</div>
<svg style="position:absolute;left:0;top:930px" width="${s.w}" height="40"><path d="M0 20 C 160 8, 300 34, 480 18 S 820 6, ${s.w} 24" stroke="${c.accent}" stroke-width="2.4" fill="none"/></svg>
<div style="position:absolute;left:64px;right:64px;bottom:64px">
  <h2 class="serif" style="font-size:110px;line-height:.92;font-weight:500;letter-spacing:-.03em">${o.title}</h2>
  <div style="font-size:42px;margin-top:20px">${wordmark()}</div>
</div>`,
  );
}

/** Google Play phone screenshot: 1080×1920, a short honest caption above the real screen. */
export function playShot(o: { t: Theme; file: string; caption: string; sub: string; focus?: number }) {
  const s = { w: 1080, h: 1920 };
  const c = T(o.t);
  return base(
    o.t,
    s,
    `
<div style="position:absolute;left:80px;right:80px;top:110px;text-align:center">
  <h2 class="serif" style="font-size:92px;line-height:1;font-weight:500;letter-spacing:-.02em">${o.caption}</h2>
  <p style="font-size:34px;line-height:1.35;margin-top:28px;color:${c["text-muted"]}">${o.sub}</p>
</div>
${phone(o.file, (s.w - 700) / 2, 520, 700, { focus: o.focus, aspect: 2412 / 1084 })}`,
  );
}

export function featureGraphic(t: Theme) {
  const s = { w: 1024, h: 500 };
  const c = T(t);
  return base(
    t,
    s,
    `
<div style="position:absolute;left:64px;top:110px">
  <div style="font-size:112px;line-height:1">${wordmark()}</div>
  <p class="serif it" style="font-size:40px;margin-top:22px;color:${c.text}">Curate your everyday.</p>
  <p class="mono" style="font-size:16px;margin-top:22px;color:${c.accent}">Notes · Tasks · Habits · Money · Focus</p>
</div>
<div style="position:absolute;right:70px;top:90px">${mono(c.text, 320)}</div>`,
  );
}

export function og(o: { t: Theme; eyebrow: string; title: string; italic?: string; file?: string; focus?: number }) {
  const s = { w: 1200, h: 630 };
  const c = T(o.t);
  return base(
    o.t,
    s,
    `
<div style="position:absolute;left:72px;top:72px;right:${o.file ? 470 : 72}px">
  <p class="mono acc" style="font-size:20px">${o.eyebrow}</p>
  <h1 class="serif" style="font-size:84px;line-height:.98;font-weight:500;letter-spacing:-.03em;margin-top:26px">${o.title}${o.italic ? ` <span class="it acc">${o.italic}</span>` : ""}</h1>
</div>
<div style="position:absolute;left:72px;bottom:64px;font-size:48px">${wordmark()}</div>
${o.file ? phone(o.file, 800, 70, 300, { focus: o.focus, aspect: 2.4, rotate: 4 }) : `<div style="position:absolute;right:72px;bottom:56px">${mono(c.text, 200)}</div>`}`,
  );
}
