import * as THREE from "three";
import { journey } from "@/components/film/FilmProvider";
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
  screenIndex: 0,
  portrait: false,
  /** Half the viewport width in world units at z = 0. */
  half: 3,
  phoneWorld: new THREE.Vector3(),
  phoneScale: 1,
  started: false,
  /**
   * The phone as drawn this frame (after its float, tilt and spin), written by the Phone before
   * any act object reads it, so whatever comes out of it or goes back in tracks it exactly.
   */
  body: { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), size: 1 },
  /** Just in front of the middle of the screen: where act objects come out and go back in. */
  mouth: new THREE.Vector3(),
  /**
   * How far the ribbon N is merged into the logo on the phone's back (1: it is that logo). The
   * hero's N sinks into it; the finale's N lifts back out of it.
   */
  merge: 0,
  /** How much is passing through the screen this frame (0..1); the screen glows with it. */
  portal: 0,
  portalNext: 0,
  /** Whether the stage is sleeping (hidden tab or scrolled past the stage). */
  sleeping: false,
};

/** Resolves a timeline x/y/z into world space for the current viewport. */
export function place(p: readonly [number, number, number], out: THREE.Vector3, vh: number) {
  if (live.portrait) return out.set(p[0] * live.half * 0.12, p[1] * 0.5 + vh * 0.175, p[2]);
  return out.set(p[0] * live.half, p[1], p[2]);
}

/** An act's progress through its pinned part, 0..1. */
export const lpOf = (act: string) => journey.lp.get(act) ?? 0;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const band = (p: number, a: number, b: number) => ease((p - a) / (b - a));

const unfold = new THREE.Quaternion();
/**
 * An act object `e` of the way out of the phone (0: inside the screen, 1: at `home`). It leaves
 * through the glass on a soft arc toward the viewer, turned as the phone is turned and unfolding
 * into its own orientation, and goes back in the same way. Writes the position into `out` and,
 * when given, the orientation into `quat` (which holds the object's own orientation on entry).
 * Returns the scale factor to apply. The passage lights the screen.
 */
export function emerge(home: THREE.Vector3, e: number, out: THREE.Vector3, quat?: THREE.Quaternion) {
  const k = clamp01(e);
  // Out fast, then a long settle; in, the mirror of it.
  const d = 1 - Math.pow(1 - k, 2.4);
  out.lerpVectors(live.mouth, home, d);
  out.z += Math.sin(Math.PI * d) * 0.45 * live.body.size;
  if (quat) quat.copy(unfold.copy(live.body.quat).slerp(quat, d));
  if (k > 0.001 && k < 0.999) live.portalNext = Math.max(live.portalNext, Math.sin(Math.PI * Math.min(1, k * 1.6)));
  return 0.06 + 0.94 * d;
}
