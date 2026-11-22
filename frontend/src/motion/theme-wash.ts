"use client";

import { applyTheme, applyView, currentTheme, type Theme, type View } from "@/lib/prefs";

/**
 * Port of theme_wash.dart: a disc of the destination canvas blooms from the touch point,
 * the theme flips underneath it, and the re-lit page is revealed. Uses the View Transitions
 * API where available; otherwise the theme switches with a short crossfade.
 */
export function washTo(theme: Theme, origin?: { x: number; y: number }) {
  const d = document.documentElement;
  const reduced = d.classList.contains("reduced");
  const x = origin?.x ?? window.innerWidth - 40;
  const y = origin?.y ?? 32;
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  d.style.setProperty("--wash-x", `${x}px`);
  d.style.setProperty("--wash-y", `${y}px`);
  d.style.setProperty("--wash-r", `${r}px`);
  const start = (document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } })
    .startViewTransition;
  if (!start || reduced) {
    applyTheme(theme);
    return;
  }
  d.classList.add("washing");
  const vt = start.call(document, () => applyTheme(theme));
  vt.finished.finally(() => d.classList.remove("washing"));
}

export function toggleTheme(origin?: { x: number; y: number }) {
  washTo(currentTheme() === "dark" ? "light" : "dark", origin);
}

/** Cards ↔ Editorial: the whole site re-themes, with a crossfade where supported. */
export function switchView(view: View) {
  const start = (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition;
  if (!start || document.documentElement.classList.contains("reduced")) return applyView(view);
  start.call(document, () => applyView(view));
}
