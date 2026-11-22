import * as THREE from "three";
import { SVGLoader } from "three-stdlib";
import { LOGO_MONOGRAM } from "@/components/brand/logo-paths";
import shots from "@/content/generated/screenshots.json";

/* ------------------------------------------------------------ monogram */

const monoCache = new Map<number, THREE.ExtrudeGeometry>();

/**
 * The traced ribbon N as an extruded solid, centred, 1 unit tall. Built once per depth.
 * The SVG's y axis points down, so meshes using it are flipped with a negative y scale.
 */
export function monogramGeometry(depth = 0.09): THREE.ExtrudeGeometry {
  const hit = monoCache.get(depth);
  if (hit) return hit;
  const { d, w, h } = LOGO_MONOGRAM;
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path fill-rule="evenodd" d="${d}"/></svg>`);
  const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p as Parameters<typeof SVGLoader.createShapes>[0]));
  const k = h; // geometry is built in SVG pixels, then normalised to 1 unit tall
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: depth * k,
    bevelEnabled: true,
    bevelThickness: 0.005 * k,
    bevelSize: 0.0025 * k,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.center();
  geo.scale(1 / k, 1 / k, 1 / k);
  geo.computeVertexNormals();
  monoCache.set(depth, geo);
  return geo;
}

/* ------------------------------------------------------------ screens */

type Entry = (typeof shots.entries)[number];
export function screenUrl(screen: string, view: string, theme: string): string {
  const pick = (e?: Entry) => (e ? e.sources.webp[1]!.split(" ")[0]! : "");
  return (
    pick(shots.entries.find((s) => s.screen === screen && s.view === view && s.theme === theme)) ||
    pick(shots.entries.find((s) => s.screen === screen && s.theme === theme)) ||
    pick(shots.entries.find((s) => s.screen === "home" && s.theme === theme))
  );
}

const loader = new THREE.TextureLoader();
const texCache = new Map<string, THREE.Texture>();
/** Screenshot textures, cached by URL. Returns immediately; onReady runs once the image has arrived (at once if cached). */
export function screenTexture(url: string, onReady?: (t: THREE.Texture) => void): THREE.Texture {
  const hit = texCache.get(url);
  if (hit) {
    if (hit.image) onReady?.(hit);
    else if (onReady) (hit.userData.waiters as ((t: THREE.Texture) => void)[]).push(onReady);
    return hit;
  }
  const tex = loader.load(url, (t) => {
    (t.userData.waiters as ((t: THREE.Texture) => void)[]).forEach((f) => f(t));
    t.userData.waiters = [];
  });
  tex.userData.waiters = onReady ? [onReady] : [];
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  texCache.set(url, tex);
  return tex;
}

/* ------------------------------------------------------------ labels */

function cssFont(v: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fallback;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export type CardColors = { bg: string; line: string; ink: string; muted: string; accent: string };

/** A paper card drawn on a canvas: eyebrow in the label face, title in Bodoni, optional line. */
export function cardTexture(eyebrow: string, title: string, line: string | undefined, c: CardColors, w = 640, h = 300): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const display = cssFont("--font-display", "Georgia, serif");
  const sans = cssFont("--font-sans", "system-ui, sans-serif");
  const mono = cssFont("--font-mono", "monospace");
  roundRect(ctx, 4, 4, w - 8, h - 8, 34);
  ctx.fillStyle = c.bg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = c.line;
  ctx.stroke();
  ctx.fillStyle = c.accent;
  ctx.font = `600 26px ${mono}`;
  ctx.letterSpacing = "4px";
  ctx.fillText(eyebrow.toUpperCase(), 40, 66);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = c.ink;
  ctx.font = `500 ${line ? 62 : 70}px ${display}`;
  ctx.fillText(title, 38, line ? 152 : 180, w - 76);
  if (line) {
    ctx.fillStyle = c.muted;
    ctx.font = `italic 400 32px ${display}`;
    ctx.fillText(line, 40, 222, w - 80);
  }
  void sans;
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
