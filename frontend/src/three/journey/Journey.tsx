"use client";

import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
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
  // Pixel density follows the frame rate: sharp while it holds 60 fps, softer the moment it drops,
  // so a busy phone or laptop keeps scrolling smoothly instead of stuttering at full resolution.
  // Client only (loaded with ssr: false), so the window is there to read.
  const [ceil] = useState(() => Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 1.75));
  const [dpr, setDpr] = useState(() => Math.min(ceil, 1.5));
  useEffect(() => setSource(document.body), []);
  if (!source) return null;
  return (
    <Canvas
      className="journey"
      eventSource={source}
      eventPrefix="client"
      dpr={dpr}
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
      <PerformanceMonitor
        flipflops={3}
        onIncline={() => setDpr(ceil)}
        onDecline={() => setDpr(1)}
        onFallback={() => setDpr(1)}
      />
      <Director />
      <Rig />
      <Dust />
      <Suspense fallback={null}>
        <Monogram3D />
        <Halo />
        <Phone />
        <Chips />
        <Orbit />
        <Movement />
        <Bars />
        <Seal />
        <Motes />
      </Suspense>
    </Canvas>
  );
}

function dampPose(cur: Pose, to: Pose, lambda: number, dt: number) {
  for (let i = 0; i < 3; i++) {
    cur.p[i] = THREE.MathUtils.damp(cur.p[i]!, to.p[i]!, lambda, dt);
    cur.r[i] = THREE.MathUtils.damp(cur.r[i]!, to.r[i]!, lambda * 0.8, dt);
  }
  cur.s = THREE.MathUtils.damp(cur.s, to.s, lambda, dt);
  cur.v = THREE.MathUtils.damp(cur.v, to.v, lambda, dt);
}

/**
 * Runs first each frame (then the Phone, then everything that comes out of it): samples the
 * timeline at the reader's position and eases toward it.
 */
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
    live.merge = THREE.MathUtils.damp(live.merge, target.merge, 6, dt);
    // What passed through the screen last frame lights it this frame.
    live.portal = live.portalNext;
    live.portalNext = 0;
    live.screen = target.screen;
    live.act = target.act;
    live.screenIndex = target.screenIndex;
    place(live.phone.p, live.phoneWorld, vp.height);
    // Portrait: the phone has the screen above the copy band to itself. In the finale it makes
    // room above it for the N that comes out of it.
    const out = live.portrait && live.act === "finale" ? 1 - live.merge : 0;
    live.phoneScale = live.phone.s * (live.portrait ? 0.72 * (1 - 0.24 * out) : 1);
    live.phoneWorld.y -= out * 0.3;

    // Drag spin settles to the nearest whole turn when released.
    if (!journey.dragging) journey.spin = THREE.MathUtils.damp(journey.spin, Math.round(journey.spin / TAU) * TAU, 2.4, dt);

    // A breath of camera parallax.
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, journey.pointer.x * 0.18, 2, dt);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, -journey.pointer.y * 0.12, 2, dt);
    state.camera.lookAt(0, 0, 0);
  }, -2);
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
