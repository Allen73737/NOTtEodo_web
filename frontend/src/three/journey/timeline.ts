/**
 * The story's keyframes. Every act is a pinned scene: while it is pinned the phone travels from
 * `from` to `to` and its screen steps through `screens`; while the act un-pins and the next one
 * arrives, the phone flies on to the next act's `from`.
 *
 * Positions: x is a share of half the viewport width (0.5 sits halfway between the centre and the
 * right edge at any aspect ratio); y and z are world units; rotations in radians, never wrapped,
 * so adding 2π makes the phone turn a full circle.
 *
 * A screen is a screenshot name, optionally forced to one view: "home@editorial".
 */
export type V3 = [number, number, number];
export type Pose = { p: V3; r: V3; s: number; v: number };
export type Fx = "chips" | "orbit" | "gears" | "bars" | "seal" | "motes" | "halo";
type Scene = { phone: Pose; mono: Pose; fx: Partial<Record<Fx, number>> };
export type Key = { from: Scene; to: Scene; screens: string[] };

const TAU = Math.PI * 2;
const pose = (p: V3, r: V3, s = 1, v = 1): Pose => ({ p, r, s, v });
const hidden = (p: V3, r: V3 = [0, 0, 0], s = 0.3): Pose => ({ p, r, s, v: 0 });
const still = (s: Scene): { from: Scene; to: Scene } => ({ from: s, to: s });
const away = hidden([0, 0, -0.3]);
/** The ribbon N at the end of the hero, as it heads for the phone. */
const heroN = pose([0.48, 0.0, 0.2], [0.05, 0.9, 0], 0.9);
/** The ribbon N out of the phone at the end, beside it and above, facing you. */
const finaleN = pose([0.78, 0.7, 0.3], [0.04, -0.3, 0], 0.3);

export const KEYS: Record<string, Key> = {
  // Dawn. The ribbon N turns in ink; scrolling turns it toward its back, where the phone waits.
  hero: {
    from: { mono: pose([0.5, 0.02, 0], [0.1, -0.45, 0], 1.0), phone: hidden([0.48, -3.6, -1], [0.3, Math.PI, 0], 0.9), fx: { halo: 1 } },
    to: { mono: heroN, phone: hidden([0.48, -2.6, -1], [0.3, Math.PI, 0], 0.9), fx: { halo: 0.6 } },
    screens: ["home"],
  },
  // The phone rises with its back to you and the N settles into the N on its back (see `merge`),
  // then the phone turns to face you.
  open: {
    from: { mono: heroN, phone: pose([0.46, -0.1, 0], [0.12, Math.PI - 0.4, 0.05], 0.98), fx: {} },
    to: { mono: heroN, phone: pose([0.44, 0.0, 0.3], [0.04, -0.28, 0.02], 1.06), fx: {} },
    screens: ["home"],
  },
  // Capture: one line flies out of the phone and becomes four things.
  capture: {
    from: { mono: away, phone: pose([-0.48, -0.05, 0], [0.06, 0.55, -0.04], 0.95), fx: { chips: 1 } },
    to: { mono: away, phone: pose([-0.5, 0.05, 0.2], [0.02, 0.25, -0.02], 0.98), fx: { chips: 1 } },
    screens: ["home", "quick-add"],
  },
  // Two views: the phone itself changes from Cards to Editorial as you scroll.
  views: {
    from: { mono: away, phone: pose([0.46, -0.05, 0], [0.04, TAU - 0.5, 0.02], 1.0), fx: {} },
    to: { mono: away, phone: pose([0.42, -0.02, 0.25], [0.02, TAU + 0.15, 0], 1.05), fx: {} },
    screens: ["home@cards", "home@editorial", "expenses@cards", "expenses@editorial"],
  },
  // The tour: centre stage, the screen steps through the app's worlds.
  tour: {
    from: { mono: away, phone: pose([0.02, -0.14, 0.2], [0.08, 2 * TAU - 0.35, 0], 1.0), fx: {} },
    to: { mono: away, phone: pose([0.02, -0.14, 0.2], [0.04, 2 * TAU + 0.35, 0], 1.0), fx: {} },
    screens: ["home", "notes", "tasks", "planner", "habits", "expenses", "journal", "travel", "moodboard", "focus", "nodo"],
  },
  // Every part of life: the modules orbit a smaller phone.
  modules: {
    ...still({ mono: away, phone: pose([0, 0.02, -0.4], [0.12, 2 * TAU, 0], 0.6), fx: { orbit: 1 } }),
    screens: ["home"],
  },
  // Plan: the phone lies back like a page on a desk.
  plan: {
    from: { mono: away, phone: pose([0.46, -0.1, 0], [-0.25, 2 * TAU - 0.3, 0.08], 1), fx: {} },
    to: { mono: away, phone: pose([0.46, -0.15, 0], [-0.7, 2 * TAU - 0.45, 0.18], 1), fx: {} },
    screens: ["tasks", "planner"],
  },
  // Focus: the movement assembles beside the dial.
  focus: {
    from: { mono: away, phone: pose([0.86, -0.75, -1.4], [0.1, 2 * TAU - 0.7, 0.05], 0.6), fx: { gears: 1 } },
    to: { mono: away, phone: pose([0.8, -0.6, -1.2], [0.05, 2 * TAU - 0.4, 0.02], 0.62), fx: { gears: 1 } },
    screens: ["focus"],
  },
  // Money: a ledger of the week rises behind the phone; the screen turns from Cards to Editorial.
  money: {
    from: { mono: away, phone: pose([-0.5, -0.05, 0], [0.05, 2 * TAU + 0.5, -0.02], 0.95), fx: { bars: 1 } },
    to: { mono: away, phone: pose([-0.48, 0.0, 0.2], [0.02, 2 * TAU + 0.2, 0], 0.98), fx: { bars: 1 } },
    screens: ["expenses@cards", "expenses@editorial"],
  },
  // Evening: the phone steps aside and back, the wax seal comes out of it and presses the N.
  evening: {
    ...still({ mono: away, phone: pose([0.95, -0.4, -1.4], [0.05, 2 * TAU + 0.6, 0], 0.6), fx: { seal: 1 } }),
    screens: ["habits"],
  },
  // Nodo: memories orbit; some are forgotten on request.
  nodo: {
    from: { mono: away, phone: pose([0.46, -0.05, 0], [0.05, 3 * TAU - 0.45, 0.02], 0.98), fx: { motes: 1 } },
    to: { mono: away, phone: pose([0.44, 0, 0.2], [0.02, 3 * TAU - 0.15, 0], 1.0), fx: { motes: 1 } },
    screens: ["nodo"],
  },
  // Privacy: the phone steps back into the dark and turns away a little: nothing leaves it.
  privacy: {
    from: { mono: away, phone: pose([-0.46, -0.05, 0], [0.1, 3 * TAU + 0.5, 0], 0.82), fx: {} },
    to: { mono: away, phone: pose([-0.46, -0.05, -0.1], [0.06, 3 * TAU + 0.2, 0], 0.8), fx: {} },
    screens: ["home"],
  },
  // Tomorrow: the phone makes one slow full turn; half-way, with its back to you, the ribbon N
  // lifts out of the N on its back (see `merge`) and takes its place beside it in its halo, and
  // the phone comes to rest facing you, beside the download.
  finale: {
    from: { mono: finaleN, phone: pose([0.46, -0.06, 0], [0.02, 4 * TAU - 0.45, 0], 0.94), fx: { halo: 1 } },
    to: { mono: finaleN, phone: pose([0.42, -0.04, 0.35], [-0.02, 5 * TAU - 0.22, 0], 1.0), fx: { halo: 1 } },
    screens: ["home"],
  },
};

export const FX: Fx[] = ["chips", "orbit", "gears", "bars", "seal", "motes", "halo"];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({ p: mix3(a.p, b.p, t), r: mix3(a.r, b.r, t), s: lerp(a.s, b.s, t), v: lerp(a.v, b.v, t) });
const mixScene = (a: Scene, b: Scene, t: number, fxT = t) => {
  const fx = {} as Record<Fx, number>;
  for (const k of FX) fx[k] = lerp(a.fx[k] ?? 0, b.fx[k] ?? 0, fxT);
  return { phone: mixPose(a.phone, b.phone, t), mono: mixPose(a.mono, b.mono, t), fx };
};

export type Sample = { phone: Pose; mono: Pose; fx: Record<Fx, number>; screen: string; act: string; lp: number; screenIndex: number; screenCount: number; merge: number };

/**
 * How far the ribbon N is merged into the N on the phone's back. It settles in over the middle of
 * the flight from the hero to the next act, stays there, and lifts back out in the finale while
 * the phone has its back to you (the turn passes its back at about 0.52 of the act).
 */
function mergeAt(list: string[], t: number, hold: number[]) {
  const at = (i: number) => Math.max(0.05, Math.min(0.95, hold[i] ?? 0.7));
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const fi = list.indexOf("finale");
  if (fi >= 0 && t >= fi) return 1 - smooth(clamp((Math.min(1, (t - fi) / at(fi)) - 0.46) / 0.34));
  const hi = list.indexOf("hero");
  if (hi < 0) return 1;
  const s = t - hi;
  const h = at(hi);
  if (s <= h) return 0;
  return smooth(clamp(((s - h) / (1 - h) - 0.28) / 0.6));
}

/**
 * The scene at story position t (act index + fraction of that act scrolled). `hold` is each act's
 * pinned share: the part of its height spent pinned, before it starts to scroll away.
 */
export function sample(acts: string[], t: number, hold: number[]): Sample {
  const list = acts.filter((a) => a in KEYS);
  if (list.length === 0) list.push("hero");
  const i = Math.max(0, Math.min(list.length - 1, Math.floor(t)));
  const s = Math.max(0, Math.min(1, t - i));
  const h = Math.max(0.05, Math.min(0.95, hold[i] ?? 0.7));
  const key = KEYS[list[i]!]!;
  const next = KEYS[list[Math.min(list.length - 1, i + 1)]!]!;
  const lp = Math.min(1, s / h);
  // Between acts, the leaving act's objects clear in the first part of the flight, so they never
  // linger over the phone as it arrives.
  const u = (s - h) / (1 - h);
  const scene = s <= h ? mixScene(key.from, key.to, easeInOut(lp)) : mixScene(key.to, next.from, smooth(u), smooth(Math.min(1, u * 1.8)));
  const n = key.screens.length;
  // Same formula as the tour captions' --seg in film.css, so the screen and its caption change together.
  const idx = Math.max(0, Math.min(n - 1, Math.floor(lp * n * 0.92 + 0.25)));
  // Once the next act's phone is on its way, show its first screen (it is mid-flight, so the change reads as a transition).
  const leaving = s > h + (1 - h) * 0.5 && i < list.length - 1;
  return {
    ...scene,
    screen: leaving ? next.screens[0]! : key.screens[idx]!,
    act: list[leaving ? i + 1 : i]!,
    lp,
    screenIndex: idx,
    screenCount: n,
    merge: mergeAt(list, t, hold),
  };
}
