"use client";

import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PosterEntry } from "@/content/posters";

/** Filterable poster gallery with a full-screen, keyboard-navigable viewer. */
export function Gallery({ posters }: { posters: PosterEntry[] }) {
  const series = useMemo(() => [...new Set(posters.map((p) => p.series))], [posters]);
  const [filter, setFilter] = useState<string>("all");
  const [theme, setTheme] = useState<"all" | "light" | "dark">("all");
  const [open, setOpen] = useState<number | null>(null);
  const list = posters.filter((p) => (filter === "all" || p.series === filter) && (theme === "all" || p.theme === theme));
  const go = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + list.length) % list.length)), [list.length]);

  useEffect(() => {
    if (open === null) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    addEventListener("keydown", on);
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", on);
      document.body.style.overflow = "";
    };
  }, [open, go]);

  const current = open !== null ? list[open] : null;
  return (
    <>
      <div className="row" role="group" aria-label="Filter posters">
        {["all", ...series].map((s) => (
          <button key={s} type="button" className="chip chip-btn" aria-pressed={filter === s} onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
        <span style={{ width: 16 }} />
        {(["all", "light", "dark"] as const).map((t) => (
          <button key={t} type="button" className="chip chip-btn" aria-pressed={theme === t} onClick={() => setTheme(t)}>
            {t === "all" ? "Both lights" : t === "light" ? "Ivory" : "OLED"}
          </button>
        ))}
      </div>
      <ul className="gallery">
        {list.map((p, i) => (
          <li key={p.id}>
            <button type="button" className="gallery__item" onClick={() => setOpen(i)} aria-label={`Open poster: ${p.alt}`} data-cursor="Open">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt="" loading="lazy" width={p.width} height={p.height} />
            </button>
          </li>
        ))}
      </ul>
      {current && (
        <div className="viewer" role="dialog" aria-modal="true" aria-label={current.alt}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={current.id} src={current.src} alt={current.alt} className="viewer__img" />
          <div className="viewer__bar">
            <span className="t-label">{current.title} · {current.series} · {current.width}×{current.height}</span>
            <div className="row" style={{ gap: 4 }}>
              <button type="button" className="icon-btn" aria-label="Previous" onClick={() => go(-1)}><ChevronLeft /></button>
              <button type="button" className="icon-btn" aria-label="Next" onClick={() => go(1)}><ChevronRight /></button>
              <a className="icon-btn" href={current.png ?? current.src} download aria-label="Download poster"><Download size={18} /></a>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setOpen(null)} autoFocus><X /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
