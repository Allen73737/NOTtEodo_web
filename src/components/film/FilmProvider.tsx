"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

/**
 * Picks one of three designed rendering paths:
 *   full    WebGL world + ink field + smooth scroll (GPU tier ≥ 2, no Save-Data, memory > 4 GB)
 *   lite    no 3D: pre-rendered posters and CSS motion, still scroll-scrubbed
 *   reduced no scroll-jacking, pinning or parallax; gentle fades and static posters
 * Also runs the per-chapter scroll progress loop that every scene reads.
 */
export type FilmMode = "full" | "lite" | "reduced";
const Ctx = createContext<FilmMode>("reduced");
export const useFilmMode = () => useContext(Ctx);

/** Scroll progress of each [data-chapter] element: 0 when its top reaches the bottom of the viewport, 1 when its bottom leaves the top. */
export const progress = new Map<string, number>();
/** Smoothed scroll velocity in px/frame (scenes use it to drive the watch movement). */
export const scrollState = { velocity: 0 };

const World = dynamic(() => import("@/three/World").then((m) => m.World), { ssr: false });

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
      let lite = Boolean(nav.connection?.saveData) || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4);
      try {
        const b = await nav.getBattery?.();
        if (b && !b.charging && b.level < 0.2) lite = true;
      } catch {
        /* not available */
      }
      if (!lite) {
        try {
          const { getGPUTier } = await import("detect-gpu");
          const gpu = await getGPUTier({ benchmarksURL: "/gpu-benchmarks" });
          lite = gpu.tier < 2 || gpu.type === "BLOCKLISTED" || gpu.type === "FALLBACK";
        } catch {
          // Without benchmark data, decide from WebGL2 support alone.
          lite = !document.createElement("canvas").getContext("webgl2");
        }
      }
      if (!cancelled) setMode(lite ? "lite" : "full");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Per-chapter progress + velocity, one rAF loop for the whole page.
  useEffect(() => {
    if (mode === "reduced") return;
    const els = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
    let raf = 0;
    let last = scrollY;
    const loop = () => {
      const vh = innerHeight;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const p = (vh - r.top) / (r.height + vh);
        const v = Math.max(0, Math.min(1, p));
        progress.set(el.dataset.chapter!, v);
        el.style.setProperty("--p", v.toFixed(4));
      }
      scrollState.velocity += (scrollY - last - scrollState.velocity) * 0.15;
      last = scrollY;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  // Lenis smooth scroll on the film only (never for reduced motion).
  useEffect(() => {
    if (mode !== "full") return;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let raf = 0;
    void import("lenis").then(({ default: Lenis }) => {
      lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
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
      {mode === "full" && <World />}
    </Ctx.Provider>
  );
}
