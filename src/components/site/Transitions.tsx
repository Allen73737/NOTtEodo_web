"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LOGO_MONOGRAM } from "@/components/brand/logo-paths";
import { nav } from "@/content/site";
import { ambient, ambientEnergy, haptic, play, soundOn } from "@/lib/sound";

/** Keep in step with the curtain keyframes in editorial.css. */
const COVER_MS = 420;
const LIFT_MS = 640;

/** The destination's name, shown large on the sheet while it loads. */
function nameFor(pathname: string, text: string | null) {
  if (pathname === "/") return "Home";
  const n = nav.find((x) => pathname.startsWith(x.href));
  if (n) return n.label;
  const t = (text ?? "").trim();
  if (t && t.length < 28) return t;
  const seg = pathname.split("/").filter(Boolean).pop() ?? "";
  return seg.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/**
 * Page transitions and site-wide micro-interactions.
 *
 * Curtain: clicking an internal link starts the navigation at once and sweeps two sheets (wine,
 * then ink) up over the page with the destination's name and the ribbon N; as soon as the new
 * page is in and the sheet has covered (420 ms), it lifts away and the page's opening rises in. Back/forward navigation gets the lift only. Modified
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
  const label = useRef<HTMLParagraphElement>(null);
  /** When the current cover started (0 when no navigation is under way). */
  const coverAt = useRef(0);
  const lastPath = useRef(path);

  // The route changed: once the sheet has fully covered, lift it off the new page.
  useEffect(() => {
    const el = curtain.current;
    if (lastPath.current === path || !el) return;
    lastPath.current = path;
    const wait = coverAt.current ? Math.max(0, coverAt.current + COVER_MS - performance.now()) : 0;
    let t2: ReturnType<typeof setTimeout> | undefined;
    const t1 = setTimeout(() => {
      scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      el.classList.remove("is-covering");
      el.classList.add("is-lifting");
      document.documentElement.classList.add("page-enter");
      play("land");
      coverAt.current = 0;
      t2 = setTimeout(() => {
        el.classList.remove("is-lifting");
        document.documentElement.classList.remove("page-enter");
      }, LIFT_MS + 200);
    }, wait);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [path]);

  // Internal link clicks navigate at once; the sheet covers while the next page loads.
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
      if (!el) return;
      e.preventDefault();
      // Start loading straight away; the animation never delays the navigation.
      router.push(url.pathname + url.search + url.hash);
      if (label.current) label.current.textContent = nameFor(url.pathname, a.textContent);
      if (!coverAt.current) {
        coverAt.current = performance.now();
        el.classList.remove("is-lifting");
        el.classList.add("is-covering");
        play("whoosh");
      }
      // Never leave a visitor stuck behind the sheet.
      const started = coverAt.current;
      setTimeout(() => {
        if (coverAt.current === started && el.classList.contains("is-covering")) {
          el.classList.remove("is-covering");
          coverAt.current = 0;
        }
      }, 8000);
    };
    // Warm the next page as soon as a pointer heads for a link.
    const onIntent = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, location.href);
      if (url.origin === location.origin && url.pathname !== location.pathname && !url.pathname.startsWith("/api/")) router.prefetch(url.pathname);
    };
    // Once the page is idle, fetch the main pages ahead of time, so the first click is instant.
    const idle = (window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500))) as (f: () => void) => number;
    idle(() => ["/", ...nav.map((n) => n.href)].forEach((h) => h !== location.pathname && router.prefetch(h)));
    // Capture phase: runs before Next's <Link> handler, which then sees defaultPrevented and stands down.
    window.addEventListener("click", onClick, true);
    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("touchstart", onIntent, { passive: true });
    return () => {
      window.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("touchstart", onIntent);
    };
  }, [router]);

  // The ambient bed: browsers only allow audio after a gesture, so it starts on the first one
  // (if sound is on) and brightens a little while the page scrolls.
  useEffect(() => {
    const start = () => {
      if (soundOn()) ambient(true);
    };
    let last = scrollY;
    let energy = 0;
    let raf = 0;
    const tick = () => {
      energy = Math.max(Math.abs(scrollY - last) / 40, energy * 0.92);
      last = scrollY;
      ambientEnergy(energy);
      raf = energy > 0.01 ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => {
      if (!raf && soundOn()) raf = requestAnimationFrame(tick);
    };
    addEventListener("pointerdown", start, { once: true });
    addEventListener("keydown", start, { once: true });
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("pointerdown", start);
      removeEventListener("keydown", start);
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

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
      if (el !== lit) play("hover");
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
      const el = (e.target as Element | null)?.closest?.(".btn, .chip, .icon-btn, .nav__links a") as HTMLElement | null;
      if (!el) return;
      play("tap");
      haptic(6);
      if (document.documentElement.classList.contains("reduced") || !el.matches(".btn, .chip")) return;
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
      <div className="curtain__sheet curtain__sheet--wine" />
      <div className="curtain__sheet" />
      <div className="curtain__body">
        <svg className="curtain__mark" viewBox={`0 0 ${w} ${h}`}>
          <path d={d} fillRule="evenodd" pathLength={1} />
        </svg>
        <p ref={label} className="curtain__label" />
      </div>
    </div>
  );
}
