"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

/**
 * Picks one of three designed rendering paths:
 *   full    one fixed 3D stage that travels with the story (any device with WebGL2 that isn't
 *           blocklisted, low on memory, on Save-Data or nearly out of battery)
 *   lite    no 3D: real screenshots and CSS motion, still scroll-scrubbed and smooth-scrolled
 *   reduced no smooth scroll, pinning or parallax; gentle fades and static images
 * Also runs the one scroll loop that the story, the 3D stage and every chapter read.
 */
export type FilmMode = "full" | "lite" | "reduced";
const Ctx = createContext<FilmMode>("reduced");
export const useFilmMode = () => useContext(Ctx);

/** Scroll progress of each [data-chapter] element: 0 when its top reaches the bottom of the viewport, 1 when its bottom leaves the top. */
export const progress = new Map<string, number>();
/** Smoothed scroll velocity in px/frame. */
export const scrollState = { velocity: 0 };

/**
 * Where the reader is in the story. `t` is the act index plus the share of that act scrolled
 * (2.4 = 40% through act 2). `hold` is each act's pinned share of its height; `lp` is each act's
 * progress through its pinned part (0..1). The 3D stage and the act objects read these.
 */
export const journey = {
  t: 0,
  acts: [] as string[],
  hold: [] as number[],
  lp: new Map<string, number>(),
  /** Pointer position, -1..1 on both axes. */
  pointer: { x: 0, y: 0 },
  /** Extra phone spin from dragging (radians), and whether a drag is under way. */
  spin: 0,
  dragging: false,
};

const Journey = dynamic(() => import("@/three/journey/Journey"), { ssr: false });

/** Writes a CSS variable only when it changed, so idle frames cost no style work. */
const varCache = new WeakMap<HTMLElement, Record<string, string>>();
function setVar(el: HTMLElement, name: string, value: string) {
  const c = varCache.get(el) ?? {};
  if (c[name] === value) return;
  c[name] = value;
  varCache.set(el, c);
  el.style.setProperty(name, value);
}

export function FilmProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<FilmMode>("reduced");

  useEffect(() => {
    const d = document.documentElement;
    // QA / visual tests can force a path: ?film=full|lite|reduced
    const forced = new URLSearchParams(location.search).get("film");
    if (forced === "full" || forced === "lite" || forced === "reduced") return setMode(forced);
    if (d.classList.contains("reduced")) return setMode("reduced");
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number; getBattery?: () => Promise<{ level: number; charging: boolean }> };
    let cancelled = false;
    (async () => {
      // Any device with WebGL2 gets the 3D story, unless it asks to save data, has almost no memory or
      // is nearly out of battery. (deviceMemory is capped at 8 and often reports 4 on capable laptops.)
      let lite = Boolean(nav.connection?.saveData) || (nav.deviceMemory !== undefined && nav.deviceMemory < 2);
      if (!document.createElement("canvas").getContext("webgl2")) lite = true;
      try {
        const b = await nav.getBattery?.();
        if (b && !b.charging && b.level < 0.15) lite = true;
      } catch {
        /* not available */
      }
      if (!cancelled) setMode(lite ? "lite" : "full");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // One loop: per-chapter progress, the story position and scroll velocity.
  useEffect(() => {
    if (mode === "reduced") return;
    const chapters = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
    const acts = [...document.querySelectorAll<HTMLElement>("[data-act]")];
    journey.acts = acts.map((a) => a.dataset.act!);
    let raf = 0;
    let last = scrollY;
    const loop = () => {
      const vh = innerHeight;
      for (const el of chapters) {
        const r = el.getBoundingClientRect();
        const v = Math.max(0, Math.min(1, (vh - r.top) / (r.height + vh)));
        progress.set(el.dataset.chapter!, v);
        setVar(el, "--p", v.toFixed(3));
      }
      // Story position. Acts are contiguous, so exactly one has its top above the viewport top.
      // Each act also gets CSS variables for scroll-scrubbed motion:
      //   --a  screens scrolled since the act's top reached the viewport top (negative while it arrives)
      //   --lp progress through its pinned part, 0..1
      //   --x  progress of its exit, 0..1, once it un-pins
      let t = 0;
      for (let i = 0; i < acts.length; i++) {
        const el = acts[i]!;
        const r = el.getBoundingClientRect();
        const pin = Math.max(1, r.height - vh);
        const hold = pin / r.height;
        journey.hold[i] = hold;
        const lp = Math.max(0, Math.min(1, -r.top / pin));
        const x = Math.max(0, Math.min(1, (-r.top - pin) / vh));
        journey.lp.set(el.dataset.act!, lp);
        setVar(el, "--a", Math.max(-2, Math.min(4, -r.top / vh)).toFixed(3));
        setVar(el, "--lp", lp.toFixed(3));
        setVar(el, "--x", x.toFixed(3));
        if (r.top <= 0 && (r.bottom > 0 || i === acts.length - 1)) t = i + Math.max(0, Math.min(1, -r.top / r.height));
      }
      journey.t = t;
      // The stage fades out as the last act leaves, so it never sits over the footer.
      const end = acts[acts.length - 1]?.getBoundingClientRect();
      if (end) document.documentElement.style.setProperty("--journey-out", Math.max(0, Math.min(1, (vh * 0.6 - end.bottom) / (vh * 0.45))).toFixed(3));
      scrollState.velocity += (scrollY - last - scrollState.velocity) * 0.15;
      last = scrollY;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onPointer = (e: PointerEvent) => {
      journey.pointer.x = (e.clientX / innerWidth) * 2 - 1;
      journey.pointer.y = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onPointer);
    };
  }, [mode]);

  // Lenis smooth scroll, on both the 3D and the lite path (never for reduced motion).
  useEffect(() => {
    if (mode === "reduced") return;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let raf = 0;
    void import("lenis").then(({ default: Lenis }) => {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, [mode]);

  useEffect(() => {
    document.documentElement.dataset.film = mode;
    return () => {
      delete document.documentElement.dataset.film;
    };
  }, [mode]);

  return (
    <Ctx.Provider value={mode}>
      {children}
      {mode === "full" && <Journey />}
    </Ctx.Provider>
  );
}
