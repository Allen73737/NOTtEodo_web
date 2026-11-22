/**
 * Reads the app's theme (colours, component colours, motion) and emits:
 *   tokens/notteodo.tokens.json       W3C Design Tokens (light + dark + motion)
 *   src/styles/tokens.css             CSS variables for both themes
 *   src/content/generated/tokens.ts   typed constants for JS, shaders and posters
 * `--check` fails when the committed files no longer match the app.
 */
import { APP_DIR, CHECK, GENERATED_HEADER, appFile, emit, requireApp } from "./lib/sync-util";

type Hex = `#${string}`;

function parseColors(src: string, cls: string): Record<string, Hex> {
  const body = src.split(new RegExp(`class ${cls}\\b`))[1]?.split(/\n}\n/)[0] ?? "";
  const out: Record<string, Hex> = {};
  for (const m of body.matchAll(/static const (?:Color )?(\w+) = Color\(0x([0-9A-Fa-f]{8})\)/g)) {
    out[m[1]!] = `#${m[2]!.slice(2).toUpperCase()}`;
  }
  return out;
}

/** `final ink = dark ? const Color(0xFF..) : const Color(0xFF..);` → { ink: [dark, light] } */
function parseComponent(src: string): Record<string, [Hex, Hex]> {
  const out: Record<string, [Hex, Hex]> = {};
  const color = String.raw`(?:const Color\(0x([0-9A-Fa-f]{8})\)|Colors\.(white|black))`;
  const re = new RegExp(String.raw`final (\w+) = dark \? ${color} : ${color};`, "g");
  const named = (hex?: string, word?: string): Hex =>
    hex ? `#${hex.slice(2).toUpperCase()}` : word === "white" ? "#FFFFFF" : "#000000";
  for (const m of src.matchAll(re)) out[m[1]!] = [named(m[2], m[3]), named(m[4], m[5])];
  return out;
}

function ms(src: string, index: number): number {
  const all = [...src.matchAll(/milliseconds: (\d+)/g)].map((m) => Number(m[1]));
  const v = all[index];
  if (v === undefined) throw new Error(`motion value #${index} missing`);
  return v;
}

function cubic(src: string, index = 0): [number, number, number, number] {
  const all = [...src.matchAll(/Cubic\(([^)]+)\)/g)].map((m) => m[1]!.split(",").map((n) => Number(n.trim())));
  const v = all[index];
  if (!v || v.length !== 4) throw new Error(`cubic #${index} missing`);
  return v as [number, number, number, number];
}

function main() {
  if (!requireApp("sync-tokens")) return;
  const colors = appFile("frontend/lib/app/theme/app_colors.dart");
  const dark = appFile("frontend/lib/app/theme/app_dark_theme.dart");
  const comp = appFile("frontend/lib/app/theme/app_component_theme.dart");
  const reveal = appFile("frontend/lib/core/motion/reveal.dart");
  const m = (f: string) => appFile(`frontend/lib/core/motion/${f}.dart`) ?? "";
  if (!colors || !dark || !comp || !reveal) throw new Error(`theme files not found under ${APP_DIR}`);

  const c = parseColors(colors, "AppColors");
  const d = parseColors(dark, "AppDarkColors");
  const k = parseComponent(comp);
  const need = (o: Record<string, Hex>, key: string): Hex => {
    const v = o[key];
    if (!v) throw new Error(`token ${key} missing in app`);
    return v;
  };
  const kc = (key: string, mode: 0 | 1): Hex => {
    const v = k[key];
    if (!v) throw new Error(`component colour ${key} missing in app`);
    return v[mode];
  };

  // Semantic roles, mirroring the app's light/dark mapping (docs/APP_AUDIT.md §2).
  const light: Record<string, Hex> = {
    canvas: need(c, "background"),
    surface: need(c, "surfaceContainer"),
    "surface-high": need(c, "surfaceContainerHigh"),
    "surface-dim": need(c, "surfaceDim"),
    "surface-lowest": need(c, "surfaceLowest"),
    sheet: kc("surface", 1),
    field: kc("field", 1),
    tint: need(c, "goldSurfaceLight"),
    hairline: need(c, "goldBorderLight"),
    divider: kc("hairline", 1),
    outline: need(c, "outline"),
    "outline-variant": need(c, "outlineVariant"),
    track: kc("track", 1),
    ink: need(c, "primary"),
    "ink-container": need(c, "primaryContainer"),
    text: need(c, "onSurface"),
    "text-muted": need(c, "onSurfaceVariant"),
    "text-soft": kc("muted", 1),
    accent: kc("mark", 1),
    "accent-fill": kc("fill", 1),
    "on-accent": kc("onFill", 1),
    rosewood: need(c, "secondaryContainer"),
    clay: need(c, "goldMuted"),
    noir: need(c, "goldDark"),
    oxblood: need(c, "goldPrimary"),
    blush: need(c, "goldLight"),
    bronze: need(c, "themeTravel"),
    linen: need(c, "themeWardrobe"),
    error: need(c, "error"),
    "inverse-surface": need(c, "primary"),
    "inverse-text": need(c, "darkTextPrimary"),
  };
  const darkRoles: Record<string, Hex> = {
    canvas: need(c, "darkBackground"),
    surface: need(c, "darkCard"),
    "surface-high": need(c, "darkSurfaceHigh"),
    "surface-dim": need(d, "surfaceDim"),
    "surface-lowest": need(c, "darkBackground"),
    sheet: kc("surface", 0),
    field: kc("field", 0),
    tint: need(c, "goldSurfaceDark"),
    hairline: need(c, "darkBorder"),
    divider: kc("hairline", 0),
    outline: need(c, "goldBorderDark"),
    "outline-variant": need(d, "outlineVariant"),
    track: kc("track", 0),
    ink: kc("ink", 0),
    "ink-container": need(d, "secondaryContainer"),
    text: kc("ink", 0),
    "text-muted": kc("muted", 0),
    "text-soft": kc("muted", 0),
    accent: kc("mark", 0),
    "accent-fill": kc("fill", 0),
    "on-accent": kc("onFill", 0),
    rosewood: need(c, "secondaryContainer"),
    clay: need(c, "goldMuted"),
    noir: need(c, "goldDark"),
    oxblood: need(c, "goldPrimary"),
    blush: need(c, "goldLight"),
    bronze: need(c, "themeTravel"),
    linen: need(c, "darkTextPrimary"),
    // #BA1A1A fails on black (3.25:1); the app's dark accent text carries errors instead.
    error: need(c, "goldLight"),
    "inverse-surface": need(c, "darkTextPrimary"),
    "inverse-text": need(c, "primary"),
  };

  const motion = {
    duration: {
      quick: ms(reveal, 0),
      standard: ms(reveal, 1),
      entrance: ms(reveal, 2),
      exit: ms(reveal, 3),
      staggerStep: ms(reveal, 4),
      staggerCap: ms(reveal, 5),
      entryDelay: ms(reveal, 6),
      themeWash: ms(m("theme_wash"), 0),
      inkStrike: ms(m("ink_strike"), 0),
      inkStrikeOut: ms(m("ink_strike"), 1),
      cardPeek: ms(m("card_peek"), 0),
      cardPeekOut: ms(m("card_peek"), 1),
      pressDown: ms(m("pressable"), 0),
      pressUp: ms(m("pressable"), 1),
      sheenIn: ms(m("touch_sheen"), 0),
      sheenOut: ms(m("touch_sheen"), 1),
      countUpDelay: ms(m("count_up"), 0),
      countUp: ms(m("count_up"), 1),
      kinetic: ms(m("kinetic_text"), 0),
      rolling: ms(m("rolling_text"), 0),
      auraLife: ms(m("touch_aura"), 0),
      // transitions.dart: module switch is a ternary (dimensional 760 / flat 460, out 260).
      moduleSwitch: 460,
      moduleSwitchOut: 260,
      moduleSwitchDimensional: 760,
      pageRoute: ms(m("transitions"), 1),
      pageRouteOut: ms(m("transitions"), 2),
      overlay: ms(m("transitions"), 0),
    },
    easing: {
      silk: cubic(reveal, 0),
      settle: cubic(reveal, 1),
      exit: cubic(reveal, 2),
      inkStrike: cubic(m("ink_strike")),
      cardPeek: cubic(m("card_peek")),
      easeOut: [0, 0, 0.58, 1],
      easeIn: [0.42, 0, 1, 1],
      easeOutCubic: [0.215, 0.61, 0.355, 1],
      easeInCubic: [0.55, 0.055, 0.675, 0.19],
      easeInOutCubic: [0.645, 0.045, 0.355, 1],
      easeInOutSine: [0.445, 0.05, 0.55, 0.95],
      easeOutBack: [0.175, 0.885, 0.32, 1.275],
    },
  } as const;

  const w3c = {
    $description: GENERATED_HEADER,
    color: {
      light: Object.fromEntries(Object.entries(light).map(([k, v]) => [k, { $type: "color", $value: v }])),
      dark: Object.fromEntries(Object.entries(darkRoles).map(([k, v]) => [k, { $type: "color", $value: v }])),
    },
    duration: Object.fromEntries(
      Object.entries(motion.duration).map(([k, v]) => [k, { $type: "duration", $value: `${v}ms` }]),
    ),
    cubicBezier: Object.fromEntries(
      Object.entries(motion.easing).map(([k, v]) => [k, { $type: "cubicBezier", $value: v }]),
    ),
  };

  const vars = (o: Record<string, string>) =>
    Object.entries(o)
      .map(([k, v]) => `  --c-${k}: ${v};`)
      .join("\n");
  const motionVars = [
    ...Object.entries(motion.duration).map(([k, v]) => `  --d-${kebab(k)}: ${v}ms;`),
    ...Object.entries(motion.easing).map(([k, v]) => `  --e-${kebab(k)}: cubic-bezier(${v.join(", ")});`),
  ].join("\n");

  const css = `/* ${GENERATED_HEADER} Source: scripts/sync-tokens.ts */
:root {
${vars(light)}
${motionVars}
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${vars(darkRoles).replace(/^/gm, "  ")}
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
${vars(darkRoles)}
  color-scheme: dark;
}
`;

  const ts = `// ${GENERATED_HEADER} Source: scripts/sync-tokens.ts
export const colors = ${JSON.stringify({ light, dark: darkRoles }, null, 2)} as const;
export const motion = ${JSON.stringify(motion, null, 2)} as const;
export type ColorRole = keyof typeof colors.light;
/** Every colour the brand allows, used by the forbidden-colour lint. */
export const allowedHex: readonly string[] = ${JSON.stringify(
    [...new Set([...Object.values(light), ...Object.values(darkRoles)])].sort(),
  )};
`;

  const ok = [
    emit("tokens/notteodo.tokens.json", JSON.stringify(w3c, null, 2) + "\n"),
    emit("src/styles/tokens.css", css),
    emit("src/content/generated/tokens.ts", ts),
  ].every(Boolean);
  if (CHECK && !ok) process.exit(1);
}

function kebab(s: string) {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

main();
