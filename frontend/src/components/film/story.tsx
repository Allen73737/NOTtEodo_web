"use client";

import { useEffect, useRef, useState } from "react";
import { ViewStyleGlyph } from "@/components/brand/ViewStyleGlyph";
import { haptic, play } from "@/lib/sound";
import { InkStrike } from "@/motion/primitives";
import { switchView, toggleTheme } from "@/motion/theme-wash";
import { useView } from "@/lib/prefs";
import { journey, useFilmMode } from "./FilmProvider";

/* ------------------------------------------------------------ drag to turn */

/** A watch crown for the 3D phone: drag (or use the arrow keys) to turn it; it settles back when you let go. */
export function SpinPad() {
  const mode = useFilmMode();
  const [deg, setDeg] = useState(0);
  if (mode !== "full") return null;
  const release = () => {
    journey.dragging = false;
    setDeg(0);
    play("tick");
  };
  return (
    <label className="spinpad">
      <span className="t-label">Turn the phone</span>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={deg}
        className="spinpad__range"
        onPointerDown={() => (journey.dragging = true)}
        onPointerUp={release}
        onKeyUp={release}
        onBlur={release}
        onChange={(e) => {
          const v = Number(e.target.value);
          journey.dragging = true;
          journey.spin = (v * Math.PI) / 180;
          if (Math.abs(v - deg) >= 15) haptic(6);
          setDeg(v);
        }}
      />
    </label>
  );
}

/** The Aa pill, big: switches this whole site between Cards and Editorial, and relights it. */
export function ViewSwitch() {
  const view = useView();
  return (
    <div className="viewswitch">
      <div className="seg" role="group" aria-label="View">
        {(["cards", "editorial"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => {
              if (view === v) return;
              play("paper");
              haptic(12);
              switchView(v);
            }}
          >
            <ViewStyleGlyph editorial={v === "editorial"} size={16} />
            <span>{v === "cards" ? "Cards" : "Editorial"}</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-ghost" onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}>
        Day / night
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ tick tasks */

/** Tap a task to finish it: the ink line draws through, as in the app. Tap again to bring it back. */
export function TaskTicker({ items }: { items: string[] }) {
  const [done, setDone] = useState<boolean[]>(items.map(() => false));
  const left = done.filter((d) => !d).length;
  return (
    <div className="ticker">
      <ul className="ticker__list">
        {items.map((t, i) => (
          <li key={t}>
            <button
              type="button"
              className="ticker__item"
              aria-pressed={done[i]}
              onClick={() => {
                setDone((d) => d.map((x, j) => (j === i ? !x : x)));
                if (!done[i]) {
                  play("tick");
                  haptic(10);
                }
              }}
            >
              <span className="ticker__box" aria-hidden="true" />
              <InkStrike struck={done[i]}>{t}</InkStrike>
            </button>
          </li>
        ))}
      </ul>
      <p className="t-label" aria-live="polite">
        {left === 0 ? "All done. The day is yours." : `${left} left today · tap to finish one`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ focus dial */

const PRESETS = [15, 25, 45, 60, 90];

/** A working miniature of the Focus Dial. A session here runs in seconds instead of minutes. */
export function FocusDial() {
  const [mins, setMins] = useState(25);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null) return;
    if (left <= 0) {
      play("drop");
      haptic(30);
      const t = setTimeout(() => setLeft(null), 1600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLeft((l) => (l === null ? null : l - 1)), 100);
    return () => clearTimeout(t);
  }, [left]);
  const total = mins * 10;
  const p = left === null ? 0 : 1 - left / total;
  const shown = left === null ? mins : Math.ceil(left / 10);
  return (
    <div className="dial">
      <div className="dial__face" style={{ ["--p" as string]: p }}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="52" className="dial__track" pathLength={60} />
          <circle cx="60" cy="60" r="52" className="dial__bar" pathLength={1} />
        </svg>
        <p className="dial__time t-num" aria-live="polite">
          {left !== null && left <= 0 ? "Done" : shown}
          {(left === null || left > 0) && <small> min</small>}
        </p>
      </div>
      <div className="dial__controls">
        <div className="seg seg--small" role="group" aria-label="Session length">
          {PRESETS.map((m) => (
            <button key={m} type="button" aria-pressed={mins === m} disabled={left !== null} onClick={() => (setMins(m), play("tick"))}>
              {m}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => (left === null ? (setLeft(total), play("drop")) : setLeft(null))}>
          {left === null ? "Start focus" : "Stop"}
        </button>
        <p className="t-label">A demo: one minute here passes in a second.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ spend slider */

/** "Safe to spend today": what's left of the month's budget, shared across the days left. */
export function SpendSlider() {
  const [budget, setBudget] = useState(25000);
  const spent = 11860;
  const day = 14;
  const days = 30;
  const safe = Math.max(0, Math.round((budget - spent) / (days - day + 1)));
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  return (
    <div className="spend card pad">
      <p className="t-eyebrow">Safe to spend today</p>
      <p className="spend__n t-num">{fmt(safe)}</p>
      <label className="spend__label t-label" htmlFor="budget">
        Monthly budget: <strong>{fmt(budget)}</strong>
      </label>
      <input id="budget" type="range" min={12000} max={60000} step={500} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="spend__range" />
      <p className="t-label">
        Example: {fmt(spent)} spent by day {day} of {days}.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ hold to seal */

/** Press and hold to close the day, as with the app's wax check-in seal. */
export function HoldSeal() {
  const [hold, setHold] = useState(0);
  const [sealed, setSealed] = useState(false);
  const raf = useRef(0);
  const start = () => {
    if (sealed) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1100);
      setHold(p);
      if (p >= 1) {
        setSealed(true);
        play("wax");
        haptic(40);
      } else raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  const stop = () => {
    cancelAnimationFrame(raf.current);
    if (!sealed) setHold(0);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <div className="holdseal">
      <button
        type="button"
        className={`holdseal__btn${sealed ? " is-sealed" : ""}`}
        style={{ ["--h" as string]: hold }}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && start()}
        onKeyUp={stop}
        aria-label={sealed ? "Day sealed" : "Press and hold to seal the day"}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" pathLength={1} />
        </svg>
        <span>{sealed ? "Sealed" : "Hold"}</span>
      </button>
      <div>
        <p className="t-h3" style={{ margin: 0 }}>{sealed ? "Day 13. See you tomorrow." : "Press and hold to seal the day."}</p>
        <p className="t-label">{sealed ? "Your run grows by one." : "A run of 12 days so far"}</p>
        {sealed && (
          <button type="button" className="chip" onClick={() => (setSealed(false), setHold(0))}>
            Again
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ memories */

const MEMORIES = ["Prefers mornings for deep work", "Budget for food is ₹6,000", "Reading 10 pages a day", "Trip to Goa in December", "Vegetarian", "Calls mom on Sundays"];

/** Memories Nodo keeps, each one erasable. In the app they live in Settings → Nodo assistant. */
export function Memories() {
  const [kept, setKept] = useState(MEMORIES);
  return (
    <div className="memories">
      <p className="t-eyebrow">What Nodo remembers</p>
      <ul>
        {kept.map((m) => (
          <li key={m} className="memories__item">
            <span>{m}</span>
            <button
              type="button"
              aria-label={`Forget: ${m}`}
              onClick={(e) => {
                const li = (e.currentTarget as HTMLElement).closest("li");
                li?.classList.add("is-forgetting");
                play("paper");
                setTimeout(() => setKept((k) => k.filter((x) => x !== m)), 420);
              }}
            >
              Forget
            </button>
          </li>
        ))}
      </ul>
      {kept.length < MEMORIES.length && (
        <button type="button" className="chip" onClick={() => setKept(MEMORIES)}>
          Restore the examples
        </button>
      )}
    </div>
  );
}
