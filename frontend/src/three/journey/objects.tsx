"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { journey, scrollState } from "@/components/film/FilmProvider";
import { modules } from "@/content/site";
import { colors } from "@/content/generated/tokens";
import { useTheme, useView } from "@/lib/prefs";
import { play } from "@/lib/sound";
import { cardTexture, monogramGeometry, screenTexture, screenUrl, type CardColors } from "./assets";
import { band, clamp01, ease, emerge, live, lpOf } from "./live";

const TAU = Math.PI * 2;

/** Scratch objects for the per-frame maths (nothing is allocated while the story plays). */
const home = new THREE.Vector3();
const at = new THREE.Vector3();
const turn = new THREE.Quaternion();
const euler = new THREE.Euler();

function usePalette() {
  const dark = useTheme() === "dark";
  return { dark, c: dark ? colors.dark : colors.light };
}

function useCardColors(): CardColors {
  const { dark, c } = usePalette();
  return useMemo(
    () => ({ bg: dark ? c.sheet : c["surface-lowest"], line: dark ? c.outline : c.hairline, ink: c.text, muted: c["text-soft"], accent: c.accent }),
    [dark, c],
  );
}

/* ================================================================ phone */

/**
 * The display, drawn as one surface under the front glass: the black bezel, the punch-hole
 * camera, the screen with rounded corners, and reflections of the room that slide across the
 * glass as the phone turns. Screens change the way a phone really moves between them, each with
 * depth (the screen underneath falls back, dims and goes soft):
 *   0  ink bleed         the same screen restyled (Cards to Editorial): ink spreads through it
 *   1  push              the new screen slides in as a card over the old one, casting a shadow
 *   2  container         a ghost finger taps the tab bar; the tab grows into the new screen
 *   3  zoom-through      a new chapter: the old screen swells and fades as the new one settles in
 * While an act's object passes through the glass (uPortal), the screen's content twists gently in
 * toward its middle, where a soft, oxblood-stained depth opens (no light, no rings).
 * Textures are sRGB, so the output is converted back with colorspace_fragment.
 */
const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SCREEN_FRAG = /* glsl */ `
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uHasA;
uniform float uMix;
uniform float uMode;
uniform float uDir;
uniform vec2 uTap;
uniform vec2 uSize;
uniform float uBezel;
uniform float uRadius;
uniform vec3 uBase;
uniform vec3 uInk;
uniform vec3 uEnv;
uniform float uGlare;
uniform float uPortal;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float easeIO(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }
// Material's emphasised deceleration: quick to leave, long to settle.
float easeOut(float t) { return 1.0 - pow(1.0 - t, 4.0); }
// The bias softens a screen through its mipmaps: a cheap, clean depth-of-field.
vec3 texA(vec2 uv, float blur) { return uHasA > 0.5 ? texture2D(uA, uv, blur).rgb : uBase; }
vec3 texB(vec2 uv, float blur) { return texture2D(uB, uv, blur).rgb; }
vec3 texA(vec2 uv) { return texA(uv, 0.0); }
vec3 texB(vec2 uv) { return texB(uv, 0.0); }
// A screen scaled about a point; outside it, the dark of the panel.
vec3 scaledA(vec2 uv, vec2 o, float k, float blur, float dim) {
  vec2 q = o + (uv - o) / k;
  float inside = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
  return mix(uBase * 0.15, texA(clamp(q, 0.0, 1.0), blur) * dim, inside);
}

vec3 content(vec2 suv, vec2 sp, vec2 sh) {
  if (uMix <= 0.0) return texA(suv);
  float t = clamp(uMix, 0.0, 1.0);
  float e = easeIO(t);
  float d = easeOut(t);
  vec3 c;
  if (uMode < 0.5) {
    // Ink bleed, rising from the bottom along a noise field, with a tide line of accent ink.
    float field = fbm(suv * vec2(3.0, 6.5)) * 0.55 + (1.0 - suv.y) * 0.45;
    float k = smoothstep(field - 0.035, field + 0.035, uMix * 1.35 - 0.2);
    float edge = smoothstep(0.0, 0.5, k) * smoothstep(1.0, 0.5, k);
    c = mix(texA(suv), texB(suv), k);
    c = mix(c, uInk, edge * 0.9);
  } else if (uMode < 1.5) {
    // Push: the new screen is a card sliding in; the old one recedes (scale, dim, soften) beneath it.
    float x0 = (1.0 - d) * uDir;
    vec2 local = vec2(suv.x - x0, suv.y);
    vec3 under = scaledA(suv - vec2(d * 0.12 * uDir, 0.0), vec2(0.5), 1.0 - d * 0.08, d * 2.5, 1.0 - d * 0.5);
    // The card's rounded leading corners and a soft shadow ahead of it.
    vec2 cp = (local - 0.5) * sh * 2.0;
    float card = sdRound(cp, sh, 0.06 * (1.0 - d));
    float inCard = smoothstep(0.004, -0.004, card);
    float shadow = exp(-max(card, 0.0) * 18.0) * 0.45 * (1.0 - d * 0.6);
    c = mix(under * (1.0 - shadow), texB(clamp(local, 0.0, 1.0)), inCard);
  } else if (uMode < 2.5) {
    // Container transform: from the tapped tab, a rounded rectangle grows into the whole screen,
    // carrying the new screen scaled inside it; the old screen dims and softens behind.
    vec2 tp = (uTap - 0.5) * sh * 2.0;
    vec2 centre = mix(tp, vec2(0.0), d);
    vec2 half_ = mix(vec2(0.07, 0.045), sh, d);
    float rad = mix(0.045, 0.0, d);
    float box = sdRound(sp - centre, half_, rad);
    float inside = smoothstep(0.004, -0.004, box);
    vec2 inner = (sp - centre) / half_ * 0.5 + 0.5;
    vec3 newC = texB(clamp(inner, 0.0, 1.0), (1.0 - d) * 3.0);
    // The new screen fades up inside the growing box, so it starts as the tab's own colour.
    newC = mix(uBase, newC, smoothstep(0.15, 0.6, t));
    vec3 old = scaledA(suv, uTap, 1.0 + d * 0.06, d * 3.0, 1.0 - d * 0.55);
    float glow = exp(-max(box, 0.0) * 30.0) * 0.25 * (1.0 - d);
    c = mix(old * (1.0 - glow), newC, inside);
  } else {
    // Zoom-through: the old screen swells and fades out of focus; the new one settles from smaller.
    vec3 old = scaledA(suv, vec2(0.5), 1.0 + e * 0.12, e * 4.0, 1.0);
    vec2 q = 0.5 + (suv - 0.5) / mix(0.9, 1.0, d);
    float inside = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
    vec3 newC = mix(uBase * 0.15, texB(clamp(q, 0.0, 1.0), (1.0 - d) * 3.0), inside);
    c = mix(old, newC, smoothstep(0.2, 0.75, t));
  }
  // The ghost finger: a soft press and a widening ring at the tap, early in a tapped change.
  if (uMode > 1.5 && uMode < 2.5) {
    vec2 tp = (uTap - 0.5) * sh * 2.0;
    float td = length(sp - tp);
    float press = smoothstep(0.3, 0.0, uMix) * smoothstep(0.07, 0.0, td) * 0.3;
    float ring = smoothstep(0.01, 0.0, abs(td - uMix * 0.4)) * smoothstep(0.35, 0.05, uMix) * 0.5;
    c = mix(c, vec3(1.0), press + ring * 0.5);
  }
  return c;
}

void main() {
  vec2 hs = uSize * 0.5;
  vec2 p = (vUv - 0.5) * uSize;
  vec2 sh = hs - uBezel;
  float aa = fwidth(p.x) * 1.2;
  float dScreen = sdRound(p, sh, uRadius);
  float inScreen = smoothstep(aa, -aa, dScreen);
  vec2 suv = (p + sh) / (2.0 * sh);
  // The bezel: deep black glass with a faint inner edge.
  vec3 bezel = vec3(0.012, 0.011, 0.011) + smoothstep(0.012, 0.0, abs(dScreen - 0.004)) * 0.025;
  // Ink vortex: the content swirls and is drawn in toward the middle, as if through a lens.
  vec2 pw = p;
  float rr = 0.0;
  if (uPortal > 0.002) {
    rr = length(p) / sh.x;
    float a = uPortal * 0.8 * exp(-rr * rr * 3.0);
    float cs = cos(a), sn = sin(a);
    pw = mat2(cs, -sn, sn, cs) * p * (1.0 + uPortal * 0.16 * exp(-rr * rr * 4.0));
  }
  vec2 suvW = clamp((pw + sh) / (2.0 * sh), 0.0, 1.0);
  vec3 scr = content(suvW, pw, sh);
  // A real panel falls off a little at its very edges.
  scr *= 1.0 - 0.06 * smoothstep(-0.05, 0.0, dScreen);
  if (uPortal > 0.002) {
    // A soft depth opens at the centre, stained with oxblood ink, with no edge to it.
    float depth = exp(-rr * rr * 7.0);
    scr = mix(scr, uInk * 0.55, uPortal * 0.45 * depth);
    scr *= 1.0 - uPortal * (0.12 + 0.55 * depth);
  }
  vec3 col = mix(bezel, scr, inScreen);
  // The punch-hole camera, with a pin of light in its lens.
  vec2 cam = p - vec2(0.0, sh.y - 0.055);
  float hole = smoothstep(0.024 + aa, 0.024 - aa, length(cam));
  col = mix(col, vec3(0.0), hole);
  col += hole * smoothstep(0.008, 0.0, length(cam - vec2(-0.006, 0.006))) * 0.35;
  // Reflections: the room slides across the glass as the phone turns; a fresnel sheen at grazing angles.
  vec3 nn = normalize(vN);
  vec3 r = reflect(-vV, nn);
  float s = r.x * 0.8 + r.y * 0.55;
  float band = smoothstep(0.22, 0.0, abs(s - 0.32)) * 0.8 + smoothstep(0.5, 0.0, abs(s + 0.55)) * 0.25;
  float fres = pow(1.0 - max(dot(nn, vV), 0.0), 3.0);
  col += uEnv * (band * uGlare + fres * 0.5);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

/** Phone proportions (a 71 x 148 x 8 mm phone at 1.2 units wide). */
const PW = 1.2;
const PH = 2.5;
const PD = 0.1;
const PR = 0.17;
const BEZEL = 0.032;

function roundedShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** A flat rounded panel with UVs running 0..1 across its bounds. */
function panelGeometry(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(roundedShape(w, h, r), 32);
  const pos = g.attributes.position!;
  const uv = g.attributes.uv!;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  return g;
}

function bandGeometry() {
  const bevel = 0.014;
  const g = new THREE.ExtrudeGeometry(roundedShape(PW - bevel * 2, PH - bevel * 2, PR - bevel), {
    depth: PD - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 32,
  });
  g.translate(0, 0, -(PD - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}

/** Where a ghost finger taps for a screen: along the bottom tab bar, a different spot each time. */
function tapFor(i: number): [number, number] {
  const slots = [0.12, 0.31, 0.5, 0.69, 0.88];
  return [slots[i % slots.length]!, 0.055];
}

/** The phone that carries the story: real screenshots under the glass, the ribbon N on its back. */
export function Phone() {
  const { dark, c } = usePalette();
  const view = useView();
  const theme = dark ? "dark" : "light";
  const g = useRef<THREE.Group>(null);
  const state = useRef({ url: "", pending: "", mix: 0, wobble: 0, kick: 0, kickDir: 1, lastIndex: -1, lastName: "", lastAct: "" });
  const geo = useMemo(
    () => ({ band: bandGeometry(), front: panelGeometry(PW - 0.018, PH - 0.018, PR - 0.009), back: panelGeometry(PW - 0.018, PH - 0.018, PR - 0.009) }),
    [],
  );
  const screen = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SCREEN_VERT,
        fragmentShader: SCREEN_FRAG,
        uniforms: {
          uA: { value: null },
          uB: { value: null },
          uHasA: { value: 0 },
          uMix: { value: 0 },
          uMode: { value: 0 },
          uDir: { value: 1 },
          uTap: { value: new THREE.Vector2(0.5, 0.5) },
          uSize: { value: new THREE.Vector2(PW - 0.018, PH - 0.018) },
          uBezel: { value: BEZEL },
          uRadius: { value: PR - BEZEL - 0.004 },
          uBase: { value: new THREE.Color() },
          uInk: { value: new THREE.Color() },
          uEnv: { value: new THREE.Color() },
          uGlare: { value: 0.12 },
          uPortal: { value: 0 },
        },
        toneMapped: false,
      }),
    [],
  );
  useEffect(() => {
    const u = screen.uniforms;
    (u.uBase!.value as THREE.Color).set(c.canvas).convertSRGBToLinear();
    (u.uInk!.value as THREE.Color).set(c.accent).convertSRGBToLinear();
    (u.uEnv!.value as THREE.Color).set(dark ? c.blush : colors.light.linen).convertSRGBToLinear();
    u.uGlare!.value = dark ? 0.1 : 0.16;
  }, [screen, c, dark]);
  useEffect(() => () => screen.dispose(), [screen]);

  // Warm the cache with every screen the story shows, in the current theme, in both views.
  useEffect(() => {
    const names = ["home", "quick-add", "notes", "tasks", "planner", "habits", "expenses", "journal", "travel", "moodboard", "focus", "nodo"];
    for (const n of names) for (const v of ["cards", "editorial"]) screenTexture(screenUrl(n, v, theme));
  }, [theme]);

  useFrame((s, dt) => {
    if (live.sleeping) return;
    const el = g.current;
    if (!el) return;
    const st = state.current;
    const ph = live.phone;
    const vis = ease(ph.v);
    el.visible = vis > 0.03;
    el.position.copy(live.phoneWorld);
    el.position.y += Math.sin(s.clock.elapsedTime * 0.9) * 0.035 * vis;
    st.wobble = THREE.MathUtils.damp(st.wobble, THREE.MathUtils.clamp(scrollState.velocity * 0.004, -0.25, 0.25), 6, dt);
    st.kick = THREE.MathUtils.damp(st.kick, 0, 3, dt);
    const kick = Math.sin(st.kick * Math.PI) * 0.16;
    el.rotation.set(
      ph.r[0] + journey.pointer.y * 0.08 + st.wobble * 0.6,
      ph.r[1] + journey.pointer.x * 0.16 + journey.spin + kick * st.kickDir,
      ph.r[2] - st.wobble * 0.3,
    );
    el.scale.setScalar(live.phoneScale * (0.15 + 0.85 * vis) * (1 + kick * 0.08));
    // The phone as drawn, for everything that comes out of it or goes back into it this frame.
    live.body.pos.copy(el.position);
    live.body.quat.setFromEuler(el.rotation);
    live.body.size = el.scale.x;
    live.mouth.set(0, 0, PD / 2 + 0.04).multiplyScalar(el.scale.x).applyQuaternion(live.body.quat).add(el.position);
    screen.uniforms.uPortal!.value = THREE.MathUtils.damp(screen.uniforms.uPortal!.value as number, live.portal, 7, dt);

    // Screen: move to the act's screenshot once it has loaded, with the transition that fits.
    const [name, forced] = live.screen.split("@") as [string, string | undefined];
    const want = screenUrl(name, forced ?? view, theme);
    const u = screen.uniforms;
    if (want && want !== st.url && want !== st.pending) {
      // A newer screen arrived mid-change: settle on whichever image shows more.
      if (st.pending && st.mix > 0) {
        if (st.mix > 0.5) {
          u.uA!.value = u.uB!.value;
          u.uHasA!.value = 1;
          st.url = st.pending;
        }
        st.mix = 0;
        u.uMix!.value = 0;
      }
      const idx = live.screenIndex;
      const newAct = live.act !== st.lastAct;
      let mode = 0;
      if (name !== st.lastName && st.url) {
        // A new chapter zooms through; inside one, alternate pushes and taps on the tab bar.
        mode = newAct ? 3 : idx % 2 === 0 ? 2 : 1;
        const dir = idx >= st.lastIndex ? 1 : -1;
        u.uDir!.value = dir;
        const tap = tapFor(idx);
        (u.uTap!.value as THREE.Vector2).set(tap[0], tap[1]);
        st.kick = 1;
        st.kickDir = dir;
      }
      u.uMode!.value = mode;
      st.lastIndex = idx;
      st.lastName = name;
      st.lastAct = live.act;
      st.pending = want;
      screenTexture(want, (tex) => {
        if (st.pending !== want) return;
        u.uB!.value = tex;
        st.mix = 0.0001;
        if (st.url) play("screen", { index: idx });
      });
    }
    if (st.mix > 0) {
      st.mix = Math.min(1, st.mix + dt * (u.uMode!.value === 0 ? 1.4 : u.uMode!.value === 3 ? 1.1 : 1.5));
      u.uMix!.value = st.mix;
      if (st.mix >= 1) {
        u.uA!.value = u.uB!.value;
        u.uHasA!.value = 1;
        u.uMix!.value = 0;
        st.url = st.pending;
        st.pending = "";
        st.mix = 0;
      }
    }
  }, -1);

  const body = dark ? c["ink-container"] : c.ink;
  const rim = dark ? c["text-muted"] : c.bronze;
  const mono = useMemo(() => monogramGeometry(0.03), []);
  const back = -PD / 2 - 0.0012;
  return (
    <>
      <Shadow />
      <group ref={g} visible={false}>
        {/* the metal band, bevelled where it meets the glass */}
        <mesh geometry={geo.band}>
          <meshPhysicalMaterial color={rim} metalness={1} roughness={0.26} clearcoat={0.6} clearcoatRoughness={0.2} envMapIntensity={1.3} />
        </mesh>
        {/* front glass with the display beneath it */}
        <mesh geometry={geo.front} position={[0, 0, PD / 2 + 0.0012]} material={screen} />
        {/* frosted glass back in the body's ink */}
        <mesh geometry={geo.back} position={[0, 0, back]} rotation={[0, Math.PI, 0]}>
          <meshPhysicalMaterial color={body} metalness={0.2} roughness={0.42} clearcoat={1} clearcoatRoughness={0.35} envMapIntensity={1.1} />
        </mesh>
        {/* the ribbon N, polished, on the frosted back */}
        <group position={[0, -0.12, back - 0.012]} rotation={[0, Math.PI, 0]} scale={[0.4, -0.4, 0.4]}>
          <mesh geometry={mono}>
            <meshPhysicalMaterial color={dark ? c.text : colors.light.linen} metalness={0.9} roughness={0.18} clearcoat={1} />
          </mesh>
        </group>
        {/* camera island: two lenses and a flash */}
        <group position={[0.3, 0.85, back]} rotation={[0, Math.PI, 0]}>
          <RoundedBox args={[0.44, 0.44, 0.03]} radius={0.1} smoothness={4} position={[0, 0, 0.012]}>
            <meshPhysicalMaterial color={body} metalness={0.4} roughness={0.15} clearcoat={1} />
          </RoundedBox>
          {[
            [-0.095, 0.095],
            [0.095, -0.095],
          ].map(([x, y], i) => (
            <group key={i} position={[x!, y!, 0.03]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.078, 0.078, 0.03, 48]} />
                <meshStandardMaterial color={rim} metalness={1} roughness={0.15} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]}>
                <cylinderGeometry args={[0.06, 0.06, 0.012, 48]} />
                <meshPhysicalMaterial color={colors.dark.canvas} metalness={0.1} roughness={0.02} clearcoat={1} />
              </mesh>
            </group>
          ))}
          <mesh position={[0.095, 0.095, 0.03]}>
            <circleGeometry args={[0.024, 24]} />
            <meshBasicMaterial color={colors.light.linen} />
          </mesh>
        </group>
        {/* side keys */}
        <RoundedBox args={[0.016, 0.3, 0.036]} radius={0.007} smoothness={3} position={[PW / 2 + 0.004, 0.5, 0]}>
          <meshStandardMaterial color={rim} metalness={1} roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.016, 0.16, 0.036]} radius={0.007} smoothness={3} position={[PW / 2 + 0.004, 0.08, 0]}>
          <meshStandardMaterial color={rim} metalness={1} roughness={0.3} />
        </RoundedBox>
      </group>
    </>
  );
}

/** A soft contact shadow that follows the phone across the stage, fading as it lifts or leaves. */
function Shadow() {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const ctx = cv.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(0.55, "rgba(0,0,0,0.18)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }, []);
  useFrame(() => {
    if (live.sleeping) return;
    const m = ref.current;
    if (!m) return;
    const vis = ease(live.phone.v);
    m.visible = vis > 0.05 && !live.portrait;
    m.position.set(live.phoneWorld.x, live.phoneWorld.y - 1.45 * live.phoneScale, live.phoneWorld.z - 0.2);
    m.scale.set(1.5 * live.phoneScale, 0.45 * live.phoneScale, 1);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.5 * vis;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2.4, 0, 0]} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.5} />
    </mesh>
  );
}

/* ============================================================== monogram */

/** Where the N sits on the phone's back (see the Phone's back), in the phone's own space. */
const SEAT_AT = new THREE.Vector3(0, -0.12, -PD / 2 - 0.0132);
const SEAT_TURN = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const own = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: new THREE.Vector3() };
const seat = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: new THREE.Vector3() };
/** The N as drawn this frame, for its halo. */
const monoAt = { pos: new THREE.Vector3(), s: 1 };

/**
 * The ribbon N as a solid in one ink. It tilts toward the pointer and spins when tapped. As it
 * merges (live.merge) it becomes the N on the phone's back: it travels onto it, turns, shrinks
 * and flattens to it, takes on its polished metal, catches a glint as it seats, and hands over to
 * it. In the finale the same happens in reverse, out of the phone.
 */
export function Monogram3D() {
  const { dark, c } = usePalette();
  const g = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const spin = useRef({ v: 0, a: 0 });
  const geo = useMemo(() => monogramGeometry(0.12), []);
  const tones = useMemo(
    () => ({ ink: new THREE.Color(dark ? c.text : c.ink), seat: new THREE.Color(dark ? c.text : colors.light.linen), metal: dark ? 0.35 : 0.55 }),
    [dark, c],
  );
  useFrame((s, dt) => {
    if (live.sleeping) return;
    const el = g.current;
    if (!el) return;
    const m = live.mono;
    const vis = ease(m.v);
    const mg = live.merge;
    el.visible = vis > 0.01 && mg < 0.995;
    const t = s.clock.elapsedTime;
    const sp = spin.current;
    sp.a += sp.v * dt;
    sp.v *= Math.exp(-dt * 1.6);
    own.pos.set(...placeMono());
    own.pos.y += Math.sin(t * 0.7) * 0.06 * vis;
    own.quat.setFromEuler(euler.set(m.r[0] - journey.pointer.y * 0.25, m.r[1] + journey.pointer.x * 0.45 + Math.sin(t * 0.35) * 0.18 + sp.a, m.r[2]));
    const k = m.s * 1.9 * (live.portrait ? 0.62 : 1) * (0.4 + 0.6 * vis);
    own.scale.set(k, -k, k);
    if (mg > 0.001) {
      const b = live.body;
      seat.pos.copy(SEAT_AT).multiplyScalar(b.size).applyQuaternion(b.quat).add(b.pos);
      seat.quat.copy(b.quat).multiply(SEAT_TURN);
      // The phone's N is a thinner casting (0.03 deep against 0.12).
      seat.scale.set(0.4, -0.4, 0.1).multiplyScalar(b.size);
      el.position.lerpVectors(own.pos, seat.pos, mg);
      el.quaternion.slerpQuaternions(own.quat, seat.quat, mg);
      el.scale.lerpVectors(own.scale, seat.scale, mg);
    } else {
      el.position.copy(own.pos);
      el.quaternion.copy(own.quat);
      el.scale.copy(own.scale);
    }
    monoAt.pos.copy(el.position);
    monoAt.s = m.s * (1 - mg);
    const ma = mat.current;
    if (ma) {
      ma.color.lerpColors(tones.ink, tones.seat, mg);
      ma.metalness = THREE.MathUtils.lerp(tones.metal, 0.9, mg);
      ma.roughness = THREE.MathUtils.lerp(0.28, 0.18, mg);
      ma.emissiveIntensity = Math.sin(Math.PI * clamp01((mg - 0.7) / 0.3)) * 0.6;
    }
  }, -0.5);
  return (
    <group
      ref={g}
      visible={false}
      onPointerDown={(e) => {
        if (live.mono.v < 0.5 || live.merge > 0.5) return;
        e.stopPropagation();
        spin.current.v += 9;
      }}
      onPointerOver={() => live.mono.v > 0.5 && live.merge < 0.5 && (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <mesh geometry={geo}>
        <meshPhysicalMaterial
          ref={mat}
          color={dark ? c.text : c.ink}
          metalness={dark ? 0.35 : 0.55}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.15}
          emissive={c.accent}
          emissiveIntensity={0}
        />
      </mesh>
    </group>
  );
}

const monoWorld = new THREE.Vector3();
function placeMono(): [number, number, number] {
  const p = live.mono.p;
  // Portrait: over the phone at dawn; at the end, above it (the Director lowers the phone for it).
  if (live.portrait) monoWorld.set(p[0] * live.half * 0.18, live.act === "finale" ? live.phoneWorld.y + 0.92 : p[1] * 0.45 + 0.87, p[2]);
  else monoWorld.set(p[0] * live.half, p[1], p[2]);
  return [monoWorld.x, monoWorld.y, monoWorld.z];
}

/** A hairline ring around the N, turning slowly, like a watch bezel. It goes where the N goes. */
export function Halo() {
  const { c } = usePalette();
  const g = useRef<THREE.Group>(null);
  const mats = useMemo(
    () => [0.5, 0.3, 0.6].map((o) => new THREE.MeshBasicMaterial({ color: c["text-soft"], transparent: true, opacity: o, depthWrite: false, userData: { o } })),
    [c],
  );
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);
  useFrame((s) => {
    if (live.sleeping) return;
    const el = g.current;
    if (!el) return;
    const k = ease(live.fx.halo) * (1 - live.merge);
    el.visible = k > 0.01 && monoAt.s > 0.01;
    el.position.copy(monoAt.pos);
    el.position.z -= 0.3 * monoAt.s;
    el.rotation.set(1.15 + Math.sin(s.clock.elapsedTime * 0.2) * 0.1, 0, s.clock.elapsedTime * 0.1);
    el.scale.setScalar(Math.max(0.001, monoAt.s * (live.portrait ? 0.42 : 1) * (0.7 + 0.3 * k)));
    for (const m of mats) m.opacity = (m.userData.o as number) * k;
  });
  return (
    <group ref={g} visible={false}>
      <mesh material={mats[0]}>
        <torusGeometry args={[1.9, 0.006, 8, 160]} />
      </mesh>
      <mesh rotation={[0.3, 0.2, 0]} material={mats[1]}>
        <torusGeometry args={[2.25, 0.004, 8, 160]} />
      </mesh>
      {Array.from({ length: 60 }, (_, i) => (
        <mesh key={i} material={mats[2]} position={[Math.cos((i / 60) * TAU) * 1.9, Math.sin((i / 60) * TAU) * 1.9, 0]} rotation={[0, 0, (i / 60) * TAU]}>
          <boxGeometry args={[i % 5 === 0 ? 0.12 : 0.05, 0.008, 0.008]} />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================ chips */

const CHIPS: [string, string, [number, number, number]][] = [
  ["Task", "Call the bank, 5 pm", [1.3, 0.98, 0.35]],
  ["Expense", "₹1,240 · Groceries", [1.55, 0.26, 0.55]],
  ["Note", "Moodboard ideas", [1.35, -0.48, 0.3]],
  ["Event", "Dinner, Fri 8 pm", [1.15, -1.2, 0.45]],
];

/** On narrow screens the cards fan out to both sides of the phone instead of one. */
const CHIPS_PORTRAIT: [number, number, number][] = [
  [-0.42, 0.78, 0.5],
  [0.42, 0.38, 0.6],
  [-0.42, -0.06, 0.5],
  [0.42, -0.48, 0.6],
];

/** One captured line, split into four things that come out through the screen to their places. */
export function Chips() {
  const cc = useCardColors();
  const tex = useMemo(() => CHIPS.map(([k, t]) => cardTexture(k, t, undefined, cc, 640, 230)), [cc]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    if (live.sleeping) return;
    const k = ease(live.fx.chips);
    const p = lpOf("capture");
    const sc = live.portrait ? 0.4 : 1;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const t = band(p, 0.08 + i * 0.07, 0.32 + i * 0.07) * k;
      m.visible = t > 0.01;
      const [ox, oy, oz] = live.portrait ? CHIPS_PORTRAIT[i]! : CHIPS[i]![2];
      home.set(live.phoneWorld.x + ox, live.phoneWorld.y + oy + Math.sin(s.clock.elapsedTime * 1.2 + i) * 0.03, live.phoneWorld.z + oz);
      turn.setFromEuler(euler.set(0, journey.pointer.x * 0.2 - ox * 0.12, 0));
      const g = emerge(home, t, at, turn);
      m.position.copy(at);
      m.quaternion.copy(turn);
      m.scale.setScalar(sc * g);
    });
  });
  return (
    <>
      {tex.map((t, i) => (
        <mesh key={i} ref={(m) => void (refs.current[i] = m)} visible={false}>
          <planeGeometry args={[1.25, 0.45]} />
          <meshBasicMaterial map={t} transparent toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/* ================================================================ orbit */

/**
 * Every module as a paper card in orbit around the phone, dealt out of its screen one after
 * another and gathered back into it. Hover lifts one; click opens its page.
 */
export function Orbit() {
  const cc = useCardColors();
  const router = useRouter();
  const list = modules.slice(0, 14);
  const tex = useMemo(() => list.map((m, i) => cardTexture(String(i + 1).padStart(2, "0"), m.name, m.line, cc)), [cc, list]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const hover = useRef(-1);
  const lift = useRef(list.map(() => 0));
  useFrame((s, dt) => {
    if (live.sleeping) return;
    const k = ease(live.fx.orbit);
    const p = lpOf("modules");
    const R = live.portrait ? 1.35 : 2.85;
    const rot = p * TAU * 0.75 + s.clock.elapsedTime * 0.05;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const e = clamp01(k * 1.5 - (i / list.length) * 0.5);
      m.visible = e > 0.01;
      const a = (i / list.length) * TAU + rot;
      lift.current[i] = THREE.MathUtils.damp(lift.current[i]!, hover.current === i ? 1 : 0, 10, dt);
      home.set(live.phoneWorld.x + Math.sin(a) * R, live.phoneWorld.y + 0.12 - Math.cos(a) * 0.42 + lift.current[i]! * 0.18, live.phoneWorld.z + Math.cos(a) * R * 0.5);
      turn.copy(s.camera.quaternion);
      const g = emerge(home, e, at, turn);
      m.position.copy(at);
      m.quaternion.copy(turn);
      const depth = (Math.cos(a) + 1) / 2;
      m.scale.setScalar((live.portrait ? 0.5 : 0.7) * g * (0.75 + 0.25 * depth + lift.current[i]! * 0.15));
      (m.material as THREE.MeshBasicMaterial).opacity = Math.min(1, e * 3) * (0.35 + 0.65 * depth);
    });
  });
  return (
    <>
      {tex.map((t, i) => (
        <mesh
          key={list[i]!.slug}
          ref={(m) => void (refs.current[i] = m)}
          visible={false}
          onPointerOver={(e) => {
            if (live.fx.orbit < 0.6) return;
            e.stopPropagation();
            hover.current = i;
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            if (hover.current === i) hover.current = -1;
            document.body.style.cursor = "";
          }}
          onClick={(e) => {
            if (live.fx.orbit < 0.6) return;
            e.stopPropagation();
            router.push(`/features/${list[i]!.slug}`);
          }}
        >
          <planeGeometry args={[1.28, 0.6]} />
          <meshBasicMaterial map={t} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ================================================================ focus watchmaker dial */

/**
 * Authentic 3D Watchmaker Focus Dial: directly matches the Breguet watch dial inside the app.
 * Features authentic Breguet pomme hands (moon-eye needles), 60 Swiss railroad chapter ticks
 * with oxblood cardinal accents, center arbor collar with ruby pivot jewel, and a curved sapphire lens.
 *
 * Emergence & Shrink:
 * Originates directly from the Watchmaker dial on the phone's focus timer screen, lifts off the glass
 * along an arc into the foreground as Act VII scrolls into view, and shrinks right back into the phone screen.
 */
export function Movement() {
  const { dark, c } = usePalette();
  const root = useRef<THREE.Group>(null);
  const secHand = useRef<THREE.Group>(null);
  const minHand = useRef<THREE.Group>(null);
  const hourHand = useRef<THREE.Group>(null);
  const arcMesh = useRef<THREE.Mesh>(null);

  const tickSec = useRef(0);

  // Scratch vectors for emergence (no allocations in useFrame)
  const phoneDialLocal = useMemo(() => new THREE.Vector3(0, 0.38, PD / 2 + 0.015), []);
  const phoneDialWorld = useMemo(() => new THREE.Vector3(), []);
  const targetTurn = useMemo(() => new THREE.Quaternion(), []);

  const geos = useMemo(() => {
    return {
      dialFaceGeo: new THREE.CylinderGeometry(1.0, 1.0, 0.03, 64),
      rimGeo: new THREE.TorusGeometry(1.01, 0.018, 16, 64),
      trackRingGeo: new THREE.TorusGeometry(0.88, 0.006, 8, 64),
      innerRingGeo: new THREE.TorusGeometry(0.52, 0.005, 8, 64),
      majorTickGeo: new THREE.BoxGeometry(0.024, 0.095, 0.015),
      minorTickGeo: new THREE.BoxGeometry(0.012, 0.048, 0.01),
      progressArcGeo: new THREE.TorusGeometry(0.88, 0.022, 16, 64, Math.PI * 1.5),

      // Breguet Minute Hand geometries (shaft, pomme circle, pointer tip, counterweight)
      minShaftGeo: new THREE.BoxGeometry(0.022, 0.52, 0.012),
      minPommeGeo: new THREE.TorusGeometry(0.065, 0.012, 16, 32),
      minTipGeo: new THREE.BoxGeometry(0.015, 0.22, 0.012),
      minTailGeo: new THREE.BoxGeometry(0.02, 0.12, 0.01),

      // Breguet Hour/Session Hand geometries
      hourShaftGeo: new THREE.BoxGeometry(0.022, 0.32, 0.012),
      hourPommeGeo: new THREE.TorusGeometry(0.055, 0.012, 16, 32),
      hourTipGeo: new THREE.BoxGeometry(0.015, 0.16, 0.012),
      hourTailGeo: new THREE.BoxGeometry(0.02, 0.09, 0.01),

      // Fine Seconds Hand geometries
      secNeedleGeo: new THREE.BoxGeometry(0.012, 0.88, 0.01),
      secPommeGeo: new THREE.TorusGeometry(0.035, 0.009, 8, 24),

      // Center Arbor and Pivot
      arborCollarGeo: new THREE.TorusGeometry(0.045, 0.01, 16, 32),
      centerJewelGeo: new THREE.CylinderGeometry(0.04, 0.04, 0.03, 24),
      crystalGeo: new THREE.CylinderGeometry(1.02, 1.02, 0.025, 64),
    };
  }, []);

  const indices = useMemo(() => {
    const list: { angle: number; major: boolean; accent: boolean }[] = [];
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * TAU;
      const major = i % 5 === 0;
      const accent = i === 0 || i === 15 || i === 30 || i === 45;
      list.push({ angle, major, accent });
    }
    return list;
  }, []);

  useFrame((s, dt) => {
    if (live.sleeping) return;
    const el = root.current;
    if (!el) return;
    const k = ease(live.fx.gears);
    el.visible = k > 0.005;
    if (!el.visible) return;

    const p = lpOf("focus");

    // Exact world coordinates of the Watchmaker dial on the phone screen
    phoneDialWorld
      .copy(phoneDialLocal)
      .multiplyScalar(live.body.size)
      .applyQuaternion(live.body.quat)
      .add(live.body.pos);

    // Resting showcase position in front of the phone
    home.set(
      live.portrait ? 0 : 0.42 * live.half,
      live.portrait ? 0.62 : 0.05,
      live.portrait ? 0.1 : 0.12
    );

    targetTurn.setFromEuler(
      euler.set(
        0.24 - journey.pointer.y * 0.15 + Math.sin(s.clock.elapsedTime * 1.2) * 0.015,
        -0.38 + journey.pointer.x * 0.2,
        0.04 + band(p, 0, 0.6) * 0.08
      )
    );

    // Emerge curve: 0 = on the phone dial, 1 = floating in front
    const d = 1 - Math.pow(1 - clamp01(k), 2.4);

    // Position: lerp from phone screen dial to home, along a parabolic Z arc
    at.lerpVectors(phoneDialWorld, home, d);
    at.z += Math.sin(Math.PI * d) * 0.48 * live.body.size;
    at.y += Math.sin(s.clock.elapsedTime * 1.5) * 0.03 * d;

    // Rotation: slerp from phone screen orientation to target showcase orientation
    turn.copy(live.body.quat).slerp(targetTurn, d);

    // Scale: scales from exact dial diameter on phone screen to full showcase size
    const phoneDialScale = (0.54 * PW / 2.0) * live.body.size;
    const showcaseScale = live.portrait ? 0.68 : 0.98;
    const currentScale = THREE.MathUtils.lerp(phoneDialScale, showcaseScale, d);

    el.position.copy(at);
    el.quaternion.copy(turn);
    el.scale.setScalar(currentScale);

    // Phone screen portal glow as dial emerges and retracts
    if (k > 0.001 && k < 0.999) {
      live.portalNext = Math.max(live.portalNext, Math.sin(Math.PI * Math.min(1, k * 1.5)));
    }

    // Hands movement: mechanical escapement ticking, coupled with scroll speed
    const speed = 1.0 + Math.min(5, Math.abs(scrollState.velocity) * 0.08);
    tickSec.current += dt * speed;

    if (secHand.current) {
      // 5-beat-per-second escapement tick
      const discreteSec = Math.floor(tickSec.current * 5) / 5;
      secHand.current.rotation.z = -((discreteSec * (TAU / 60)) % TAU);
    }

    if (minHand.current) {
      // Minute hand progress
      const sessionP = (p * 0.75 + (tickSec.current / 300) * 0.25) % 1;
      minHand.current.rotation.z = -(sessionP * TAU);
    }

    if (hourHand.current) {
      // Hour / session duration hand (e.g. indicating 25m mark)
      const hourP = (0.416 + (tickSec.current / 3600) * 0.1) % 1;
      hourHand.current.rotation.z = -(hourP * TAU);
    }

    if (arcMesh.current) {
      const targetArc = THREE.MathUtils.clamp(0.25 + p * 0.75, 0.1, 1.0);
      arcMesh.current.scale.set(targetArc, targetArc, 1);
    }
  });

  const metal = dark ? c.text : c.bronze;
  const dialColor = dark ? c["ink-container"] : c.surface;
  const trackColor = dark ? c["text-muted"] : c["text-soft"];

  return (
    <group
      ref={root}
      visible={false}
      onPointerOver={() => {
        if (live.fx.gears > 0.3) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
      onClick={() => {
        play("tick");
      }}
    >
      {/* Sleek Watchmaker Dial Disc (matches the app's charcoal dial bed) */}
      <mesh geometry={geos.dialFaceGeo} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
        <meshStandardMaterial
          color={dialColor}
          metalness={0.15}
          roughness={0.55}
        />
      </mesh>

      {/* Subtle Metallic Perimeter Bezel Rim */}
      <mesh geometry={geos.rimGeo} position={[0, 0, 0.026]}>
        <meshStandardMaterial
          color={metal}
          metalness={0.88}
          roughness={0.2}
        />
      </mesh>

      {/* Hairline Chapter Tracks */}
      <mesh geometry={geos.trackRingGeo} position={[0, 0, 0.028]}>
        <meshStandardMaterial color={trackColor} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh geometry={geos.innerRingGeo} position={[0, 0, 0.028]}>
        <meshStandardMaterial color={trackColor} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* 60 Chapter Railroad Indices (matches app: 12 cardinal/5-min + 48 hairlines) */}
      {indices.map(({ angle, major, accent }, i) => {
        const rad = 0.88;
        const x = Math.sin(angle) * rad;
        const y = Math.cos(angle) * rad;
        return (
          <mesh
            key={i}
            geometry={major ? geos.majorTickGeo : geos.minorTickGeo}
            position={[x, y, 0.03]}
            rotation={[0, 0, -angle]}
          >
            <meshStandardMaterial
              color={accent ? c.accent : major ? metal : trackColor}
              metalness={major ? 0.85 : 0.5}
              roughness={0.25}
              emissive={accent ? c.accent : undefined}
              emissiveIntensity={accent ? 0.4 : 0}
            />
          </mesh>
        );
      })}

      {/* Luminous Focus Session Progress Arc */}
      <mesh ref={arcMesh} geometry={geos.progressArcGeo} position={[0, 0, 0.032]}>
        <meshStandardMaterial
          color={c.accent}
          metalness={0.4}
          roughness={0.2}
          emissive={c.accent}
          emissiveIntensity={0.85}
        />
      </mesh>

      {/* Authentic Breguet Hour Hand (with hollow moon-eye pomme) */}
      <group ref={hourHand} position={[0, 0, 0.042]}>
        {/* Shaft */}
        <mesh geometry={geos.hourShaftGeo} position={[0, 0.16, 0]}>
          <meshStandardMaterial color={metal} metalness={0.92} roughness={0.18} />
        </mesh>
        {/* Breguet Moon Pomme Eye */}
        <mesh geometry={geos.hourPommeGeo} position={[0, 0.38, 0]}>
          <meshStandardMaterial color={metal} metalness={0.92} roughness={0.18} />
        </mesh>
        {/* Pointer Tip */}
        <mesh geometry={geos.hourTipGeo} position={[0, 0.52, 0]}>
          <meshStandardMaterial color={metal} metalness={0.92} roughness={0.18} />
        </mesh>
        {/* Counterweight Tail */}
        <mesh geometry={geos.hourTailGeo} position={[0, -0.045, 0]}>
          <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Authentic Breguet Minute Hand (longer, with hollow moon-eye pomme) */}
      <group ref={minHand} position={[0, 0, 0.054]}>
        {/* Shaft */}
        <mesh geometry={geos.minShaftGeo} position={[0, 0.26, 0]}>
          <meshStandardMaterial color={metal} metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Breguet Moon Pomme Eye */}
        <mesh geometry={geos.minPommeGeo} position={[0, 0.58, 0]}>
          <meshStandardMaterial color={metal} metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Pointer Tip */}
        <mesh geometry={geos.minTipGeo} position={[0, 0.74, 0]}>
          <meshStandardMaterial color={metal} metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Counterweight Tail */}
        <mesh geometry={geos.minTailGeo} position={[0, -0.06, 0]}>
          <meshStandardMaterial color={metal} metalness={0.92} roughness={0.18} />
        </mesh>
      </group>

      {/* Fine Sweeping Seconds Hand in Oxblood Accent */}
      <group ref={secHand} position={[0, 0, 0.068]}>
        <mesh geometry={geos.secNeedleGeo} position={[0, 0.38, 0]}>
          <meshStandardMaterial
            color={c.accent}
            metalness={0.7}
            roughness={0.2}
            emissive={c.accent}
            emissiveIntensity={0.45}
          />
        </mesh>
        <mesh geometry={geos.secPommeGeo} position={[0, -0.14, 0]}>
          <meshStandardMaterial color={c.accent} metalness={0.75} roughness={0.2} />
        </mesh>
      </group>

      {/* Center Arbor Collar Ring and Ruby Pivot Jewel */}
      <mesh geometry={geos.arborCollarGeo} position={[0, 0, 0.076]}>
        <meshStandardMaterial color={metal} metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh geometry={geos.centerJewelGeo} position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={c.accent}
          metalness={0.5}
          roughness={0.1}
          emissive={c.accent}
          emissiveIntensity={0.65}
        />
      </mesh>

      {/* Domed Sapphire Crystal Glass Lens */}
      <mesh geometry={geos.crystalGeo} position={[0, 0, 0.092]} rotation={[Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial
          color={dark ? c.text : c.linen}
          transmission={0.94}
          opacity={1}
          transparent={true}
          roughness={0.04}
          ior={1.52}
          thickness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.03}
        />
      </mesh>
    </group>
  );
}

export const FocusDial3D = Movement;

/* ================================================================= bars */

const WEEK = [0.42, 0.7, 0.3, 1.0, 0.55, 0.82, 0.38];

/** The week's spending as a ledger that comes out of the phone and rises beside it; today is in oxblood. */
export function Bars() {
  const { dark, c } = usePalette();
  const g = useRef<THREE.Group>(null);
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    if (live.sleeping) return;
    const el = g.current;
    if (!el) return;
    const k = ease(live.fx.bars);
    el.visible = k > 0.01;
    const p = lpOf("money");
    const sc = live.portrait ? 0.55 : 1;
    home.set(live.phoneWorld.x + 1.25 * sc, live.phoneWorld.y - 1.05 * sc, live.phoneWorld.z + 0.2);
    turn.setFromEuler(euler.set(0.08, -0.5 + journey.pointer.x * 0.15, 0));
    const out = emerge(home, k, at, turn);
    el.position.copy(at);
    el.quaternion.copy(turn);
    el.scale.setScalar(sc * out);
    bars.current.forEach((m, i) => {
      if (!m) return;
      const h = Math.max(0.001, WEEK[i]! * 1.9 * band(p, 0.04 + i * 0.05, 0.3 + i * 0.05) * k);
      m.scale.y = h;
      m.position.y = h / 2;
    });
  });
  return (
    <group ref={g} visible={false}>
      {WEEK.map((_, i) => (
        <mesh key={i} ref={(m) => void (bars.current[i] = m)} position={[i * 0.3, 0, 0]}>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshPhysicalMaterial color={i === 6 ? c.accent : dark ? c.track : c["surface-high"]} roughness={0.4} clearcoat={0.6} />
        </mesh>
      ))}
      <mesh position={[0.9, -0.01, 0]}>
        <boxGeometry args={[2.3, 0.012, 0.36]} />
        <meshBasicMaterial color={c["text-soft"]} />
      </mesh>
    </group>
  );
}

/* ================================================================= seal */

/**
 * The seal comes out of the phone; wax pools, the stamp presses as you scroll, lifts, and the
 * ribbon N is left in the wax.
 */
export function Seal() {
  const { c } = usePalette();
  const g = useRef<THREE.Group>(null);
  const stamp = useRef<THREE.Group>(null);
  const wax = useRef<THREE.Mesh>(null);
  const mark = useRef<THREE.Group>(null);
  const mono = useMemo(() => monogramGeometry(0.04), []);
  const waxGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(1, 1.05, 0.14, 96, 1);
    const pos = geo.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const wob = 1 + 0.06 * Math.sin(a * 7) + 0.035 * Math.sin(a * 13 + 1.3);
      if (Math.hypot(x, z) > 0.5) {
        pos.setX(i, x * wob);
        pos.setZ(i, z * wob);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  useFrame(() => {
    if (live.sleeping) return;
    const el = g.current;
    if (!el) return;
    const k = ease(live.fx.seal);
    el.visible = k > 0.01;
    const p = lpOf("evening");
    const press = band(p, 0.2, 0.42);
    const up = band(p, 0.5, 0.64);
    home.set(live.portrait ? 0 : 0.42 * live.half, live.portrait ? 0.55 : -0.25, 0);
    turn.setFromEuler(euler.set(0.5 + journey.pointer.y * 0.08, -0.35 + journey.pointer.x * 0.15, 0));
    const out = emerge(home, k, at, turn);
    el.position.copy(at);
    el.quaternion.copy(turn);
    el.scale.setScalar((live.portrait ? 0.55 : 0.82) * out);
    if (stamp.current) stamp.current.position.y = 2.6 - press * 2.42 + up * 2.6;
    if (wax.current) {
      const s = 0.45 + band(p, 0, 0.2) * 0.55 + press * 0.12;
      wax.current.scale.set(s, 1 - press * 0.35, s);
    }
    if (mark.current) mark.current.visible = up > 0.02;
  });
  const waxColor = c.noir;
  return (
    <group ref={g} visible={false}>
      <mesh ref={wax} geometry={waxGeo}>
        <meshPhysicalMaterial color={waxColor} roughness={0.42} clearcoat={0.5} sheen={0.4} sheenColor={c.oxblood} />
      </mesh>
      {/* the impression: the N in the same wax, standing in relief */}
      <group ref={mark} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.05, -1.05, 1.05]}>
        <mesh geometry={mono}>
          <meshPhysicalMaterial color={waxColor} roughness={0.3} clearcoat={0.8} />
        </mesh>
      </group>
      <group ref={stamp} position={[0, 2.6, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.13, 0.22, 0.85, 48]} />
          <meshStandardMaterial color={c["ink-container"]} metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.98, 0]}>
          <sphereGeometry args={[0.19, 32, 24]} />
          <meshStandardMaterial color={c["ink-container"]} metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.34, 0.6, 0.12, 64]} />
          <meshStandardMaterial color={c.bronze} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.62, 0.62, 0.06, 64]} />
          <meshStandardMaterial color={c.bronze} metalness={0.85} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/* ================================================================ motes */

const MOTES = 54;

/**
 * Memories in orbit around Nodo, streaming out of the screen and back into it. Past the middle of
 * the act, every third one is forgotten.
 */
export function Motes() {
  const { c } = usePalette();
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => Array.from({ length: MOTES }, (_, i) => ({ r: 1.05 + ((i * 37) % 11) / 11, a: (i / MOTES) * TAU, y: (((i * 53) % 17) / 17 - 0.5) * 2.4, s: 0.6 + ((i * 7) % 5) / 6 })), []);
  const m = useMemo(() => new THREE.Object3D(), []);
  useFrame((s) => {
    if (live.sleeping) return;
    const el = ref.current;
    if (!el) return;
    const k = ease(live.fx.motes);
    el.visible = k > 0.01;
    const p = lpOf("nodo");
    const forget = band(p, 0.45, 0.75);
    const sc = live.portrait ? 0.6 : 1;
    const t = s.clock.elapsedTime;
    seeds.forEach((sd, i) => {
      const a = sd.a + t * 0.18 * (i % 2 ? 1 : -0.7);
      const gone = i % 3 === 0 ? forget : 0;
      const e = clamp01(k * 1.4 - (i / MOTES) * 0.4);
      home.set(live.phoneWorld.x + Math.cos(a) * sd.r * sc * (1 + gone * 0.6), live.phoneWorld.y + sd.y * sc + gone * 0.8, live.phoneWorld.z + Math.sin(a) * sd.r * sc * 0.7);
      const g = emerge(home, e, at);
      m.position.copy(at);
      m.scale.setScalar(e > 0.001 ? 0.02 * sd.s * g * (1 - gone) * sc + 0.00001 : 0.00001);
      m.updateMatrix();
      el.setMatrixAt(i, m.matrix);
    });
    el.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MOTES]} visible={false}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial color={c.blush} roughness={0.35} metalness={0.1} />
    </instancedMesh>
  );
}

/* ================================================================= dust */

/** Fine ink motes drifting through the whole story; scrolling stirs them. */
export function Dust() {
  const { dark, c } = usePalette();
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 700;
    const a = new Float32Array(n * 3);
    let seed = 3;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      a[i * 3] = (rnd() - 0.5) * 16;
      a[i * 3 + 1] = (rnd() - 0.5) * 10;
      a[i * 3 + 2] = -rnd() * 6 + 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, []);
  const drift = useRef(0);
  useFrame((s, dt) => {
    if (live.sleeping) return;
    const el = ref.current;
    if (!el) return;
    drift.current += dt * 0.05 + scrollState.velocity * 0.0006;
    el.position.y = ((drift.current % 2) + 2) % 2 - 1;
    el.rotation.y = s.clock.elapsedTime * 0.01 + journey.pointer.x * 0.04;
    el.rotation.x = journey.pointer.y * 0.03;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={dark ? c.blush : c["text-soft"]} size={0.022} sizeAttenuation transparent opacity={dark ? 0.55 : 0.4} depthWrite={false} />
    </points>
  );
}

