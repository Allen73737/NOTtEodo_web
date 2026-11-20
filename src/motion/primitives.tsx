"use client";

/**
 * Ports of NOTtEodo's Flutter motion primitives (frontend/lib/core/motion). Durations and
 * curves come from the generated tokens, so the site and the app share one rhythm.
 * Every primitive renders its final state for reduced motion and without JS.
 */
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";
import { motion as T } from "@/content/generated/tokens";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function isReduced() {
  return typeof document === "undefined" || document.documentElement.classList.contains("reduced");
}

/** Fires once when the element is first seen. */
export function useInView<T extends Element>(opts: IntersectionObserverInit = { threshold: 0.2 }) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setSeen(true);
    const io = new IntersectionObserver((en) => {
      if (en.some((e) => e.isIntersecting)) {
        setSeen(true);
        io.disconnect();
      }
    }, opts);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, seen] as const;
}

/* ------------------------------------------------------------------ reveal */

/**
 * reveal.dart: children rise into place with a slight scale on `silk`, staggered by
 * 55 ms and capped at 520 ms. Content is visible without JS (CSS handles html.no-js).
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  style,
  stagger = true,
  delay = 0,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  stagger?: boolean;
  delay?: number;
}) {
  const [ref, seen] = useInView<HTMLElement>({ threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  const cap = Math.floor(T.duration.staggerCap / T.duration.staggerStep);
  let i = 0;
  return (
    <Tag ref={ref} className={className} style={style}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        const index = stagger ? Math.min(i++, cap) : 0;
        const el = child as ReactElement<{ className?: string; style?: CSSProperties; "data-reveal"?: string }>;
        return cloneElement(el, {
          "data-reveal": "",
          className: [el.props.className, seen ? "is-in" : ""].filter(Boolean).join(" "),
          style: { ...el.props.style, ["--i" as string]: index + delay },
        });
      })}
    </Tag>
  );
}

/* ------------------------------------------------------------ kinetic text */

/** kinetic_text.dart: words flip up on a perspective hinge, clearing from blur, once. */
export function KineticText({
  text,
  as: Tag = "span",
  className,
  italicWords = [],
  start = "view",
}: {
  text: string;
  as?: ElementType;
  className?: string;
  italicWords?: string[];
  start?: "view" | "mount";
}) {
  const [ref, seen] = useInView<HTMLElement>({ threshold: 0.3 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const go = start === "mount" ? mounted : seen;
  const words = text.split(" ");
  return (
    <Tag ref={ref} className={`kinetic ${go ? "is-in" : ""} ${className ?? ""}`} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="kinetic__mask" aria-hidden="true">
            <span
              className={`kinetic__w ${italicWords.includes(w) || italicWords.includes(w.replace(/[.,]/g, "")) ? "it" : ""}`}
              style={{ ["--i" as string]: i }}
            >
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}

/* --------------------------------------------------------------- ink strike */

/**
 * ink_strike.dart: an ink line draws across the text left to right, rising a touch as it
 * goes, like a pen stroke (460 ms, cubic 0.45 0 0.2 1). `progress` (0..1) scrubs it by scroll.
 */
export function InkStrike({
  children,
  struck,
  progress,
  className,
}: {
  children: ReactNode;
  struck?: boolean;
  progress?: number;
  className?: string;
}) {
  const scrub = typeof progress === "number";
  return (
    <span className={`ink-strike ${struck ? "is-struck" : ""} ${scrub ? "is-scrub" : ""} ${className ?? ""}`}>
      {children}
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M1 6.4 C 18 6.9, 34 5.6, 52 5.2 S 86 4.1, 99 3.4"
          pathLength={1}
          style={scrub ? { strokeDashoffset: 1 - Math.max(0, Math.min(1, progress)) } : undefined}
        />
      </svg>
    </span>
  );
}

/* ----------------------------------------------------------------- count up */

/** Scales the first number in [text] by t, keeping currency, words, decimals and grouping (count_up.dart). */
export function scaleNumberIn(text: string, t: number): string {
  const m = /-?[\d,]*\.?\d+/.exec(text);
  if (!m) return text;
  const raw = m[0];
  const decimals = raw.includes(".") ? raw.split(".")[1]!.length : 0;
  const value = Number(raw.replace(/,/g, "")) * t;
  const grouped = raw.includes(",");
  const indian = /\d{1,2},\d{2},\d{3}/.test(raw);
  const formatted = grouped
    ? value.toLocaleString(indian ? "en-IN" : "en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : value.toFixed(decimals);
  return text.slice(0, m.index) + formatted + text.slice(m.index + raw.length);
}

export function CountUp({ text, className }: { text: string; className?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>({ threshold: 0.5 });
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (!seen) return;
    if (isReduced()) return setShown(text);
    let raf = 0;
    const t0 = performance.now() + T.duration.countUpDelay;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const tick = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - t0) / T.duration.countUp));
      setShown(scaleNumberIn(text, ease(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, text]);
  return (
    <span ref={ref} className={`t-num ${className ?? ""}`} aria-label={text}>
      <span aria-hidden="true">{seen ? shown : text}</span>
    </span>
  );
}

/* ------------------------------------------------------------- rolling text */

/** rolling_text.dart: digits roll like an odometer when the value changes; other characters crossfade. */
export function RollingText({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`rolling t-num ${className ?? ""}`} aria-label={value} role="text">
      {value.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="rolling__col" aria-hidden="true">
            <span className="rolling__strip" style={{ transform: `translateY(${-Number(ch) * 10}%)` }}>
              {"0123456789".split("").map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden="true">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

/* ------------------------------------------------------- sheen + edge light */

/**
 * touch_sheen.dart + edge_light.dart: a soft bloom opens under the pointer and follows it,
 * and the rim brightens to a hairline. Nothing tilts. Light drains slowly on release.
 */
export function Sheen({ children, className, as: Tag = "div", ...rest }: { children: ReactNode; className?: string; as?: ElementType } & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--sx", `${e.clientX - r.left}px`);
      el.style.setProperty("--sy", `${e.clientY - r.top}px`);
    };
    const on = () => el.classList.add("is-lit");
    const off = () => el.classList.remove("is-lit");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerenter", on);
    el.addEventListener("pointerleave", off);
    el.addEventListener("pointercancel", off);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", on);
      el.removeEventListener("pointerleave", off);
      el.removeEventListener("pointercancel", off);
    };
  }, []);
  return (
    <Tag ref={ref} className={`sheen ${className ?? ""}`} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- magnetic */

/** Buttons lean toward a fine pointer within their radius. */
export function Magnetic({ children, strength = 0.28 }: { children: ReactElement; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(pointer: fine)").matches || isReduced()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      const btn = el.firstElementChild as HTMLElement | null;
      btn?.style.setProperty("--mx", `${e.clientX - r.left}px`);
      btn?.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const leave = () => (el.style.transform = "");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return (
    <span ref={ref} className="magnetic">
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- scramble */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·";
/** Decode effect for technical labels (Space Grotesk only). */
export function Scramble({ text, className }: { text: string; className?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const [out, setOut] = useState(text);
  useIso(() => {
    if (!seen || isReduced()) return;
    let frame = 0;
    const total = 22;
    const id = setInterval(() => {
      frame++;
      setOut(
        text
          .split("")
          .map((c, i) => (c === " " || i < (frame / total) * text.length ? c : GLYPHS[(i * 7 + frame * 3) % GLYPHS.length]))
          .join(""),
      );
      if (frame >= total) {
        clearInterval(id);
        setOut(text);
      }
    }, 34);
    return () => clearInterval(id);
  }, [seen, text]);
  return (
    <span ref={ref} className={`scramble ${className ?? ""}`} aria-label={text}>
      <span aria-hidden="true">{out}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ marquee */

/** Module-name ribbon whose speed follows scroll velocity. Pauses for reduced motion. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = track.current;
    if (!el || isReduced()) return;
    let x = 0,
      last = scrollY,
      v = 0,
      raf = 0,
      visible = true;
    const io = new IntersectionObserver(([e]) => (visible = Boolean(e?.isIntersecting)));
    io.observe(el);
    const loop = () => {
      const dy = scrollY - last;
      last = scrollY;
      v += (dy * 0.12 - v) * 0.1;
      if (visible) {
        x -= 0.6 + Math.abs(v);
        const w = el.scrollWidth / 2;
        if (-x > w) x += w;
        el.style.transform = `translate3d(${x}px,0,0) skewX(${Math.max(-8, Math.min(8, -v * 0.6))}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);
  const row = [...items, ...items];
  return (
    <div className={`marquee ${className ?? ""}`} aria-hidden="true">
      <div className="marquee__track" ref={track}>
        {row.map((t, i) => (
          <span key={i}>
            {t}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ card peek */

/**
 * card_peek.dart + edge_light charge: press and hold a card (450 ms) and a larger copy lifts
 * toward the centre while the page blurs. Release or Esc settles it back.
 */
export function useHoldToPeek(onPeek: () => void, ms = 450) {
  const timer = useRef<number | null>(null);
  const ref = useRef<HTMLElement | null>(null);
  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    ref.current?.classList.remove("is-charging");
  };
  return {
    ref,
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      ref.current = e.currentTarget;
      e.currentTarget.classList.add("is-charging");
      timer.current = window.setTimeout(() => {
        clear();
        onPeek();
      }, ms);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}
