"use client";

import { List, X } from "lucide-react";
import { useEffect, useState } from "react";

type Item = { id: string; title: string };

/**
 * Brings a page's contents (`nav[data-toc]`, server-rendered so it works without JS) to life:
 * the section being read is marked `aria-current`, and below the wide layout, once the contents
 * have scrolled away, a floating pill shows where you are ("3 / 12") and opens them as a sheet.
 */
export function TocSpy() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(-1);
  const [pill, setPill] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("nav[data-toc]");
    if (!nav) return;
    const links = [...nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']")];
    const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
    setItems(links.map((a, i) => ({ id: targets[i]?.id ?? "", title: a.textContent ?? "" })).filter((x) => x.id));

    // The active section is the last one whose top has passed the reading line.
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = innerHeight * 0.3;
      let idx = -1;
      targets.forEach((t, i) => {
        if (t && t.getBoundingClientRect().top < line) idx = i;
      });
      links.forEach((a, i) => (i === idx ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
      setActive(idx);
      // A contents list hidden at this width (guides) hands over to the pill at the first section.
      const passed = nav.offsetParent ? nav.getBoundingClientRect().bottom < 0 : idx >= 0;
      setPill(passed && !matchMedia("(min-width: 1180px)").matches);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);

  if (!items.length) return null;
  return (
    <>
      <button
        type="button"
        className={`toc-pill no-print${pill ? " is-on" : ""}`}
        aria-expanded={open}
        aria-controls="toc-sheet"
        tabIndex={pill ? 0 : -1}
        onClick={() => setOpen(true)}
      >
        <List size={15} strokeWidth={1.8} aria-hidden />
        Contents
        <span className="t-num">
          {Math.max(1, active + 1)} / {items.length}
        </span>
      </button>
      {open && (
        <div className="toc-sheet" id="toc-sheet" role="dialog" aria-modal="true" aria-label="Contents">
          <button type="button" className="toc-sheet__scrim" aria-label="Close contents" onClick={() => setOpen(false)} />
          <nav className="toc-sheet__panel" data-toc-sheet>
            <div className="toc-sheet__head">
              <p className="t-label">Contents</p>
              <button type="button" className="icon-btn" aria-label="Close contents" onClick={() => setOpen(false)} autoFocus>
                <X size={18} strokeWidth={1.6} />
              </button>
            </div>
            <ol>
              {items.map((it, i) => (
                <li key={it.id}>
                  <a href={`#${it.id}`} aria-current={i === active ? "location" : undefined} onClick={() => setOpen(false)}>
                    <span className="t-num">{String(i + 1).padStart(2, "0")}</span>
                    {it.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}
    </>
  );
}
