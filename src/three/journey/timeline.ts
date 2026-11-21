/**
 * The story's keyframes. One key per act, held while the act is centred and blended across
 * act boundaries. Positions: x is a share of half the viewport width (so 0.5 sits halfway between
 * the centre and the right edge at any aspect ratio); y and z are world units; rotations in radians.
 * Rotations are not wrapped, so a key that adds 2π makes the phone turn a full circle between acts,
 * which also hides its screen changing.
 */
export type V3 = [number, number, number];
export type Pose = { p: V3; r: V3; s: number; v: number };
export type Fx = "chips" | "orbit" | "gears" | "bars" | "seal" | "motes" | "vault" | "halo";
export type Key = { phone: Pose; mono: Pose; screen: string; fx: Partial<Record<Fx, number>> };

const TAU = Math.PI * 2;
const pose = (p: V3, r: V3, s = 1, v = 1): Pose => ({ p, r, s, v });
const hidden = (p: V3, r: V3 = [0, 0, 0], s = 0.3): Pose => ({ p, r, s, v: 0 });

export const KEYS: Record<string, Key> = {
  // I. The ribbon N floats in ink. The phone waits below, face down.
  hero: {
    mono: pose([0.5, 0.02, 0], [0.1, -0.4, 0], 1.0),
    phone: hidden([0.48, -3.6, -1], [0.3, Math.PI, 0], 0.9),
    screen: "home",
    fx: { halo: 1 },
  },
  // II. The N sinks into the back of the phone, which turns to face you.
  open: {
    mono: hidden([0.48, 0, -0.2], [0, Math.PI - 0.3, 0], 0.22),
    phone: pose([0.46, -0.05, 0], [0.08, -0.32, 0.03], 1.02),
    screen: "home",
    fx: {},
  },
  // III. Capture: one line flies out and finds its place.
  capture: {
    mono: hidden([-0.5, 0, -0.2]),
    phone: pose([-0.5, -0.05, 0], [0.06, 0.4, -0.03], 0.95),
    screen: "quick-add",
    fx: { chips: 1 },
  },
  // IV. Two views: a full turn, and the screen changes behind it.
  views: {
    mono: hidden([0.46, 0, -0.2]),
    phone: pose([0.46, -0.05, 0], [0.04, TAU - 0.3, 0.02], 1.02),
    screen: "home",
    fx: {},
  },
  // V. Every part of life: the modules orbit a smaller phone.
  modules: {
    mono: hidden([0, 0, -0.2]),
    phone: pose([0, 0.02, -0.4], [0.12, TAU, 0], 0.6),
    screen: "home",
    fx: { orbit: 1 },
  },
  // VI. Plan: the phone lies back like a page on a desk.
  plan: {
    mono: hidden([0.46, 0, -0.2]),
    phone: pose([0.46, -0.1, 0], [-0.62, TAU - 0.38, 0.16], 1),
    screen: "tasks",
    fx: {},
  },
  // VII. Focus: the movement assembles beside the dial.
  focus: {
    mono: hidden([0.4, 0, -0.2]),
    phone: pose([0.86, -0.75, -1.4], [0.1, TAU - 0.7, 0.05], 0.6),
    screen: "focus",
    fx: { gears: 1 },
  },
  // VIII. Money: a ledger of the week rises behind the phone.
  money: {
    mono: hidden([-0.5, 0, -0.2]),
    phone: pose([-0.5, -0.05, 0], [0.05, TAU + 0.38, -0.02], 0.95),
    screen: "expenses",
    fx: { bars: 1 },
  },
  // IX. Evening: the phone steps aside; the wax seal presses the N.
  evening: {
    mono: hidden([0.45, 0, -0.2]),
    phone: hidden([0.95, -0.4, -1.4], [0.05, TAU + 0.6, 0], 0.6),
    screen: "habits",
    fx: { seal: 1 },
  },
  // X. Nodo: memories orbit; some are forgotten on request.
  nodo: {
    mono: hidden([0.46, 0, -0.2]),
    phone: pose([0.46, -0.05, 0], [0.05, 2 * TAU - 0.3, 0.02], 0.98),
    screen: "nodo",
    fx: { motes: 1 },
  },
  // XI. Privacy: a vault closes around the phone.
  privacy: {
    mono: hidden([-0.46, 0, -0.2]),
    phone: pose([-0.46, -0.05, 0], [0.1, 2 * TAU + 0.35, 0], 0.82),
    screen: "home",
    fx: { vault: 1 },
  },
  // XII. Finale: the phone faces you; the N returns to crown it.
  finale: {
    mono: pose([0.16, 0.95, 0.4], [0, 0.3, 0], 0.2),
    phone: pose([0.48, -0.12, 0], [-0.02, 3 * TAU - 0.22, 0], 0.92),
    screen: "home",
    fx: {},
  },
};

export const FX: Fx[] = ["chips", "orbit", "gears", "bars", "seal", "motes", "vault", "halo"];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({ p: mix3(a.p, b.p, t), r: mix3(a.r, b.r, t), s: lerp(a.s, b.s, t), v: lerp(a.v, b.v, t) });

export type Sample = { phone: Pose; mono: Pose; fx: Record<Fx, number>; screen: string; act: string };

/** The pose at story position f, for the given act order. */
export function sample(acts: string[], f: number): Sample {
  const list = acts.filter((a) => a in KEYS);
  if (list.length === 0) list.push("hero");
  const i0 = Math.max(0, Math.min(list.length - 1, Math.floor(f)));
  const i1 = Math.min(list.length - 1, i0 + 1);
  const t = smooth(Math.max(0, Math.min(1, f - i0)));
  const a = KEYS[list[i0]!]!;
  const b = KEYS[list[i1]!]!;
  const fx = {} as Record<Fx, number>;
  for (const k of FX) fx[k] = lerp(a.fx[k] ?? 0, b.fx[k] ?? 0, t);
  const near = t < 0.5 ? a : b;
  return { phone: mixPose(a.phone, b.phone, t), mono: mixPose(a.mono, b.mono, t), fx, screen: near.screen, act: list[t < 0.5 ? i0 : i1]! };
}
