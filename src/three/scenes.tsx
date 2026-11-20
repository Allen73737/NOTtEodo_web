"use client";

import { Environment, Lightformer, PerspectiveCamera, RoundedBox, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three-stdlib";
import { MONOGRAM } from "@/components/brand/monogram-paths";
import { progress, scrollState } from "@/components/film/FilmProvider";
import { colors } from "@/content/generated/tokens";
import shots from "@/content/generated/screenshots.json";
import { useTheme, useView } from "@/lib/prefs";

const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const band = (p: number, a: number, b: number) => ease((p - a) / (b - a));

/** Lighting per theme: Ivory = daylight atelier, OLED = void with an oxblood rim. */
export function Rig() {
  const dark = useTheme() === "dark";
  const c = dark ? colors.dark : colors.light;
  return (
    <>
      <ambientLight intensity={dark ? 0.04 : 0.55} color={c.linen} />
      <directionalLight position={[-3, 4, 5]} intensity={dark ? 0.6 : 2.4} color={dark ? c.text : c.canvas} />
      <pointLight position={[3.5, 1.5, -2.5]} intensity={dark ? 40 : 6} color={dark ? c.blush : c.rosewood} distance={14} />
      <pointLight position={[-3, -2, 3]} intensity={dark ? 3 : 2} color={c.linen} distance={10} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={dark ? 0.6 : 2.5} color={dark ? c.text : c.canvas} position={[-4, 4, 3]} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={dark ? 3 : 0.8} color={dark ? c.blush : c.rosewood} position={[4, 0, -3]} scale={2} />
      </Environment>
    </>
  );
}

function screenUrl(screen: string, view: string, theme: string) {
  const e =
    shots.entries.find((s) => s.screen === screen && s.view === view && s.theme === theme) ??
    shots.entries.find((s) => s.screen === screen && s.theme === theme);
  return e ? e.sources.webp[1]!.split(" ")[0]! : "";
}

/* ------------------------------------------------------------------ phone */

function Screen({ screen }: { screen: string }) {
  const theme = useTheme();
  const view = useView();
  const tex = useTexture(screenUrl(screen, view, theme), (t) => {
    const one = Array.isArray(t) ? t[0]! : t;
    one.colorSpace = THREE.SRGBColorSpace;
    one.anisotropy = 8;
  });
  return (
    <mesh position={[0, 0, 0.058]}>
      <planeGeometry args={[1.08, 2.4]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

/** A procedural phone (rounded body, glass, screen) that surfaces, turns and lands as its chapter scrolls. */
export function PhoneScene({ chapter, screen = "home", mode = "hero" }: { chapter: string; screen?: string; mode?: "hero" | "finale" | "aa" }) {
  const g = useRef<THREE.Group>(null);
  const dark = useTheme() === "dark";
  const body = dark ? colors.dark["surface-high"] : colors.light.ink;
  useFrame((state) => {
    const p = progress.get(chapter) ?? 0;
    const t = state.clock.elapsedTime;
    if (!g.current) return;
    if (mode === "hero") {
      g.current.position.y = THREE.MathUtils.lerp(-2.6, 0, band(p, 0.05, 0.42)) + Math.sin(t * 0.8) * 0.04;
      g.current.rotation.y = -0.35 + p * 0.9 + Math.sin(t * 0.5) * 0.05;
      g.current.rotation.x = 0.12 - p * 0.2;
    } else if (mode === "finale") {
      const k = band(p, 0.2, 0.6);
      g.current.rotation.y = (1 - k) * Math.PI * 2;
      g.current.rotation.x = THREE.MathUtils.lerp(0.4, -1.25, k);
      g.current.position.y = THREE.MathUtils.lerp(1.2, -0.1, k);
    } else {
      g.current.rotation.y = Math.sin(t * 0.4) * 0.12;
      g.current.position.y = Math.sin(t * 0.7) * 0.03;
    }
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5.2]} fov={35} />
      <Rig />
      <group ref={g}>
        <RoundedBox args={[1.2, 2.52, 0.11]} radius={0.15} smoothness={6}>
          <meshPhysicalMaterial color={body} metalness={0.65} roughness={0.28} clearcoat={1} clearcoatRoughness={0.2} />
        </RoundedBox>
        <Suspense fallback={null}>
          <Screen screen={screen} />
        </Suspense>
        <mesh position={[0, 0, 0.0595]}>
          <planeGeometry args={[1.12, 2.44]} />
          <meshPhysicalMaterial transparent opacity={0.08} roughness={0.05} metalness={0} clearcoat={1} color={colors.light.surface} />
        </mesh>
      </group>
    </>
  );
}

/* --------------------------------------------------------------- movement */

function gearShape(teeth: number, r: number, depth: number, hole: number, spokes: number) {
  const s = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
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
  axle.absarc(0, 0, hole, 0, Math.PI * 2, true);
  s.holes.push(axle);
  // Skeletonised: open windows between spokes, as in an openworked movement.
  if (spokes > 0) {
    for (let k = 0; k < spokes; k++) {
      const a0 = (k / spokes) * Math.PI * 2 + 0.16;
      const a1 = ((k + 1) / spokes) * Math.PI * 2 - 0.16;
      const w = new THREE.Path();
      w.absarc(0, 0, r * 0.72, a0, a1, false);
      w.absarc(0, 0, hole * 1.9, a1, a0, true);
      s.holes.push(w);
    }
  }
  return s;
}

function Gear({ teeth, r, pos, speed, color, z = 0 }: { teeth: number; r: number; pos: [number, number]; speed: number; color: string; z?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(
    () => new THREE.ExtrudeGeometry(gearShape(teeth, r, r * 0.12, r * 0.12, r > 0.5 ? 5 : 0), { depth: 0.06, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 24 }),
    [teeth, r],
  );
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed * (0.35 + Math.min(4, Math.abs(scrollState.velocity) * 0.08));
  });
  return (
    <mesh ref={ref} geometry={geo} position={[pos[0], pos[1], z]}>
      <meshStandardMaterial color={color} metalness={0.92} roughness={0.32} />
    </mesh>
  );
}

/** A procedural watch movement: gear train, balance wheel and a tourbillon cage, wound by scrolling. */
export function MovementScene({ chapter }: { chapter: string }) {
  const dark = useTheme() === "dark";
  const c = dark ? colors.dark : colors.light;
  const g = useRef<THREE.Group>(null);
  const balance = useRef<THREE.Group>(null);
  const cage = useRef<THREE.Group>(null);
  useFrame((state) => {
    const p = progress.get(chapter) ?? 0;
    const t = state.clock.elapsedTime;
    if (g.current) {
      const spread = 1 - band(p, 0.2, 0.55); // exploded → assembled
      g.current.children.forEach((child, i) => {
        if (child.userData.home) {
          const [hx, hy] = child.userData.home as [number, number];
          child.position.x = hx * (1 + spread * 0.9);
          child.position.y = hy * (1 + spread * 0.9);
          child.position.z = (child.userData.z ?? 0) + spread * (i % 3) * 0.6;
        }
      });
      g.current.rotation.x = -0.5 + band(p, 0.1, 0.6) * 0.5;
      g.current.rotation.z = p * 0.4;
    }
    if (balance.current) balance.current.rotation.z = Math.sin(t * 8 * Math.PI * 0.5) * 1.1; // 4 Hz feel
    if (cage.current) {
      cage.current.rotation.z = t * 0.5;
      cage.current.rotation.y = t * 0.25;
    }
  });
  const metal = dark ? c.text : c.bronze;
  const warm = dark ? c["text-muted"] : c.clay;
  const gears: [number, number, [number, number], number, string, number][] = [
    [64, 0.9, [0, 0], 0.25, metal, 0],
    [24, 0.36, [1.18, 0.35], -0.66, warm, 0.07],
    [40, 0.55, [-1.1, 0.6], -0.4, metal, -0.05],
    [18, 0.26, [-0.55, -1.0], 0.9, warm, 0.08],
    [30, 0.42, [0.8, -0.95], -0.55, metal, -0.03],
  ];
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={38} />
      <Rig />
      <group ref={g}>
        {gears.map(([teeth, r, pos, speed, color, z], i) => (
          <group key={i} userData={{ home: pos, z }}>
            <Gear teeth={teeth} r={r} pos={[0, 0]} speed={speed} color={color} />
          </group>
        ))}
        <group userData={{ home: [-1.35, -0.55], z: 0.15 }}>
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
        <group userData={{ home: [1.45, -0.2], z: 0.25 }}>
          <group ref={cage}>
            {[0, 1, 2].map((k) => (
              <mesh key={k} rotation={[0, (k * Math.PI) / 3, 0]}>
                <torusGeometry args={[0.3, 0.012, 8, 48]} />
                <meshStandardMaterial color={c.accent} metalness={0.9} roughness={0.25} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </>
  );
}

/* -------------------------------------------------------------------- seal */

function useMonogramGeometry() {
  return useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${Object.values(MONOGRAM)
      .map((d) => `<path d="${d}" fill="none" stroke="#000" stroke-width="5"/>`)
      .join("")}</svg>`; // lint-colors-ignore (parser input only, never rendered)
    const data = new SVGLoader().parse(svg);
    const geos: THREE.BufferGeometry[] = [];
    data.paths.forEach((path) => {
      const style = SVGLoader.getStrokeStyle(5.5, "#000", "round", "round"); // lint-colors-ignore
      path.subPaths.forEach((sp) => {
        const g = SVGLoader.pointsToStroke(sp.getPoints(), style);
        if (g) geos.push(g);
      });
    });
    return geos;
  }, []);
}

/** Wax pools, the seal presses as you scroll, lifts, and the ribbon N is left in relief. */
export function SealScene({ chapter }: { chapter: string }) {
  const dark = useTheme() === "dark";
  const c = dark ? colors.dark : colors.light;
  const stamp = useRef<THREE.Group>(null);
  const wax = useRef<THREE.Mesh>(null);
  const mark = useRef<THREE.Group>(null);
  const mono = useMonogramGeometry();
  const waxGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1.05, 0.12, 96, 1);
    const pos = g.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const wobble = 1 + 0.06 * Math.sin(a * 7) + 0.035 * Math.sin(a * 13 + 1.3);
      if (Math.hypot(x, z) > 0.5) {
        pos.setX(i, x * wobble);
        pos.setZ(i, z * wobble);
      }
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame(() => {
    const p = progress.get(chapter) ?? 0;
    const press = band(p, 0.25, 0.48);
    const lift = band(p, 0.55, 0.72);
    if (stamp.current) stamp.current.position.y = 1.6 - press * 1.42 + lift * 1.8;
    if (wax.current) {
      const s = 0.4 + band(p, 0.08, 0.3) * 0.6 + press * 0.12;
      wax.current.scale.set(s, 1 - press * 0.4, s);
    }
    if (mark.current) mark.current.visible = lift > 0.02;
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3.2, 3.6]} fov={38} onUpdate={(cam) => cam.lookAt(0, 0, 0)} />
      <Rig />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={dark ? c.canvas : c.surface} roughness={1} />
      </mesh>
      <mesh ref={wax} geometry={waxGeo}>
        <meshPhysicalMaterial color={c.oxblood} roughness={0.35} clearcoat={0.6} sheen={0.4} sheenColor={c.blush} />
      </mesh>
      <group ref={mark} position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.012}>
        <group position={[-50, -50, 0]}>
          {mono.map((g, i) => (
            <mesh key={i} geometry={g}>
              <meshStandardMaterial color={c.noir} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      </group>
      <group ref={stamp} position={[0, 1.6, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.28, 0.42, 1, 48]} />
          <meshStandardMaterial color={dark ? c["surface-high"] : c.ink} metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.7, 0.7, 0.12, 64]} />
          <meshStandardMaterial color={c.bronze} metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
    </>
  );
}

/* ------------------------------------------------------------------- vault */

/** A data cube wrapped in ciphertext glyphs, banded with wax and locked. */
export function VaultScene({ chapter }: { chapter: string }) {
  const dark = useTheme() === "dark";
  const c = dark ? colors.dark : colors.light;
  const g = useRef<THREE.Group>(null);
  const band1 = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 512;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = dark ? c.canvas : c.ink;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = dark ? c.blush : c.linen;
    ctx.font = "600 22px monospace";
    const glyphs = "0123456789ABCDEF";
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 24; y < 512; y += 28) {
      let line = "";
      for (let i = 0; i < 28; i++) line += glyphs[Math.floor(rnd() * 16)];
      ctx.globalAlpha = 0.35 + rnd() * 0.6;
      ctx.fillText(line, 8, y);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [dark, c]);
  useFrame((state) => {
    const p = progress.get(chapter) ?? 0;
    const t = state.clock.elapsedTime;
    if (g.current) {
      g.current.rotation.y = t * 0.3 + p * 2;
      g.current.rotation.x = 0.4 + Math.sin(t * 0.3) * 0.1;
      const s = 1 - band(p, 0.55, 0.8) * 0.35;
      g.current.scale.setScalar(s);
    }
    if (band1.current) band1.current.scale.setScalar(band(p, 0.35, 0.55) || 0.0001);
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={36} />
      <Rig />
      <group ref={g}>
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial map={tex} metalness={0.3} roughness={0.45} />
        </mesh>
        <mesh ref={band1}>
          <torusGeometry args={[1.12, 0.07, 16, 96]} />
          <meshPhysicalMaterial color={c.oxblood} roughness={0.35} clearcoat={0.6} />
        </mesh>
      </group>
    </>
  );
}
