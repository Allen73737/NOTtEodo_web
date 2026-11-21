import * as THREE from "three";
import { FX, type Fx, type Pose } from "./timeline";

const pose = (): Pose => ({ p: [0, 0, 0], r: [0, 0, 0], s: 1, v: 0 });

/**
 * The stage's current, damped state, written once per frame by the Director and read by every
 * object. World positions are already resolved for the viewport (portrait screens stack the
 * object above the copy instead of beside it).
 */
export const live = {
  phone: pose(),
  mono: pose(),
  fx: Object.fromEntries(FX.map((k) => [k, 0])) as Record<Fx, number>,
  screen: "home",
  act: "hero",
  portrait: false,
  /** Half the viewport width in world units at z = 0. */
  half: 3,
  phoneWorld: new THREE.Vector3(),
  phoneScale: 1,
  started: false,
};

/** Resolves a timeline x/y/z into world space for the current viewport. */
export function place(p: readonly [number, number, number], out: THREE.Vector3, vh: number) {
  if (live.portrait) return out.set(p[0] * live.half * 0.18, p[1] * 0.6 + vh * 0.2, p[2]);
  return out.set(p[0] * live.half, p[1], p[2]);
}

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const band = (p: number, a: number, b: number) => ease((p - a) / (b - a));
