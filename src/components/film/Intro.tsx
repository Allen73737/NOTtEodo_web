"use client";

import { useEffect, useRef, useState } from "react";
import { LOGO_MONOGRAM, LOGO_WORDMARK } from "@/components/brand/logo-paths";

const WORDS = ["Notes.", "Tasks.", "Plans.", "Habits.", "Money.", "Wardrobe.", "Travel.", "Journal.", "Life."];
const MIN_MS = 3600;
const MAX_MS = 8000;

/**
 * The opening title. Server-rendered, so its first act (the pen tracing the ribbon N, the ink
 * flooding in, the lettering written out) is pure CSS and starts with the first paint. The client
 * adds the live part: a bezel that counts real loading, the logo tilting toward the pointer, and
 * the exit, where the camera dives through the ribbon itself and the page appears inside it.
 *
 * Once per browser session. Reduced motion gets a short, still version. Skippable at any point
 * (button, Esc or Enter), because a title that can't be skipped is a dark pattern.
 */
export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<SVGSVGElement>(null);
  const hole = useRef<SVGGElement>(null);
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    if (!el || html.classList.contains("intro-seen")) return setGone(true);
    try {
      sessionStorage.setItem("nt-intro", "1");
    } catch {
      /* storage blocked: the intro simply plays again next time */
    }
    html.classList.add("intro-on");
    const reduced = html.classList.contains("reduced");
    // Timed from navigation start, so it lines up with the CSS that has been playing since first paint.
    const t0 = 0;
    let leaving = false;
    let raf = 0;

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
      html.classList.add("intro-seen");
      setGone(true);
    };

    const leave = (instant = false) => {
      if (leaving) return;
      leaving = true;
      setPct(100);
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
      if ((elapsed >= MIN_MS && real >= 1) || elapsed >= MAX_MS || (reduced && elapsed > 700)) leave();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") leave(true);
    };
    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--rx", `${((e.clientY / innerHeight) * 2 - 1) * -9}deg`);
      el.style.setProperty("--ry", `${((e.clientX / innerWidth) * 2 - 1) * 12}deg`);
      el.style.setProperty("--mx", `${e.clientX}px`);
      el.style.setProperty("--my", `${e.clientY}px`);
    };
    addEventListener("keydown", onKey);
    addEventListener("pointermove", onMove, { passive: true });
    (el as HTMLDivElement & { skip?: () => void }).skip = () => leave(true);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("keydown", onKey);
      removeEventListener("pointermove", onMove);
      html.classList.remove("intro-on");
    };
  }, []);

  if (gone) return null;
  const { d, w, h } = LOGO_MONOGRAM;
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

      <div className="intro__stage" aria-hidden="true">
        <div className="intro__tilt">
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
            <path d={d} fillRule="evenodd" pathLength={1} />
          </svg>
        </div>
        <svg className="intro__word" viewBox={`0 0 ${LOGO_WORDMARK.w} ${LOGO_WORDMARK.h}`}>
          <path d={LOGO_WORDMARK.d} fillRule="evenodd" />
        </svg>
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
      <p className="intro__meta t-label" aria-hidden="true">
        Notes · Tasks · Life · for Android
      </p>
      <button type="button" className="intro__skip t-label" onClick={() => (root.current as (HTMLDivElement & { skip?: () => void }) | null)?.skip?.()}>
        Skip intro
      </button>
    </div>
  );
}
