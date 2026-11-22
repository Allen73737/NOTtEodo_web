"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * Per-visitor preferences, kept only in this browser (never sent anywhere):
 * theme, Cards/Editorial view, sound, motion and the "Start where you are" persona.
 */
export type Theme = "light" | "dark";
export type View = "cards" | "editorial";
export type Persona = "students" | "creatives" | "professionals" | "travellers";

const KEYS = { theme: "nt-theme", view: "nt-view", sound: "nt-sound", persona: "nt-persona", motion: "nt-motion" };

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", cb);
  };
}

export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  const d = document.documentElement;
  d.dataset.theme = theme;
  d.dataset.mode = theme;
  write(KEYS.theme, theme);
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  meta?.setAttribute("content", getComputedStyle(d).getPropertyValue("--c-canvas").trim());
  notify();
  window.dispatchEvent(new CustomEvent("nt:theme", { detail: theme }));
}

export function applyView(view: View) {
  document.documentElement.dataset.view = view;
  write(KEYS.view, view);
  notify();
  window.dispatchEvent(new CustomEvent("nt:view", { detail: view }));
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, () => "light");
}

export function useView(): View {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.view === "editorial" ? "editorial" : "cards"),
    () => "cards",
  );
}

export function useStoredFlag(name: "sound" | "motion") {
  const key = KEYS[name];
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const set = useCallback(
    (v: string | null) => {
      write(key, v);
      if (name === "motion") document.documentElement.classList.toggle("reduced", v === "reduced");
      notify();
    },
    [key, name],
  );
  return [value, set] as const;
}

export function usePersona() {
  const value = useSyncExternalStore(
    subscribe,
    () => read(KEYS.persona) as Persona | null,
    () => null,
  );
  const set = useCallback((p: Persona | null) => {
    write(KEYS.persona, p);
    notify();
  }, []);
  return [value, set] as const;
}

/** True when motion should be minimal: OS setting, the site's own toggle, or Save-Data. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("reduced"),
    () => true,
  );
}

/** Keeps the OS colour-scheme listener alive for visitors who never chose a theme. */
export function useSystemThemeSync() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => {
      const d = document.documentElement;
      if (!d.dataset.theme) {
        d.dataset.mode = mq.matches ? "dark" : "light";
        notify();
      }
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
}
