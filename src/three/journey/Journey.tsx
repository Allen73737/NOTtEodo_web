"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { journey } from "@/components/film/FilmProvider";
import { colors } from "@/content/generated/tokens";
import { useTheme } from "@/lib/prefs";
import { live, place } from "./live";
import { Bars, Chips, Dust, Halo, Monogram3D, Motes, Movement, Orbit, Phone, Seal } from "./objects";
import { FX, sample, type Pose } from "./timeline";

const TAU = Math.PI * 2;

/**
 * The one 3D stage behind the whole homepage. It stays fixed while the story scrolls past, and
 * its objects travel with the reader: the ribbon N becomes the phone, the phone moves from side
 * to side opposite the copy, and each act brings its own object in and out.
 */
export default function Journey() {
  const [source, setSource] = useState<HTMLElement | null>(null);
  useEffect(() => setSource(document.body), []);
  if (!source) return null;
  return (
    <Canvas
      className="journey"
      eventSource={source}
      eventPrefix="client"
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          document.documentElement.dataset.film = "lite";
        });
        document.documentElement.classList.add("journey-ready");
      }}
      aria-hidden="true"
    >
      <Director />
      <Rig />
      <Dust />
      <Suspense fallback={null}>
        <Stage>
        <Monogram3D />
        <Halo />
        <Phone />
        <Chips />
        <Orbit />
        <Movement />
        <Bars />
        <Seal />
        <Motes />
        </Stage>
      </Suspense>
    </Canvas>
  );
}

/**
 * Everything on the stage, lifted together on portrait screens as the act copy rises: the copy
 * pushes the phone up and off the top rather than covering it. The lift follows the copy exactly
 * on the way up and eases back down when the next act opens its stage window, so the phone drops
 * back in instead of popping.
 */
function Stage({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const lift = useRef(0);
  useFrame((state, delta) => {
    const el = g.current;
    if (!el) return;
    const px = live.portrait ? journey.push : 0;
    const want = (px / state.size.height) * state.viewport.getCurrentViewport(state.camera, [0, 0, 0]).height;
    lift.current = want >= lift.current ? want : THREE.MathUtils.damp(lift.current, want, 5, Math.min(delta, 1 / 20));
    el.position.y = lift.current;
  });
  return <group ref={g}>{children}</group>;
}

function dampPose(cur: Pose, to: Pose, lambda: number, dt: number) {
  for (let i = 0; i < 3; i++) {
    cur.p[i] = THREE.MathUtils.damp(cur.p[i]!, to.p[i]!, lambda, dt);
    cur.r[i] = THREE.MathUtils.damp(cur.r[i]!, to.r[i]!, lambda * 0.8, dt);
  }
  cur.s = THREE.MathUtils.damp(cur.s, to.s, lambda, dt);
  cur.v = THREE.MathUtils.damp(cur.v, to.v, lambda, dt);
}

/** Runs first each frame: samples the timeline at the reader's position and eases toward it. */
function Director() {
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, 0]);
    live.portrait = vp.aspect < 0.9;
    live.half = vp.width / 2;
    const target = sample(journey.acts, journey.t, journey.hold);
    if (!live.started) {
      // First frame: jump to the pose instead of flying in from the origin.
      Object.assign(live.phone, structuredClone(target.phone));
      Object.assign(live.mono, structuredClone(target.mono));
      live.started = true;
    }
    dampPose(live.phone, target.phone, 3.6, dt);
    dampPose(live.mono, target.mono, 3.6, dt);
    for (const k of FX) live.fx[k] = THREE.MathUtils.damp(live.fx[k], target.fx[k], 4, dt);
    live.screen = target.screen;
    live.act = target.act;
    live.screenIndex = target.screenIndex;
    place(live.phone.p, live.phoneWorld, vp.height);
    live.phoneScale = live.phone.s * (live.portrait ? 0.7 : 1);

    // Drag spin settles to the nearest whole turn when released.
    if (!journey.dragging) journey.spin = THREE.MathUtils.damp(journey.spin, Math.round(journey.spin / TAU) * TAU, 2.4, dt);

    // A breath of camera parallax.
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, journey.pointer.x * 0.18, 2, dt);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, -journey.pointer.y * 0.12, 2, dt);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

/** Ivory: a daylight atelier. OLED: a void with an oxblood rim light. */
function Rig() {
  const dark = useTheme() === "dark";
  const c = dark ? colors.dark : colors.light;
  return (
    <>
      <ambientLight intensity={dark ? 0.08 : 0.6} color={c.linen} />
      <directionalLight position={[-3, 4, 5]} intensity={dark ? 0.9 : 2.2} color={dark ? c.text : c.canvas} />
      <pointLight position={[3.5, 1.5, -2.5]} intensity={dark ? 45 : 8} color={dark ? c.blush : c.rosewood} distance={14} />
      <pointLight position={[-3, -2, 3]} intensity={dark ? 4 : 2} color={c.linen} distance={10} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={dark ? 0.7 : 2.6} color={dark ? c.text : c.canvas} position={[-4, 4, 3]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={dark ? 0.4 : 1.2} color={c.linen} position={[4, -2, 4]} scale={[4, 2, 1]} />
        <Lightformer form="ring" intensity={dark ? 3 : 0.8} color={dark ? c.blush : c.rosewood} position={[4, 0, -3]} scale={2} />
      </Environment>
    </>
  );
}
