"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LOGO_MONOGRAM } from "@/components/brand/logo-paths";

/**
 * Page transitions and site-wide micro-interactions.
 *
 * Curtain: clicking an internal link draws a sheet of ink up over the page with the ribbon N
 * traced across it; the new page is fetched behind it, then the sheet lifts away from the top
 * and the page's opening lines rise in. Back/forward navigation gets the lift only. Modified
 * clicks, new tabs, downloads, hash links and reduced motion are left alone.
 *
 * Micro-interactions, delegated from the document so every page gets them:
 *   - cards and buttons follow the pointer with a soft light (--sx/--sy) and cards tilt a little
 *   - buttons leave an ink drop where they were pressed
 *   - sections below the fold rise in once as they enter the viewport
 */
export function Transitions() {
  const router = useRouter();
  const path = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const first = useRef(true);

  // Lift the curtain whenever the route changes (and on back/forward).
  useEffect(() => {
    const el = curtain.current;
    if (first.current) {
      first.current = false;
      return;
    }
    if (!el) return;
    scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    el.classList.remove("is-covering");
    el.classList.add("is-lifting");
    document.documentElement.classList.add("page-enter");
    const t = setTimeout(() => {
      el.classList.remove("is-lifting");
      document.documentElement.classList.remove("page-enter");
      busy.current = false;
    }, 900);
    return () => clearTimeout(t);
  }, [path]);

  // Cover on internal link clicks, then navigate ourselves once the sheet is down.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.noCurtain !== undefined) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return; // same page (hash links, the current page)
      if (/\.(xml|json|txt|apk|png|webp|svg|pdf)$/.test(url.pathname) || url.pathname.startsWith("/api/")) return;
      if (document.documentElement.classList.contains("reduced")) return;
      const el = curtain.current;
      if (!el || busy.current) return;
      e.preventDefault();
      busy.current = true;
      router.prefetch(url.pathname + url.search);
      el.classList.remove("is-lifting");
      el.classList.add("is-covering");
      setTimeout(() => router.push(url.pathname + url.search + url.hash), 560);
      // Never leave a visitor stuck behind the sheet.
      setTimeout(() => {
        if (el.classList.contains("is-covering")) {
          el.classList.remove("is-covering");
          busy.current = false;
        }
      }, 6000);
    };
    // Capture phase: runs before Next's <Link> handler, which then sees defaultPrevented and stands down.
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router]);

  // Pointer light + tilt on cards and buttons; ink drop on press.
  useEffect(() => {
    const fine = matchMedia("(pointer: fine)").matches;
    let lit: HTMLElement | null = null;
    const SEL = ".card, .btn, .chip, .why__card";
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(SEL) as HTMLElement | null;
      if (lit && lit !== el) {
        lit.classList.remove("is-lit");
        lit.style.removeProperty("--rx");
        lit.style.removeProperty("--ry");
        lit = null;
      }
      if (!el || !fine) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.style.setProperty("--sx", `${x}px`);
      el.style.setProperty("--sy", `${y}px`);
      if (el.classList.contains("card") && !el.closest(".no-tilt") && r.width < 900) {
        el.style.setProperty("--rx", `${((y / r.height) * 2 - 1) * -3}deg`);
        el.style.setProperty("--ry", `${((x / r.width) * 2 - 1) * 4}deg`);
      }
      el.classList.add("is-lit");
      lit = el;
    };
    const onDown = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(".btn, .chip") as HTMLElement | null;
      if (!el || document.documentElement.classList.contains("reduced")) return;
      const r = el.getBoundingClientRect();
      const drop = document.createElement("span");
      drop.className = "ink-drop";
      drop.style.left = `${e.clientX - r.left}px`;
      drop.style.top = `${e.clientY - r.top}px`;
      el.appendChild(drop);
      drop.addEventListener("animationend", () => drop.remove(), { once: true });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  // Reveal on scroll for inner pages: only blocks that start below the fold, so nothing visible
  // ever blinks out; without JS or with reduced motion everything is simply there.
  useEffect(() => {
    if (document.documentElement.classList.contains("reduced") || document.querySelector("[data-act]")) return;
    const blocks = [...document.querySelectorAll<HTMLElement>("main > section, main > article > *, main .reveal-me, main section > *")].filter(
      (el) => el.getBoundingClientRect().top > innerHeight * 0.95 && !el.closest("[data-no-reveal]"),
    );
    blocks.forEach((el) => el.setAttribute("data-reveal", ""));
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    blocks.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);

  const { d, w, h } = LOGO_MONOGRAM;
  return (
    <div ref={curtain} className="curtain" aria-hidden="true">
      <div className="curtain__sheet" />
      <svg className="curtain__mark" viewBox={`0 0 ${w} ${h}`}>
        <path d={d} fillRule="evenodd" pathLength={1} />
      </svg>
    </div>
  );
}
