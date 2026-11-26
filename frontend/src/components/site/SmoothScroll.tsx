"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type LenisLike = { raf: (t: number) => void; destroy: () => void; scrollTo: (t: number, o?: { immediate?: boolean; force?: boolean }) => void };

/**
 * Lenis smooth scrolling for wheel and trackpad on every page (touch stays native). Never with
 * reduced motion. Nested scrollers (tables, the command palette, the simulator) keep their own
 * scroll; a new page starts at the top without an eased jump.
 */
export function SmoothScroll() {
  const lenis = useRef<LenisLike | null>(null);
  const path = usePathname();

  useEffect(() => {
    if (document.documentElement.classList.contains("reduced")) return;
    let raf = 0;
    let dead = false;
    void import("lenis").then(({ default: Lenis }) => {
      if (dead) return;
      lenis.current = new Lenis({ lerp: 0.125, smoothWheel: true, wheelMultiplier: 1.05, allowNestedScroll: true, anchors: true }) as unknown as LenisLike;
      const loop = (t: number) => {
        if (!document.hidden) lenis.current?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      lenis.current?.destroy();
      lenis.current = null;
    };
  }, []);

  useEffect(() => {
    lenis.current?.scrollTo(0, { immediate: true, force: true });
  }, [path]);

  return null;
}
