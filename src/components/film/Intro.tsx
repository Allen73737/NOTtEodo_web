"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LOGO_MONOGRAM, LOGO_WORDMARK } from "@/components/brand/logo-paths";
import { PEN_PATHS, PEN_WIDTH, WORDMARK_LETTERS } from "@/components/brand/pen-paths";
import { play, setSound, soundOn } from "@/lib/sound";
import { toggleTheme } from "@/motion/theme-wash";

const WORDS = ["Notes.", "Tasks.", "Plans.", "Habits.", "Money.", "Wardrobe.", "Travel.", "Journal.", "Life."];
const MIN_MS = 3600;
const MAX_MS = 8000;
/** The app's boot lines (logo_reveal_screen.dart), by loading progress. */
const STAGES: [number, string][] = [
  [30, "Winding the movement"],
  [60, "Unsealing your vault"],
  [88, "Arranging your day"],
  [101, "Welcome"],
];
/** The pens' box: the app's 100×100 design box, cropped to the stroke so it lies over the traced N. */
const PEN_BOX = "3.74 2.57 92.3 94.3";
/** Ink dust, seeded so the server and the browser agree. */
const MOTES = Array.from({ length: 22 }, (_, i) => {
  const r = (n: number) => Number(((((Math.sin((i + 1) * 739 + n * 17) * 10000) % 1) + 1) % 1).toFixed(4));
  return { x: r(1) * 100, s: 1.2 + r(2) * 2.6, d: 7 + r(3) * 9, delay: -r(4) * 14, o: 0.18 + r(5) * 0.4, acc: r(6) > 0.72 };
});

/**
 * Whether the title is skipped. The head script (theme-script.ts) marks <html> with `intro-skip`
 * unless this is a reload, or a first arrival at the home page in this tab: back/forward, and
 * every arrival from another page of the site, skip it. Hydration reads false (matching the
 * server; CSS hides the title meanwhile), and a client navigation back home reads the class at
 * once, so the title never flashes.
 */
const noop = () => () => {};
const skipped = () => document.documentElement.classList.contains("intro-skip");

/**
 * The opening title. Server-rendered, so its first act (the pen tracing the ribbon N, the ink
 * flooding in, the lettering written out) is pure CSS and SVG, and starts with the first paint.
 * The client adds the live part: a bezel that counts real loading, the logo tilting toward the
 * pointer, and the exit, where the camera dives through the ribbon itself and the page appears
 * inside it.
 *
 * Over it, the app's own boot (logo_reveal_screen.dart), so opening the site and opening the app
 * feel the same: two pens with glowing nibs draw the monogram's centre line before the ink floods,
 * a sheen crosses the mark, the wordmark rises letter by letter, an oxblood rule unfurls, faint
 * guilloché rings and ink dust drift behind, and a silk bar carries the app's loading lines.
 *
 * On a reload or a first arrival, in the visitor's theme (with a day/night switch of its own).
 * Reduced motion gets a short, still version. Skippable at any point (button, Esc, Enter, or a
 * tap anywhere, as in the app), because a title that can't be skipped is a dark pattern.
 */
export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<SVGSVGElement>(null);
  const hole = useRef<SVGGElement>(null);
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);
  /** Loaded: offer to enter with sound or quietly (enters quietly by itself after a few seconds). */
  const [gate, setGate] = useState(false);
  const skip = useSyncExternalStore(noop, skipped, () => false);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    if (!el || html.classList.contains("intro-skip")) return setGone(true);
    html.classList.add("intro-on");
    // Once seen, coming back home in this page load (or this tab) never replays it.
    const seen = () => html.classList.add("intro-skip");
    try {
      sessionStorage.setItem("nt-intro", "1");
    } catch {
      /* storage blocked: the class still covers this page load */
    }
    const reduced = html.classList.contains("reduced");
    // Timed from navigation start, so it lines up with the CSS that has been playing since first paint.
    const t0 = 0;
    let leaving = false;
    let raf = 0;
    let gateTimer: ReturnType<typeof setTimeout> | undefined;

    const ready = () => {
      const fonts = document.fonts?.status === "loaded" ? 1 : 0;
      const film = html.dataset.film;
      const stage = film === "full" ? (html.classList.contains("journey-ready") ? 1 : 0) : film ? 1 : 0;
      const imgs = [...document.images].filter((i) => i.loading !== "lazy");
      const pics = imgs.length ? imgs.filter((i) => i.complete).length / imgs.length : 1;
      return (fonts + stage + pics) / 3;
    };

    const finish = () => {
      html.classList.remove("intro-on");
      seen();
      setGone(true);
    };

    const leave = (instant = false) => {
      if (leaving) return;
      leaving = true;
      setPct(100);
      setGate(false);
      play("whoosh");
      if (instant || reduced || !logo.current || !hole.current) {
        el.classList.add("is-fading");
        setTimeout(finish, reduced ? 450 : 260);
        return;
      }
      // Place the mask's N exactly over the visible one, then dive through it.
      const r = logo.current.getBoundingClientRect();
      const k = r.width / LOGO_MONOGRAM.w;
      const [fx, fy] = LOGO_MONOGRAM.focus;
      const px = r.left + fx * k;
      const py = r.top + fy * k;
      el.classList.add("is-leaving");
      const start = performance.now();
      const D = 1350;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / D);
        // Hold a beat, then accelerate like a camera dolly.
        const e = t < 0.18 ? 0 : Math.pow((t - 0.18) / 0.82, 3.2);
        const s = 1 + e * 140;
        hole.current?.setAttribute("transform", `translate(${px} ${py}) scale(${s}) translate(${-px} ${-py}) translate(${r.left} ${r.top}) scale(${k})`);
        if (t < 1) raf = requestAnimationFrame(step);
        else finish();
      };
      raf = requestAnimationFrame(step);
    };

    const tick = () => {
      if (leaving) return;
      const elapsed = performance.now() - t0;
      const time = Math.min(1, elapsed / MIN_MS);
      const real = ready();
      setPct(Math.round(Math.min(time, real * 0.98 + 0.02) * 100));
      if ((elapsed >= MIN_MS && real >= 1) || elapsed >= MAX_MS || (reduced && elapsed > 700)) {
        setPct(100);
        // Sound already chosen on an earlier visit, or reduced motion: straight in.
        if (soundOn() || reduced) return leave();
        setGate(true);
        gateTimer = setTimeout(() => leave(), 5200);
      } else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") leave(true);
    };
    // As in the app, a tap anywhere enters (the buttons keep their own meaning).
    const onTap = (e: PointerEvent) => {
      if (!(e.target as Element).closest("button")) leave(true);
    };
    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--rx", `${((e.clientY / innerHeight) * 2 - 1) * -9}deg`);
      el.style.setProperty("--ry", `${((e.clientX / innerWidth) * 2 - 1) * 12}deg`);
      el.style.setProperty("--mx", `${e.clientX}px`);
      el.style.setProperty("--my", `${e.clientY}px`);
    };
    addEventListener("keydown", onKey);
    addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerdown", onTap);
    (el as HTMLDivElement & { skip?: () => void }).skip = () => leave(true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(gateTimer);
      removeEventListener("keydown", onKey);
      removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onTap);
      // Not marked seen here: a dev double-mount would otherwise skip the title it is about to play.
      html.classList.remove("intro-on");
    };
  }, []);

  if (gone || skip) return null;
  const { d, w, h } = LOGO_MONOGRAM;
  const stage = STAGES.find(([upTo]) => pct < upTo)?.[1] ?? "Welcome";
  const pens = [...PEN_PATHS.loops, ...PEN_PATHS.tails];
  return (
    <div ref={root} className="intro" role="status" aria-label="NOTtEodo is opening">
      {/* The veil: page-coloured, with the ribbon N cut out of it for the exit. */}
      <svg className="intro__veil" aria-hidden="true">
        <defs>
          <mask id="intro-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect width="100%" height="100%" fill="white" />
            <g ref={hole} transform="scale(0)">
              <path d={d} fillRule="evenodd" fill="black" />
            </g>
          </mask>
        </defs>
        <rect width="100%" height="100%" mask="url(#intro-mask)" className="intro__paper" />
      </svg>
      <div className="intro__spot" aria-hidden="true" />
      <div className="intro__dust" aria-hidden="true">
        {MOTES.map((m, i) => (
          <i
            key={i}
            className={m.acc ? "is-acc" : undefined}
            style={{ left: `${m.x}%`, width: m.s, height: m.s, opacity: m.o, animationDuration: `${m.d}s`, animationDelay: `${m.delay}s` }}
          />
        ))}
      </div>

      <div className="intro__stage" aria-hidden="true">
        <div className="intro__tilt">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="intro__ring" style={{ ["--r" as string]: i }} />
          ))}
          <span className="intro__ripple" />
          <span className="intro__ripple" style={{ animationDelay: "1.7s" }} />
          <span className="intro__ripple" style={{ animationDelay: "1.95s" }} />
          <svg className="intro__bezel" viewBox="0 0 200 200">
            <defs>
              <mask id="intro-bezel-mask">
                <circle cx="100" cy="100" r="94" fill="none" stroke="white" strokeWidth="14" pathLength={100} strokeDasharray={`${pct} 100`} transform="rotate(-90 100 100)" />
              </mask>
            </defs>
            <circle className="intro__ticks" cx="100" cy="100" r="94" pathLength={120} />
            <circle className="intro__ticks intro__ticks--lit" cx="100" cy="100" r="94" pathLength={120} mask="url(#intro-bezel-mask)" />
          </svg>
          <svg ref={logo} className="intro__mark" viewBox={`0 0 ${w} ${h}`}>
            <defs>
              {/* The app's sheen: a narrow band of light that glides across the ink once it has flooded. */}
              <linearGradient id="intro-sheen" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2={h} gradientTransform={`translate(${-w} 0)`}>
                <stop offset="0.38" stopColor="white" stopOpacity="0" />
                <stop offset="0.5" stopColor="white" stopOpacity="0.55" />
                <stop offset="0.62" stopColor="white" stopOpacity="0" />
                <animateTransform attributeName="gradientTransform" type="translate" from={`${-w} 0`} to={`${w} 0`} begin="1.95s" dur="0.9s" fill="freeze" />
              </linearGradient>
            </defs>
            <path className="intro__ink" d={d} fillRule="evenodd" />
            <path className="intro__sheen" d={d} fillRule="evenodd" fill="url(#intro-sheen)" />
          </svg>
          {/* The app's two pens: the loop drawn from both ends at once, then the tails as a flourish. */}
          <svg className="intro__pens" viewBox={PEN_BOX}>
            {pens.map((p, i) => (
              <path key={i} id={`intro-pen-${i}`} d={p} pathLength={1} strokeWidth={PEN_WIDTH * 1.15} className={i < 2 ? "is-loop" : "is-tail"} />
            ))}
            {pens.map((_, i) => {
              const begin = i < 2 ? 0.15 : 0.95;
              const dur = i < 2 ? 1.2 : 0.55;
              return (
                <g key={i} className="intro__nib" opacity="0">
                  <circle r={PEN_WIDTH * 1.5} className="intro__nib-halo" />
                  <circle r={PEN_WIDTH * 0.42} className="intro__nib-core" />
                  <animateMotion begin={`${begin}s`} dur={`${dur}s`} fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.645 0.045 0.355 1">
                    <mpath href={`#intro-pen-${i}`} />
                  </animateMotion>
                  <set attributeName="opacity" to="1" begin={`${begin}s`} />
                  <animate attributeName="opacity" to="0" begin={`${begin + dur - 0.05}s`} dur="0.25s" fill="freeze" />
                </g>
              );
            })}
          </svg>
        </div>
        {/* The wordmark rises letter by letter, as in the app. */}
        <svg className="intro__word" viewBox={`0 0 ${LOGO_WORDMARK.w} ${LOGO_WORDMARK.h}`}>
          {WORDMARK_LETTERS.map((l, i) => (
            <path key={i} d={l} fillRule="evenodd" style={{ ["--i" as string]: i }} />
          ))}
        </svg>
        <span className="intro__rule">
          <i />
        </span>
        <p className="intro__words">
          {WORDS.map((x, i) => (
            <span key={x} style={{ ["--i" as string]: i }}>
              {x}
            </span>
          ))}
          <span className="intro__line" style={{ ["--i" as string]: WORDS.length }}>
            Curate your everyday.
          </span>
        </p>
      </div>

      {/* Until scripts run, CSS counts; then the real loading progress takes over. */}
      <p className="intro__count t-num" aria-hidden="true" data-css={pct === 0 ? "" : undefined}>
        {pct > 0 ? String(pct).padStart(3, "0") : null}
      </p>
      {/* The app's boot footer: a silk bar and the loading line under it. */}
      <div className={`intro__boot${gate ? " is-gated" : ""}`} aria-hidden="true">
        <span className="intro__silk">
          <span style={{ transform: `scaleX(${pct / 100})` }} />
        </span>
        <span key={stage} className="intro__stage-line t-label">
          {stage}
        </span>
        <span className="intro__tap">Tap anywhere to enter</span>
      </div>
      {gate && (
        <div className="intro__gate" role="group" aria-label="Enter the site">
          <button
            type="button"
            className="intro__enter"
            autoFocus
            onClick={() => {
              setSound(true);
              play("bloom", true);
              (root.current as (HTMLDivElement & { skip?: () => void }) | null)?.skip?.();
            }}
          >
            <span className="intro__wave" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            Enter with sound
          </button>
          <button type="button" className="intro__quiet t-label" onClick={() => (root.current as (HTMLDivElement & { skip?: () => void }) | null)?.skip?.()}>
            Enter quietly
          </button>
          <span className="intro__auto" aria-hidden="true" />
        </div>
      )}
      <p className="intro__meta t-label" aria-hidden="true">
        Notes · Tasks · Life · for Android
      </p>
      <button type="button" className="intro__mode t-label" onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}>
        <span className="intro__mode-day">Day</span> / <span className="intro__mode-night">Night</span>
      </button>
      <button type="button" className="intro__skip t-label" onClick={() => (root.current as (HTMLDivElement & { skip?: () => void }) | null)?.skip?.()}>
        Skip intro
      </button>
    </div>
  );
}
