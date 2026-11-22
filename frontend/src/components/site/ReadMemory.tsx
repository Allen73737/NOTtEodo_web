"use client";

import { CornerDownRight, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** localStorage key: { [path]: { p: furthest share read 0..1, y: last scroll position, at: ms } } */
const KEY = "nt-read";
type Entry = { p: number; y: number; at: number };

export function readMemory(): Record<string, Entry> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Entry>;
  } catch {
    return {};
  }
}

/**
 * Remembers how far down a long page you read. Coming back within 60 days, a pill offers to
 * take you to where you left off; it goes away on its own once you start reading. Stays in this
 * browser (see /cookies).
 */
export function ReadMemory() {
  const path = usePathname();
  const [resume, setResume] = useState<number | null>(null);

  useEffect(() => {
    const all = readMemory();
    const was = all[path];
    let offered = false;
    if (was && was.p < 0.95 && was.y > innerHeight * 0.8 && Date.now() - was.at < 60 * 864e5) {
      offered = true;
      setResume(was.y);
    }
    let raf = 0;
    let saveTimer = 0;
    const save = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (max <= 0) return;
      const next = readMemory();
      const prev = next[path];
      next[path] = { p: Math.max(prev?.p ?? 0, scrollY / max), y: scrollY, at: Date.now() };
      // Keep the 40 most recent pages.
      const keep = Object.entries(next)
        .sort((a, b) => b[1].at - a[1].at)
        .slice(0, 40);
      try {
        localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(keep)));
      } catch {
        /* storage full or blocked */
      }
    };
    const on = () => {
      if (offered && scrollY > innerHeight * 0.5) {
        offered = false;
        setResume(null);
      }
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          clearTimeout(saveTimer);
          saveTimer = window.setTimeout(save, 400);
        });
    };
    addEventListener("scroll", on, { passive: true });
    addEventListener("pagehide", save);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(saveTimer);
      removeEventListener("scroll", on);
      removeEventListener("pagehide", save);
    };
  }, [path]);

  if (resume === null) return null;
  return (
    <div className="resume no-print" role="status">
      <button
        type="button"
        className="resume__go"
        onClick={() => {
          const reduced = document.documentElement.classList.contains("reduced");
          scrollTo({ top: resume, behavior: reduced ? "auto" : "smooth" });
          setResume(null);
        }}
      >
        <CornerDownRight size={16} strokeWidth={1.8} aria-hidden />
        Pick up where you left off
      </button>
      <button type="button" className="resume__x" aria-label="Dismiss" onClick={() => setResume(null)}>
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

/** "2 of 3 read" over the guides list, and a mark on each card you've read. */
export function ReadBadge({ paths, mode }: { paths: string[]; mode: "count" | "one" }) {
  const [mem, setMem] = useState<Record<string, Entry> | null>(null);
  useEffect(() => setMem(readMemory()), []);
  if (!mem) return null;
  const share = (p: string) => mem[p]?.p ?? 0;
  if (mode === "count") {
    const done = paths.filter((p) => share(p) >= 0.9).length;
    if (!paths.some((p) => share(p) > 0)) return null;
    return (
      <p className="read-count t-label">
        <span className="t-num">{done}</span> of <span className="t-num">{paths.length}</span> read
      </p>
    );
  }
  const s = share(paths[0]!);
  if (s <= 0.05) return null;
  return <span className={`read-mark t-label${s >= 0.9 ? " is-done" : ""}`}>{s >= 0.9 ? "Read" : `${Math.round(s * 100)}% read`}</span>;
}
