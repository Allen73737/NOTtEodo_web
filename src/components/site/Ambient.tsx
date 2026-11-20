"use client";

import { ArrowDownToLine, ArrowUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { haptic, play } from "@/lib/sound";

/**
 * Site-wide presences: scroll crown dial, back-to-top ink drop, ink tap ripples
 * (port of touch_aura), a context cursor for fine pointers, and the smart download pill.
 */
export function Ambient({ downloadHref, label }: { downloadHref: string; label: string }) {
  return (
    <>
      <CrownDial />
      <TouchAura />
      <Cursor />
      <DownloadPill href={downloadHref} label={label} />
    </>
  );
}

/** Scroll progress drawn as a watch crown's dial; doubles as back-to-top. */
function CrownDial() {
  const ref = useRef<SVGCircleElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        const p = max > 0 ? scrollY / max : 0;
        ref.current?.style.setProperty("stroke-dashoffset", String(1 - p));
        setShow(scrollY > innerHeight * 0.8);
      });
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <button
      type="button"
      className={`crown no-print${show ? " is-on" : ""}`}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      onClick={() => {
        play("drop");
        haptic();
        const reduced = document.documentElement.classList.contains("reduced");
        scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      }}
    >
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="19" className="crown__track" />
        <circle cx="22" cy="22" r="19" pathLength={1} className="crown__bar" ref={ref} />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="22" y1="5.5" x2="22" y2={i % 3 === 0 ? 9 : 7.5} transform={`rotate(${i * 30} 22 22)`} />
        ))}
      </svg>
      <ArrowUp size={14} strokeWidth={2} aria-hidden />
    </button>
  );
}

/** Port of touch_aura.dart: a fine ink ring at each press, for touch and pen. */
function TouchAura() {
  useEffect(() => {
    if (document.documentElement.classList.contains("reduced")) return;
    const on = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const el = document.createElement("span");
      el.className = "aura";
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      document.body.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
      if (document.querySelectorAll(".aura").length > 6) document.querySelector(".aura")?.remove();
    };
    addEventListener("pointerdown", on, { passive: true });
    return () => removeEventListener("pointerdown", on);
  }, []);
  return null;
}

/** Context cursor for fine pointers: reads data-cursor="Open|Drag|Play|Download" from the hovered element. */
function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (document.documentElement.classList.contains("reduced")) return;
    document.documentElement.classList.add("has-cursor");
    let x = innerWidth / 2,
      y = innerHeight / 2,
      cx = x,
      cy = y,
      raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      setLabel(t?.dataset.cursor ?? "");
      const hot = (e.target as HTMLElement | null)?.closest("a,button,[role=button],input,textarea,select,summary");
      dot.current?.classList.toggle("is-hot", Boolean(hot));
    };
    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      if (dot.current) dot.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);
  return (
    <div ref={dot} className={`cursor${label ? " has-label" : ""}`} aria-hidden="true">
      <span>{label}</span>
    </div>
  );
}

/**
 * Smart download pill. It appears after the hero, hides while an immersive chapter
 * ([data-immersive]) fills the screen or the page's own CTA is visible, and can be dismissed.
 */
function DownloadPill({ href, label }: { href: string; label: string }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const path = usePathname();
  useEffect(() => {
    const blockers = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => (en.isIntersecting ? blockers.add(en.target) : blockers.delete(en.target)));
        update();
      },
      { threshold: 0.35 },
    );
    const update = () => setVisible(scrollY > innerHeight * 0.9 && blockers.size === 0);
    document.querySelectorAll("[data-immersive], .dl-cta").forEach((el) => io.observe(el));
    addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      io.disconnect();
      removeEventListener("scroll", update);
    };
  }, [path]);
  if (dismissed || path?.startsWith("/admin") || path?.startsWith("/download")) return null;
  return (
    <div className={`pill no-print${visible ? " is-on" : ""}`} aria-hidden={!visible}>
      <a href={href} className="pill__go" tabIndex={visible ? 0 : -1} data-cursor="Download">
        <ArrowDownToLine size={16} strokeWidth={2} aria-hidden />
        {label}
      </a>
      <button
        type="button"
        className="pill__x"
        aria-label="Hide download button"
        tabIndex={visible ? 0 : -1}
        onClick={() => setDismissed(true)}
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
