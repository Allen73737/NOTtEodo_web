"use client";

/**
 * Optional sound design, off by default and never autoplayed. Every sound is synthesised
 * with Web Audio (no files): an escapement tick, paper, a wax press and an ink drop.
 */
type Cue = "tick" | "paper" | "wax" | "drop";
let ctx: AudioContext | null = null;

function enabled() {
  try {
    return localStorage.getItem("nt-sound") === "on";
  } catch {
    return false;
  }
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * seconds)), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

export function play(cue: Cue, force = false) {
  if (!force && !enabled()) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const out = c.createGain();
  out.connect(c.destination);
  if (cue === "tick") {
    const o = c.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(3200, t);
    out.gain.setValueAtTime(0.05, t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2800;
    o.connect(f).connect(out);
    o.start(t);
    o.stop(t + 0.04);
  } else if (cue === "paper") {
    const n = noise(c, 0.18);
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 2400;
    out.gain.setValueAtTime(0.06, t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    n.connect(f).connect(out);
    n.start(t);
  } else if (cue === "wax") {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.25);
    out.gain.setValueAtTime(0.14, t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(out);
    o.start(t);
    o.stop(t + 0.32);
  } else {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(320, t + 0.12);
    out.gain.setValueAtTime(0.07, t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(out);
    o.start(t);
    o.stop(t + 0.22);
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
