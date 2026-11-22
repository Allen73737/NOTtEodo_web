"use client";

/**
 * Sound design, off until the visitor turns it on (the intro asks once; the speaker in the nav
 * toggles it) and never autoplayed. Everything is synthesised with Web Audio, no files.
 *
 * The rule is restraint: silence while you read or idle, and only a short, soft, low cue when
 * something actually happens. No drones, no loops, nothing on hover. Each cue is warm (sine and
 * gently modulated bells, rolled off above 4.5 kHz) and rate-limited, so fast scrolling or
 * clicking never stacks into noise.
 *   tick, paper, wax, drop   the app's own cues (escapement, page, seal press, ink drop)
 *   tap                      a felt press on buttons
 *   whoosh, land             the page sheet rising (a breath of air) and settling (one low bell)
 *   screen                   a soft glass tap when the phone's screen changes
 *   chapter                  a quiet bell when the story reaches a new act
 *   bloom                    the intro's chord opening
 */
export type Cue = "tick" | "paper" | "wax" | "drop" | "hover" | "tap" | "whoosh" | "land" | "screen" | "chapter" | "bloom";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let room: ConvolverNode | null = null;
/** Last time each cue played, for rate limiting. */
const last = new Map<Cue, number>();
const GAP: Partial<Record<Cue, number>> = { tap: 60, screen: 380, chapter: 1600, whoosh: 500, land: 500, tick: 40 };

export function soundOn() {
  try {
    return localStorage.getItem("nt-sound") === "on";
  } catch {
    return false;
  }
}

/** Turns sound on or off for this browser. */
export function setSound(on: boolean) {
  try {
    if (on) localStorage.setItem("nt-sound", "on");
    else localStorage.removeItem("nt-sound");
  } catch {
    /* storage blocked: sound still follows this tab */
  }
  window.dispatchEvent(new CustomEvent("nt:sound", { detail: on }));
  if (on) ac();
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.ratio.value = 4;
    // Roll off the top end: nothing in the set should ever sound sharp.
    const soft = ctx.createBiquadFilter();
    soft.type = "lowpass";
    soft.frequency.value = 4500;
    soft.Q.value = 0.5;
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(soft).connect(comp).connect(ctx.destination);
    // A short, dark synthetic room for the bells and the curtain.
    room = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.2);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    }
    room.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.18;
    room.connect(wet).connect(master);
    document.addEventListener("visibilitychange", () => {
      if (!ctx) return;
      if (document.hidden) void ctx.suspend();
      else if (soundOn()) void ctx.resume();
    });
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * seconds)), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

/** An output for one cue: dry to the master, optionally sent to the room. */
function voice(c: AudioContext, send = 0) {
  const g = c.createGain();
  g.connect(master!);
  if (send > 0 && room) {
    const s = c.createGain();
    s.gain.value = send;
    g.connect(s).connect(room);
  }
  return g;
}

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function tone(c: AudioContext, out: AudioNode, type: OscillatorType, f0: number, f1: number, t: number, dur: number) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  o.connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}

/** A soft FM bell: little modulation, so it sounds round rather than glassy. */
function bell(c: AudioContext, f: number, t: number, peak: number, dur: number, send = 0.6) {
  const out = voice(c, send);
  env(out, t, peak, 0.004, dur);
  const car = c.createOscillator();
  const mod = c.createOscillator();
  const depth = c.createGain();
  car.frequency.value = f;
  mod.frequency.value = f * 2;
  depth.gain.setValueAtTime(f * 0.35, t);
  depth.gain.exponentialRampToValueAtTime(1, t + dur);
  mod.connect(depth).connect(car.frequency);
  car.connect(out);
  car.start(t);
  mod.start(t);
  car.stop(t + dur + 0.1);
  mod.stop(t + dur + 0.1);
}

// D major pentatonic around D4, for bells and screen taps: low and calm.
const SCALE = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25];

export function play(cue: Cue, opts: boolean | { force?: boolean; index?: number } = false) {
  const o = typeof opts === "boolean" ? { force: opts } : opts;
  if (!o.force && !soundOn()) return;
  const c = ac();
  if (!c || !master) return;
  const now = performance.now();
  if (now - (last.get(cue) ?? -1e9) < (GAP[cue] ?? 0)) return;
  last.set(cue, now);
  const t = c.currentTime + 0.005;
  switch (cue) {
    case "tick": {
      const out = voice(c);
      env(out, t, 0.05, 0.001, 0.03);
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 2800;
      f.connect(out);
      tone(c, f, "square", 3200, 3200, t, 0.04);
      break;
    }
    case "paper": {
      const out = voice(c, 0.15);
      env(out, t, 0.06, 0.01, 0.18);
      const n = noise(c, 0.22);
      const f = c.createBiquadFilter();
      f.type = "highpass";
      f.frequency.setValueAtTime(1800, t);
      f.frequency.linearRampToValueAtTime(4200, t + 0.18);
      n.connect(f).connect(out);
      n.start(t);
      break;
    }
    case "wax": {
      const out = voice(c, 0.3);
      env(out, t, 0.16, 0.005, 0.32);
      tone(c, out, "sine", 140, 55, t, 0.32);
      break;
    }
    case "drop": {
      const out = voice(c, 0.35);
      env(out, t, 0.07, 0.003, 0.22);
      tone(c, out, "sine", 900, 320, t, 0.14);
      break;
    }
    case "hover":
      // Deliberately silent: sound under the pointer becomes noise within seconds.
      return;
    case "tap": {
      const out = voice(c, 0.08);
      env(out, t, 0.045, 0.002, 0.06);
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 900;
      f.connect(out);
      tone(c, f, "sine", 260, 150, t, 0.06);
      break;
    }
    case "whoosh": {
      // A breath of air: low, filtered noise that swells and fades.
      const out = voice(c, 0.25);
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(0.035, t + 0.22);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      const n = noise(c, 0.6);
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.Q.value = 0.6;
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(1100, t + 0.3);
      f.frequency.exponentialRampToValueAtTime(400, t + 0.55);
      n.connect(f).connect(out);
      n.start(t);
      break;
    }
    case "land": {
      bell(c, SCALE[0]!, t, 0.03, 0.9, 0.5);
      break;
    }
    case "screen": {
      const i = Math.abs(o.index ?? 0) % SCALE.length;
      bell(c, SCALE[i]! * 2, t, 0.014, 0.28, 0.35);
      break;
    }
    case "chapter": {
      const i = Math.abs(o.index ?? 0);
      bell(c, SCALE[i % SCALE.length]!, t, 0.022, 1.2, 0.6);
      break;
    }
    case "bloom": {
      [146.83, 220, 293.66, 369.99].forEach((f, k) => bell(c, f, t + k * 0.12, 0.024, 2, 0.7));
      break;
    }
  }
}

/** Light haptic on Android for key interactions; silent when motion is reduced. */
export function haptic(ms = 8) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (document.documentElement.classList.contains("reduced")) return;
  try {
    navigator.vibrate(ms);
  } catch {
    /* not allowed without a user gesture */
  }
}
