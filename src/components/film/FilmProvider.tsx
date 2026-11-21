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
 * Where the reader is in the story. `f` is a float act index: 2.0 means act 2 is centred and
 * holding; 2.5 means halfway between acts 2 and 3. The 3D stage interpolates its keyframes on it.
 */
export const journey = {
  f: 0,
  acts: [] as string[],
  /** Pointer position, -1..1 on both axes. */
  pointer: { x: 0, y: 0 },
  /** Extra phone spin from dragging (radians), and whether a drag is under way. */
  spin: 0,
  dragging: false,
};

const Journey = dynamic(() => import("@/three/journey/Journey"), { ssr: false });

/** Time spent holding still in the middle of each act, as a share of its height. */
const HOLD = 0.36;

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
      // deviceMemory is capped at 8 and often reports 4 on capable laptops, so only very small values count.
      let lite = Boolean(nav.connection?.saveData) || (nav.deviceMemory !== undefined && nav.deviceMemory < 2);
      if (!document.createElement("canvas").getContext("webgl2")) lite = true;
      try {
        const b = await nav.getBattery?.();
        if (b && !b.charging && b.level < 0.15) lite = true;
      } catch {
        /* not available */
      }
      if (!lite) {
        try {
          const { getGPUTier } = await import("detect-gpu");
          const gpu = await getGPUTier({ benchmarksURL: "/gpu-benchmarks" });
          // Tier 1 integrated GPUs handle this scene well; only blocklisted or unusable ones drop to lite.
          lite = gpu.type === "BLOCKLISTED" || (gpu.tier === 0 && gpu.type !== "FALLBACK");
        } catch {
          /* no benchmark data: WebGL2 is enough */
        }
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
        el.style.setProperty("--p", v.toFixed(4));
      }
      // Story position: hold in the middle of each act, travel across the boundaries.
      const anchor = vh * 0.5;
      let f = 0;
      for (let i = 0; i < acts.length; i++) {
        const r = acts[i]!.getBoundingClientRect();
        if (i === acts.length - 1 || r.bottom > anchor) {
          const local = Math.max(0, Math.min(1, (anchor - r.top) / r.height));
          const c = local - 0.5;
          const h = HOLD / 2;
          const off = Math.abs(c) <= h ? 0 : (Math.sign(c) * (Math.abs(c) - h)) / (0.5 - h) / 2;
          f = Math.max(0, Math.min(acts.length - 1, i + off));
          break;
        }
      }
      journey.f = f;
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
