"use client";

/**
 * Sound design, off until the visitor turns it on (the intro asks once; the speaker in the nav
 * toggles it) and never autoplayed. Everything is synthesised with Web Audio, no files:
 *   tick, paper, wax, drop   the app's own cues (escapement, page, seal press, ink drop)
 *   hover, tap               a felt tick under the pointer and a soft wooden press
 *   whoosh, land             the page curtain rising and settling
 *   screen                   a glass tap when the phone's screen changes (pitch follows the screen)
 *   chapter                  a small bell when the story reaches a new act, on a pentatonic scale
 *   bloom                    the intro's chord opening
 * plus a quiet ambient bed (two detuned voices through a slowly breathing filter) that brightens
 * a little while you scroll. All of it runs through one compressor and a short synthetic room.
 */
export type Cue = "tick" | "paper" | "wax" | "drop" | "hover" | "tap" | "whoosh" | "land" | "screen" | "chapter" | "bloom";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let room: ConvolverNode | null = null;
let lastHover = 0;

export function soundOn() {
  try {
    return localStorage.getItem("nt-sound") === "on";
  } catch {
    return false;
  }
}

/** Turns sound on or off for this browser and tells the ambient bed. */
export function setSound(on: boolean) {
  try {
    if (on) localStorage.setItem("nt-sound", "on");
    else localStorage.removeItem("nt-sound");
  } catch {
    /* storage blocked: sound still follows this tab */
  }
  window.dispatchEvent(new CustomEvent("nt:sound", { detail: on }));
  if (on) ac();
  ambient(on);
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);
    // A short, dark synthetic room for the bells and the curtain.
    room = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.8);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    room.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
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

/** A soft FM bell. */
function bell(c: AudioContext, f: number, t: number, peak: number, dur: number, send = 0.6) {
  const out = voice(c, send);
  env(out, t, peak, 0.004, dur);
  const car = c.createOscillator();
  const mod = c.createOscillator();
  const depth = c.createGain();
  car.frequency.value = f;
  mod.frequency.value = f * 3.5;
  depth.gain.setValueAtTime(f * 1.2, t);
  depth.gain.exponentialRampToValueAtTime(1, t + dur);
  mod.connect(depth).connect(car.frequency);
  car.connect(out);
  car.start(t);
  mod.start(t);
  car.stop(t + dur + 0.1);
  mod.stop(t + dur + 0.1);
}

// D major pentatonic around D5, for bells and screen taps.
const SCALE = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51];

export function play(cue: Cue, opts: boolean | { force?: boolean; index?: number } = false) {
  const o = typeof opts === "boolean" ? { force: opts } : opts;
  if (!o.force && !soundOn()) return;
  const c = ac();
  if (!c || !master) return;
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
    case "hover": {
      const now = performance.now();
      if (now - lastHover < 70) return;
      lastHover = now;
      const out = voice(c);
      env(out, t, 0.018, 0.002, 0.05);
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 5200;
      f.Q.value = 6;
      f.connect(out);
      const n = noise(c, 0.06);
      n.connect(f);
      n.start(t);
      break;
    }
    case "tap": {
      const out = voice(c, 0.1);
      env(out, t, 0.08, 0.001, 0.07);
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 1800;
      f.connect(out);
      tone(c, f, "triangle", 420, 180, t, 0.07);
      break;
    }
    case "whoosh": {
      const out = voice(c, 0.4);
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(0.09, t + 0.28);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
      const n = noise(c, 0.7);
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 1.4;
      f.frequency.setValueAtTime(260, t);
      f.frequency.exponentialRampToValueAtTime(2600, t + 0.4);
      n.connect(f).connect(out);
      n.start(t);
      break;
    }
    case "land": {
      const out = voice(c, 0.5);
      env(out, t, 0.12, 0.004, 0.4);
      tone(c, out, "sine", 110, 62, t, 0.36);
      bell(c, SCALE[3]!, t + 0.04, 0.025, 1.1, 0.8);
      break;
    }
    case "screen": {
      const i = Math.abs(o.index ?? 0) % SCALE.length;
      bell(c, SCALE[i]! * 2, t, 0.02, 0.35, 0.5);
      const out = voice(c);
      env(out, t, 0.03, 0.001, 0.04);
      const n = noise(c, 0.05);
      const f = c.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = 6000;
      n.connect(f).connect(out);
      n.start(t);
      break;
    }
    case "chapter": {
      const i = Math.abs(o.index ?? 0);
      bell(c, SCALE[i % SCALE.length]!, t, 0.045, 1.8, 0.9);
      bell(c, SCALE[(i + 2) % SCALE.length]! / 2, t + 0.09, 0.025, 2.2, 0.9);
      break;
    }
    case "bloom": {
      [293.66, 440, 587.33, 739.99, 880].forEach((f, k) => bell(c, f, t + k * 0.11, 0.035, 2.8, 1));
      break;
    }
  }
}

/* ------------------------------------------------------------------ ambient bed */

let bed: { gain: GainNode; filter: BiquadFilterNode; stop: () => void } | null = null;

/** Starts or stops the ambient bed. */
export function ambient(on: boolean) {
  const c = on ? ac() : ctx;
  if (!c || !master) return;
  if (on && !bed) {
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.022, c.currentTime + 3);
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    filter.connect(gain).connect(master);
    if (room) {
      const s = c.createGain();
      s.gain.value = 0.6;
      gain.connect(s).connect(room);
    }
    const oscs = [146.83, 220, 293.66, 220.6].map((f, i) => {
      const o = c.createOscillator();
      o.type = i % 2 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 6;
      o.connect(filter);
      o.start();
      return o;
    });
    const lfo = c.createOscillator();
    const lfoDepth = c.createGain();
    lfo.frequency.value = 0.07;
    lfoDepth.gain.value = 140;
    lfo.connect(lfoDepth).connect(filter.frequency);
    lfo.start();
    bed = {
      gain,
      filter,
      stop: () => {
        const t = c.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
        [...oscs, lfo].forEach((o) => o.stop(t + 0.9));
      },
    };
  } else if (!on && bed) {
    bed.stop();
    bed = null;
  }
}

/** 0..1: how lively the bed should sound (scroll speed). */
export function ambientEnergy(v: number) {
  if (!bed || !ctx) return;
  const k = Math.max(0, Math.min(1, v));
  bed.filter.frequency.setTargetAtTime(420 + k * 1400, ctx.currentTime, 0.25);
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
