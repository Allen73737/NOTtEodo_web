"use client";

import { useEffect, useRef } from "react";

/** Writes the header's scroll progress (--hp, 0..1 over the first screen) for its drift and parallax. */
export function HeadDrift() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const head = ref.current?.parentElement;
    if (!head || document.documentElement.classList.contains("reduced")) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => head.style.setProperty("--hp", Math.min(1, scrollY / innerHeight).toFixed(3)));
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", on);
    };
  }, []);
  return <span ref={ref} hidden />;
}
