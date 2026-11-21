"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { journey, progress, scrollState } from "@/components/film/FilmProvider";
import { modules } from "@/content/site";
import { colors } from "@/content/generated/tokens";
import { useTheme, useView } from "@/lib/prefs";
import { cardTexture, cipherTexture, monogramGeometry, screenTexture, screenUrl, type CardColors } from "./assets";
import { band, ease, live } from "./live";

const TAU = Math.PI * 2;

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

/** The phone that carries the story: real screenshots on its screen, the ribbon N on its back. */
export function Phone() {
  const { dark, c } = usePalette();
  const view = useView();
  const theme = dark ? "dark" : "light";
  const g = useRef<THREE.Group>(null);
  const front = useRef<THREE.MeshBasicMaterial>(null);
  const next = useRef<THREE.MeshBasicMaterial>(null);
  const state = useRef({ url: "", pending: "", fade: 0, wobble: 0 });

  // Warm the cache with every screen the story shows, in the current theme and view.
  useEffect(() => {
    for (const s of ["home", "quick-add", "tasks", "focus", "expenses", "habits", "nodo"]) screenTexture(screenUrl(s, view, theme));
  }, [view, theme]);

  useFrame((s, dt) => {
    const el = g.current;
    if (!el) return;
    const ph = live.phone;
    const vis = ease(ph.v);
    el.visible = vis > 0.03;
    el.position.copy(live.phoneWorld);
    el.position.y += Math.sin(s.clock.elapsedTime * 0.9) * 0.035 * vis;
    state.current.wobble = THREE.MathUtils.damp(state.current.wobble, THREE.MathUtils.clamp(scrollState.velocity * 0.004, -0.25, 0.25), 6, dt);
    el.rotation.set(
      ph.r[0] + journey.pointer.y * 0.08 + state.current.wobble * 0.6,
      ph.r[1] + journey.pointer.x * 0.16 + journey.spin,
      ph.r[2] - state.current.wobble * 0.3,
    );
    el.scale.setScalar(live.phoneScale * (0.15 + 0.85 * vis));

    // Screen: crossfade to the act's screenshot once it has loaded.
    const st = state.current;
    const want = screenUrl(live.screen, view, theme);
    if (want && want !== st.url && want !== st.pending) {
      st.pending = want;
      screenTexture(want, (tex) => {
        if (st.pending !== want || !next.current) return;
        next.current.map = tex;
        next.current.needsUpdate = true;
        st.fade = 0.0001;
      });
    }
    if (st.fade > 0 && next.current && front.current) {
      st.fade = Math.min(1, st.fade + dt * 3.2);
      next.current.opacity = st.fade;
      if (st.fade >= 1) {
        front.current.color.set(colors.light["surface-lowest"]);
        front.current.map = next.current.map;
        front.current.needsUpdate = true;
        next.current.opacity = 0;
        st.url = st.pending;
        st.pending = "";
        st.fade = 0;
      }
    }
  });

  const body = dark ? c["ink-container"] : c.ink;
  const mono = useMemo(() => monogramGeometry(0.05), []);
  return (
    <group ref={g} visible={false}>
      <RoundedBox args={[1.2, 2.52, 0.11]} radius={0.15} smoothness={6}>
        <meshPhysicalMaterial color={body} metalness={0.6} roughness={0.3} clearcoat={1} clearcoatRoughness={0.18} />
      </RoundedBox>
      <mesh position={[0, 0, 0.0565]}>
        <planeGeometry args={[1.1, 2.42]} />
        <meshBasicMaterial color={colors.dark.canvas} />
      </mesh>
      <mesh position={[0, 0, 0.058]}>
        <planeGeometry args={[1.08, 2.4]} />
        <meshBasicMaterial ref={front} color={c.canvas} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.0585]}>
        <planeGeometry args={[1.08, 2.4]} />
        <meshBasicMaterial ref={next} transparent opacity={0} toneMapped={false} />
      </mesh>
      {/* glass */}
      <mesh position={[0, 0, 0.0595]}>
        <planeGeometry args={[1.12, 2.44]} />
        <meshPhysicalMaterial transparent opacity={0.07} roughness={0.04} clearcoat={1} color={colors.light.surface} />
      </mesh>
      {/* the ribbon N on the back, in the body's opposite ink */}
      <group position={[0, 0.25, -0.058]} rotation={[0, Math.PI, 0]} scale={[0.5, -0.5, 0.5]}>
        <mesh geometry={mono}>
          <meshStandardMaterial color={dark ? c.text : c.canvas} metalness={0.4} roughness={0.35} />
        </mesh>
      </group>
      {/* side keys */}
      <mesh position={[0.605, 0.55, 0]}>
        <boxGeometry args={[0.02, 0.28, 0.05]} />
        <meshStandardMaterial color={body} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.605, 0.15, 0]}>
        <boxGeometry args={[0.02, 0.16, 0.05]} />
        <meshStandardMaterial color={body} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ============================================================== monogram */

/** The ribbon N as a solid in one ink. It tilts toward the pointer and spins when tapped. */
export function Monogram3D() {
  const { dark, c } = usePalette();
  const g = useRef<THREE.Group>(null);
  const spin = useRef({ v: 0, a: 0 });
  const geo = useMemo(() => monogramGeometry(0.12), []);
  useFrame((s, dt) => {
    const el = g.current;
    if (!el) return;
    const m = live.mono;
    const vis = ease(m.v);
    el.visible = vis > 0.01;
    const t = s.clock.elapsedTime;
    const sp = spin.current;
    sp.a += sp.v * dt;
    sp.v *= Math.exp(-dt * 1.6);
    el.position.set(...placeMono());
    el.position.y += Math.sin(t * 0.7) * 0.06 * vis;
    el.rotation.set(m.r[0] - journey.pointer.y * 0.25, m.r[1] + journey.pointer.x * 0.45 + Math.sin(t * 0.35) * 0.18 + sp.a, m.r[2]);
    const k = m.s * 1.9 * (live.portrait ? 0.62 : 1) * (0.4 + 0.6 * vis);
    el.scale.set(k, -k, k);
  });
  return (
    <group
      ref={g}
      visible={false}
      onPointerDown={(e) => {
        if (live.mono.v < 0.5) return;
        e.stopPropagation();
        spin.current.v += 9;
      }}
      onPointerOver={() => live.mono.v > 0.5 && (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <mesh geometry={geo}>
        <meshPhysicalMaterial color={dark ? c.text : c.ink} metalness={dark ? 0.35 : 0.55} roughness={0.28} clearcoat={1} clearcoatRoughness={0.15} />
      </mesh>
    </group>
  );
}

const monoWorld = new THREE.Vector3();
function placeMono(): [number, number, number] {
  const p = live.mono.p;
  if (live.portrait) monoWorld.set(p[0] * live.half * 0.18, p[1] * 0.45 + 0.72, p[2]);
  else monoWorld.set(p[0] * live.half, p[1], p[2]);
  return [monoWorld.x, monoWorld.y, monoWorld.z];
}

/** A hairline ring around the N, turning slowly, like a watch bezel. */
export function Halo() {
  const { c } = usePalette();
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    const el = g.current;
    if (!el) return;
    const k = ease(live.fx.halo);
    el.visible = k > 0.01;
    const atFinale = live.act === "finale";
    const [x, y, z] = atFinale ? [live.phoneWorld.x, live.phoneWorld.y, live.phoneWorld.z - 0.4] : placeMono();
    el.position.set(x, y, z - 0.3);
    el.rotation.set(1.15 + Math.sin(s.clock.elapsedTime * 0.2) * 0.1, 0, s.clock.elapsedTime * 0.1);
    el.scale.setScalar((live.portrait ? 0.6 : 1) * (0.7 + 0.3 * k) * (atFinale ? 1.25 : 1));
  });
  return (
    <group ref={g} visible={false}>
      <mesh>
        <torusGeometry args={[1.9, 0.006, 8, 160]} />
        <meshBasicMaterial color={c["text-soft"]} transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[0.3, 0.2, 0]}>
        <torusGeometry args={[2.25, 0.004, 8, 160]} />
        <meshBasicMaterial color={c["text-soft"]} transparent opacity={0.3} />
      </mesh>
      {Array.from({ length: 60 }, (_, i) => (
        <mesh key={i} position={[Math.cos((i / 60) * TAU) * 1.9, Math.sin((i / 60) * TAU) * 1.9, 0]} rotation={[0, 0, (i / 60) * TAU]}>
          <boxGeometry args={[i % 5 === 0 ? 0.12 : 0.05, 0.008, 0.008]} />
          <meshBasicMaterial color={c["text-soft"]} transparent opacity={0.6} />
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

/** One captured line, split into four things that fly out of the phone to their places. */
export function Chips() {
  const cc = useCardColors();
  const tex = useMemo(() => CHIPS.map(([k, t]) => cardTexture(k, t, undefined, cc, 640, 230)), [cc]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    const k = live.fx.chips;
    const p = progress.get("capture") ?? 0;
    const sc = live.portrait ? 0.4 : 1;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const t = band(p, 0.28 + i * 0.05, 0.5 + i * 0.05) * ease(k);
      m.visible = t > 0.01;
      const [ox, oy, oz] = live.portrait ? CHIPS_PORTRAIT[i]! : CHIPS[i]![2];
      const k2 = live.portrait ? 1 : sc;
      m.position.set(live.phoneWorld.x + ox * t * k2, live.phoneWorld.y + oy * t * k2 + Math.sin(s.clock.elapsedTime * 1.2 + i) * 0.03, live.phoneWorld.z + oz * t);
      m.rotation.set(0, journey.pointer.x * 0.2 - ox * 0.12, (1 - t) * 0.6 * (i % 2 ? 1 : -1));
      m.scale.setScalar(sc * (0.2 + 0.8 * t));
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

/** Every module as a paper card in orbit around the phone. Hover lifts one; click opens its page. */
export function Orbit() {
  const cc = useCardColors();
  const router = useRouter();
  const list = modules.slice(0, 14);
  const tex = useMemo(() => list.map((m, i) => cardTexture(String(i + 1).padStart(2, "0"), m.name, m.line, cc)), [cc, list]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const hover = useRef(-1);
  const lift = useRef(list.map(() => 0));
  useFrame((s, dt) => {
    const k = ease(live.fx.orbit);
    const p = progress.get("modules") ?? 0;
    const R = live.portrait ? 1.35 : 2.85;
    const rot = p * TAU * 0.75 + s.clock.elapsedTime * 0.05;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.visible = k > 0.01;
      const a = (i / list.length) * TAU + rot;
      lift.current[i] = THREE.MathUtils.damp(lift.current[i]!, hover.current === i ? 1 : 0, 10, dt);
      const r = R * (0.4 + 0.6 * k);
      m.position.set(live.phoneWorld.x + Math.sin(a) * r, live.phoneWorld.y + 0.12 - Math.cos(a) * 0.42 + lift.current[i]! * 0.18, live.phoneWorld.z + Math.cos(a) * r * 0.5);
      m.quaternion.copy(s.camera.quaternion);
      const depth = (Math.cos(a) + 1) / 2;
      m.scale.setScalar((live.portrait ? 0.5 : 0.7) * k * (0.75 + 0.25 * depth + lift.current[i]! * 0.15));
      (m.material as THREE.MeshBasicMaterial).opacity = k * (0.35 + 0.65 * depth);
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

/* ================================================================ gears */

function gearShape(teeth: number, r: number, depth: number, hole: number, spokes: number) {
  const s = new THREE.Shape();
  const step = TAU / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [
      [a, r - depth],
      [a + step * 0.12, r],
      [a + step * 0.45, r],
      [a + step * 0.57, r - depth],
    ] as const;
    pts.forEach(([ang, rad], j) => {
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;
      if (i === 0 && j === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    });
  }
  s.closePath();
  const axle = new THREE.Path();
  axle.absarc(0, 0, hole, 0, TAU, true);
  s.holes.push(axle);
  for (let k = 0; k < spokes; k++) {
    const a0 = (k / spokes) * TAU + 0.16;
    const a1 = ((k + 1) / spokes) * TAU - 0.16;
    const w = new THREE.Path();
    w.absarc(0, 0, r * 0.72, a0, a1, false);
    w.absarc(0, 0, hole * 1.9, a1, a0, true);
    s.holes.push(w);
  }
  return s;
}

const GEARS: [number, number, [number, number], number, number][] = [
  [64, 0.9, [0, 0], 0.25, 0],
  [24, 0.36, [1.18, 0.35], -0.66, 0.07],
  [40, 0.55, [-1.1, 0.6], -0.4, -0.05],
  [18, 0.26, [-0.55, -1.0], 0.9, 0.08],
  [30, 0.42, [0.8, -0.95], -0.55, -0.03],
];

/** An openworked watch movement that assembles as the Focus act scrolls, and runs faster when you scroll faster. */
export function Movement() {
  const { dark, c } = usePalette();
  const root = useRef<THREE.Group>(null);
  const parts = useRef<(THREE.Group | null)[]>([]);
  const wheels = useRef<(THREE.Mesh | null)[]>([]);
  const balance = useRef<THREE.Group>(null);
  const geos = useMemo(
    () =>
      GEARS.map(([teeth, r]) =>
        new THREE.ExtrudeGeometry(gearShape(teeth, r, r * 0.12, r * 0.12, r > 0.5 ? 5 : 0), { depth: 0.06, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 24 }),
      ),
    [],
  );
  useFrame((s, dt) => {
    const el = root.current;
    if (!el) return;
    const k = ease(live.fx.gears);
    el.visible = k > 0.01;
    const p = progress.get("focus") ?? 0;
    const spread = 1 - band(p, 0.2, 0.5);
    el.position.set(live.portrait ? 0 : 0.42 * live.half, live.portrait ? 0.62 : 0.05, -0.4);
    el.rotation.set(-0.45 + band(p, 0.1, 0.55) * 0.45 + journey.pointer.y * 0.1, journey.pointer.x * 0.2, p * 0.5);
    el.scale.setScalar((live.portrait ? 0.44 : 0.74) * (0.6 + 0.4 * k));
    parts.current.forEach((g, i) => {
      if (!g) return;
      const [hx, hy] = (i < GEARS.length ? GEARS[i]![2] : i === GEARS.length ? [-1.35, -0.55] : [1.45, -0.2]) as [number, number];
      g.position.set(hx * (1 + spread * 1.1), hy * (1 + spread * 1.1), (i % 3) * spread * 0.8);
    });
    const speed = 0.35 + Math.min(4, Math.abs(scrollState.velocity) * 0.08);
    wheels.current.forEach((m, i) => m && (m.rotation.z += dt * GEARS[i]![3] * speed));
    if (balance.current) balance.current.rotation.z = Math.sin(s.clock.elapsedTime * TAU * 2) * 1.1;
  });
  const metal = dark ? c.text : c.bronze;
  const warm = dark ? c["text-muted"] : c.clay;
  return (
    <group ref={root} visible={false}>
      {GEARS.map(([, , , , z], i) => (
        <group key={i} ref={(g) => void (parts.current[i] = g)}>
          <mesh ref={(m) => void (wheels.current[i] = m)} geometry={geos[i]} position={[0, 0, z]}>
            <meshStandardMaterial color={i % 2 ? warm : metal} metalness={0.75} roughness={0.26} />
          </mesh>
        </group>
      ))}
      <group ref={(g) => void (parts.current[GEARS.length] = g)}>
        <group ref={balance}>
          <mesh>
            <torusGeometry args={[0.38, 0.025, 12, 64]} />
            <meshStandardMaterial color={c.accent} metalness={0.8} roughness={0.3} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} rotation={[0, 0, (k * Math.PI) / 3]}>
              <boxGeometry args={[0.76, 0.02, 0.02]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
      <group ref={(g) => void (parts.current[GEARS.length + 1] = g)}>
        <Tourbillon color={c.accent} />
      </group>
    </group>
  );
}

function Tourbillon({ color }: { color: string }) {
  const cage = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!cage.current) return;
    cage.current.rotation.z = s.clock.elapsedTime * 0.5;
    cage.current.rotation.y = s.clock.elapsedTime * 0.25;
  });
  return (
    <group ref={cage}>
      {[0, 1, 2].map((k) => (
        <mesh key={k} rotation={[0, (k * Math.PI) / 3, 0]}>
          <torusGeometry args={[0.3, 0.012, 8, 48]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================= bars */

const WEEK = [0.42, 0.7, 0.3, 1.0, 0.55, 0.82, 0.38];

/** The week's spending as a ledger skyline that rises behind the phone; today is in oxblood. */
export function Bars() {
  const { dark, c } = usePalette();
  const g = useRef<THREE.Group>(null);
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const el = g.current;
    if (!el) return;
    const k = ease(live.fx.bars);
    el.visible = k > 0.01;
    const p = progress.get("money") ?? 0;
    const sc = live.portrait ? 0.55 : 1;
    el.position.set(live.phoneWorld.x + 1.25 * sc, live.phoneWorld.y - 1.05 * sc, live.phoneWorld.z - 0.7);
    el.rotation.set(0.08, -0.5 + journey.pointer.x * 0.15, 0);
    el.scale.setScalar(sc * Math.max(0.001, k));
    bars.current.forEach((m, i) => {
      if (!m) return;
      const h = Math.max(0.001, WEEK[i]! * 1.9 * band(p, 0.22 + i * 0.035, 0.45 + i * 0.035) * k);
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

/** Wax pools, the stamp presses as you scroll, lifts, and the ribbon N is left in the wax. */
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
    const el = g.current;
    if (!el) return;
    const k = ease(live.fx.seal);
    el.visible = k > 0.01;
    const p = progress.get("evening") ?? 0;
    const press = band(p, 0.27, 0.37);
    const up = band(p, 0.41, 0.48);
    el.position.set(live.portrait ? 0 : 0.42 * live.half, live.portrait ? 0.55 : -0.25, 0);
    el.rotation.set(0.5 + journey.pointer.y * 0.08, -0.35 + journey.pointer.x * 0.15, 0);
    el.scale.setScalar((live.portrait ? 0.55 : 0.82) * (0.5 + 0.5 * k));
    if (stamp.current) stamp.current.position.y = 2.6 - press * 2.42 + up * 2.6;
    if (wax.current) {
      const s = 0.45 + band(p, 0.12, 0.32) * 0.55 + press * 0.12;
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

/** Memories in orbit around Nodo. Past the middle of the act, every third one is forgotten. */
export function Motes() {
  const { c } = usePalette();
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => Array.from({ length: MOTES }, (_, i) => ({ r: 1.05 + ((i * 37) % 11) / 11, a: (i / MOTES) * TAU, y: (((i * 53) % 17) / 17 - 0.5) * 2.4, s: 0.6 + ((i * 7) % 5) / 6 })), []);
  const m = useMemo(() => new THREE.Object3D(), []);
  useFrame((s) => {
    const el = ref.current;
    if (!el) return;
    const k = ease(live.fx.motes);
    el.visible = k > 0.01;
    const p = progress.get("nodo") ?? 0;
    const forget = band(p, 0.5, 0.64);
    const sc = live.portrait ? 0.6 : 1;
    const t = s.clock.elapsedTime;
    seeds.forEach((sd, i) => {
      const a = sd.a + t * 0.18 * (i % 2 ? 1 : -0.7);
      const gone = i % 3 === 0 ? forget : 0;
      m.position.set(live.phoneWorld.x + Math.cos(a) * sd.r * sc * (1 + gone * 0.6), live.phoneWorld.y + sd.y * sc + gone * 0.8, live.phoneWorld.z + Math.sin(a) * sd.r * sc * 0.7);
      m.scale.setScalar(0.02 * sd.s * k * (1 - gone) * sc + 0.00001);
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

/* ================================================================ vault */

const EDGES: [number, number, number, "x" | "y" | "z"][] = [
  [0, 1, 1, "x"], [0, -1, 1, "x"], [0, 1, -1, "x"], [0, -1, -1, "x"],
  [1, 0, 1, "y"], [-1, 0, 1, "y"], [1, 0, -1, "y"], [-1, 0, -1, "y"],
  [1, 1, 0, "z"], [-1, 1, 0, "z"], [1, -1, 0, "z"], [-1, -1, 0, "z"],
];

/** A glass vault whose edges fly in and close around the phone; a wax band locks it. */
export function Vault() {
  const { dark, c } = usePalette();
  const g = useRef<THREE.Group>(null);
  const edges = useRef<(THREE.Mesh | null)[]>([]);
  const glass = useRef<THREE.MeshPhysicalMaterial>(null);
  const lock = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => cipherTexture(c.blush), [c]);
  const size: [number, number, number] = [1.0, 1.6, 0.6];
  useFrame((s) => {
    const el = g.current;
    if (!el) return;
    const k = ease(live.fx.vault);
    el.visible = k > 0.01;
    const p = progress.get("privacy") ?? 0;
    const close = band(p, 0.22, 0.48);
    el.position.copy(live.phoneWorld);
    el.rotation.set(0.1 + journey.pointer.y * 0.06, s.clock.elapsedTime * 0.12 + live.phone.r[1] * 0.2, 0);
    el.scale.setScalar(live.phoneScale);
    edges.current.forEach((m, i) => {
      if (!m) return;
      const [x, y, z] = EDGES[i]!;
      const fly = (1 - close) * 3;
      m.position.set(x * size[0] * (1 + fly * 0.5), y * size[1] * (1 + fly * 0.3), z * size[2] * (1 + fly));
      m.scale.setScalar(k);
    });
    if (glass.current) glass.current.opacity = 0.16 * close * k;
    if (glass.current?.map) glass.current.map.offset.y = -s.clock.elapsedTime * 0.03;
    if (lock.current) lock.current.scale.setScalar(Math.max(0.0001, band(p, 0.5, 0.62) * k));
  });
  return (
    <group ref={g} visible={false}>
      {EDGES.map(([, , , axis], i) => (
        <mesh key={i} ref={(m) => void (edges.current[i] = m)}>
          <boxGeometry args={axis === "x" ? [size[0] * 2, 0.025, 0.025] : axis === "y" ? [0.025, size[1] * 2, 0.025] : [0.025, 0.025, size[2] * 2]} />
          <meshStandardMaterial color={c.bronze} metalness={0.85} roughness={0.25} />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[size[0] * 2, size[1] * 2, size[2] * 2]} />
        <meshPhysicalMaterial ref={glass} map={tex} transparent opacity={0} roughness={0.1} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} color={dark ? c.canvas : c["surface-lowest"]} />
      </mesh>
      <mesh ref={lock} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.22, 0.06, 16, 96]} />
        <meshPhysicalMaterial color={c.oxblood} roughness={0.35} clearcoat={0.6} />
      </mesh>
    </group>
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

