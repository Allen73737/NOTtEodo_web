"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { Screenshot } from "@/components/shots/Screenshot";
import { modulesFor, personas, type Module } from "@/content/site";
import { parseCapture, type Parsed } from "@/lib/capture";
import { useView, usePersona, type Persona } from "@/lib/prefs";
import { answer } from "@/lib/search/guide";
import { haptic, play } from "@/lib/sound";
import { InkStrike } from "@/motion/primitives";
import { switchView, toggleTheme } from "@/motion/theme-wash";
import { InkField } from "@/three/InkField";
import { useFilmMode, progress } from "./FilmProvider";

/** Reads this chapter's scroll progress (0..1) every frame. */
export function useChapterProgress(id: string) {
  const [p, setP] = useState(0);
  const mode = useFilmMode();
  useEffect(() => {
    if (mode === "reduced") return setP(1);
    let raf = 0;
    let last = -1;
    const loop = () => {
      const v = progress.get(id) ?? 0;
      if (Math.abs(v - last) > 0.002) {
        last = v;
        setP(v);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [id, mode]);
  return p;
}
const band = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));

/* ------------------------------------------------------------- preloader */

/** Wordmark and ribbon N draw themselves; a lost-wax bar shows real load progress. Once per session, ≤2.2 s, skippable. */
export function Preloader() {
  const [show, setShow] = useState(false);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (document.documentElement.classList.contains("reduced")) return;
    try {
      if (sessionStorage.getItem("nt-preloaded")) return;
      sessionStorage.setItem("nt-preloaded", "1");
    } catch {
      return;
    }
    setShow(true);
    const started = performance.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setPct(100);
      setTimeout(() => setShow(false), 380);
    };
    const tick = () => {
      if (done) return;
      const imgs = [...document.images];
      const loaded = imgs.filter((i) => i.complete).length / Math.max(1, imgs.length);
      const fonts = document.fonts.status === "loaded" ? 1 : 0.4;
      setPct(Math.round(Math.min(98, (loaded * 0.6 + fonts * 0.4) * 100)));
      if (performance.now() - started > 2200 || (loaded > 0.9 && fonts === 1 && performance.now() - started > 1400)) finish();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const skip = (e: KeyboardEvent | PointerEvent) => {
      if (e.type === "pointerdown" || (e as KeyboardEvent).key === "Escape") finish();
    };
    addEventListener("keydown", skip);
    addEventListener("pointerdown", skip);
    return () => {
      removeEventListener("keydown", skip);
      removeEventListener("pointerdown", skip);
    };
  }, []);
  if (!show) return null;
  return (
    <div className={`preloader${pct >= 100 ? " is-done" : ""}`} role="status" aria-label="Loading">
      <Monogram size={88} draw className="preloader__mark" />
      <Wordmark variant="stroke" className="preloader__word" />
      <div className="preloader__bar" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="t-label">Press Esc to skip</p>
    </div>
  );
}

/* ------------------------------------------------------------- ink hero */

export function HeroInk() {
  const mode = useFilmMode();
  return mode === "full" ? <InkField className="hero__ink" /> : <div className="hero__ink hero__ink--still" aria-hidden="true" />;
}

/* ------------------------------------------------------------ chapter rail */

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII"];
export function ChapterRail({ chapters }: { chapters: { id: string; label: string }[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(chapters.findIndex((c) => c.id === (e.target as HTMLElement).dataset.chapter))),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    chapters.forEach((c) => {
      const el = document.querySelector(`[data-chapter="${c.id}"]`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [chapters]);
  return (
    <nav className="rail no-print" aria-label="Chapters">
      {chapters.map((c, i) => (
        <a key={c.id} href={`#${c.id}`} aria-current={i === active ? "true" : undefined} title={c.label}>
          <span className="rail__num">{NUMERALS[i]}</span>
          <span className="rail__label">{c.label}</span>
        </a>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------- Aa moment */

/** Drag the handle across the phone: Cards view on one side, Editorial on the other. Let go past halfway and the whole site follows. */
export function AaWipe() {
  const view = useView();
  const [x, setX] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const move = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setX(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  const release = () => {
    drag.current = false;
    const next = x < 50 ? "editorial" : "cards";
    if (next !== view) {
      play("paper");
      haptic(12);
      switchView(next);
    }
    setX(50);
  };
  return (
    <div className="aa">
      <div
        ref={box}
        className="aa__phone"
        onPointerDown={(e) => {
          drag.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          move(e.clientX);
        }}
        onPointerMove={(e) => drag.current && move(e.clientX)}
        onPointerUp={release}
        onPointerCancel={release}
        data-cursor="Drag"
      >
        <div className="aa__layer aa__layer--editorial">
          <Screenshot screen="expenses" frame={false} className="aa__shot" sizes="360px" priority />
          <span className="aa__tag">Editorial</span>
        </div>
        <div className="aa__layer aa__layer--cards" style={{ clipPath: `inset(0 0 0 ${100 - x}%)` }}>
          <Screenshot screen="expenses-nodo" frame={false} className="aa__shot aa__shot--cards" sizes="360px" priority />
          <span className="aa__tag aa__tag--right">Cards</span>
        </div>
        <div className="aa__handle" style={{ left: `${Math.min(92, Math.max(8, 100 - x))}%` }} aria-hidden="true">
          <span>Aa</span>
        </div>
      </div>
      <div className="row" style={{ justifyContent: "center" }}>
        <button className="btn btn-ghost" onClick={() => switchView(view === "cards" ? "editorial" : "cards")}>
          Switch to {view === "cards" ? "Editorial" : "Cards"} view
        </button>
        <button className="btn btn-ghost" onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}>
          Relight the page
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the deal */

export function Deal() {
  const [persona] = usePersona();
  const list = modulesFor(persona).slice(0, 14);
  const p = useChapterProgress("deal");
  return (
    <ul className="deal" style={{ ["--deal" as string]: band(p, 0.15, 0.5) }}>
      {list.map((m, i) => (
        <li key={m.slug} style={{ ["--i" as string]: i, ["--n" as string]: list.length }}>
          <Link href={`/features/${m.slug}`} className="deal__card card sheen" data-cursor="Open">
            <span className="t-label">{String(i + 1).padStart(2, "0")}</span>
            <span className="deal__name">{m.name}</span>
            <span className="deal__line it">{m.line}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- capture */

const SAMPLES = ["Dinner with Asha friday 8pm", "coffee with Asha ₹240", "call mom tomorrow 5pm", "ideas: deckled paper, oxblood wax"];
export function CaptureDemo() {
  const [text, setText] = useState(SAMPLES[0]!);
  const [items, setItems] = useState<(Parsed & { key: number })[]>([]);
  const parsed = parseCapture(text);
  return (
    <div className="capture">
      <form
        className="capture__bar card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setItems((xs) => [{ ...parseCapture(text), key: Date.now() }, ...xs].slice(0, 4));
          play("drop");
          haptic();
          setText(SAMPLES[(SAMPLES.indexOf(text) + 1) % SAMPLES.length] ?? "");
        }}
      >
        <label className="sr-only" htmlFor="cap">Type one line</label>
        <input id="cap" className="input" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
        <button className="btn">Capture</button>
      </form>
      <p className="t-label" aria-live="polite">
        Becomes a <strong className="acc">{parsed.kind}</strong>
        {parsed.amount ? ` · ₹${parsed.amount.toLocaleString("en-IN")} · ${parsed.category}` : ""}
        {parsed.when ? ` · ${parsed.when}` : ""}
      </p>
      <div className="capture__tiles">
        {(["task", "note", "expense", "event"] as const).map((k) => (
          <div key={k} className="capture__tile card">
            <p className="t-eyebrow">{k}s</p>
            {items
              .filter((x) => x.kind === k)
              .map((x) => (
                <p key={x.key} className="capture__item">
                  {x.title}
                  {x.amount ? ` · ₹${x.amount}` : ""}
                </p>
              ))}
          </div>
        ))}
      </div>
      <p className="t-label">A simplified demo of the app&rsquo;s Quick Capture. Nothing you type leaves this page.</p>
    </div>
  );
}

/* ------------------------------------------------------------------- plan */

export function StrikeList({ items, chapter }: { items: string[]; chapter: string }) {
  const p = useChapterProgress(chapter);
  return (
    <ul className="strike-list">
      {items.map((t, i) => (
        <li key={t}>
          <span className="strike-list__box" data-done={band(p, 0.3 + i * 0.1, 0.38 + i * 0.1) >= 1} />
          <InkStrike progress={band(p, 0.3 + i * 0.1, 0.38 + i * 0.1)}>{t}</InkStrike>
        </li>
      ))}
    </ul>
  );
}

/** The streak calendar filling day by day as the chapter scrolls (an illustration of the app's month view). */
export function StreakFill() {
  const p = useChapterProgress("rhythm");
  const days = 28;
  const filled = Math.round(band(p, 0.3, 0.75) * 21);
  return (
    <div className="streak" aria-label="Illustration: a month of the day streak filling in">
      {Array.from({ length: days }, (_, i) => (
        <span key={i} className={i < filled ? "is-on" : i === 9 ? "is-freeze" : ""} />
      ))}
      <p className="streak__n t-num">{filled}<small> days</small></p>
    </div>
  );
}

/* --------------------------------------------------------------- money */

const LEDGER = [
  ["Groceries", "Food & Dining", "₹1,240"],
  ["Metro card", "Transport", "₹500"],
  ["Music", "Subscriptions", "₹119"],
  ["Book: Kinfolk", "Education", "₹899"],
];
export function Letterpress() {
  const p = useChapterProgress("money");
  return (
    <ol className="press" aria-label="Illustration: an expense ledger set as letterpress type">
      {LEDGER.map(([a, b, c], i) => (
        <li key={a} style={{ ["--k" as string]: band(p, 0.25 + i * 0.07, 0.4 + i * 0.07) }}>
          <span className="press__name">{a}</span>
          <span className="t-label">{b}</span>
          <span className="t-num">{c}</span>
        </li>
      ))}
    </ol>
  );
}

/* ---------------------------------------------------------------- nodo */

export function AskNodo() {
  const [q, setQ] = useState("");
  const [log, setLog] = useState<{ q: string; a: string; src?: { id: string; title: string } }[]>([]);
  const suggestions = ["How do I add a widget?", "Can I use it without an account?", "How do I delete my account?"];
  const ask = (question: string) => {
    if (!question.trim()) return;
    const r = answer(question);
    setLog((l) => [...l, { q: question, a: r.text, src: r.source }].slice(-3));
    setQ("");
    play("tick");
  };
  return (
    <div className="ask card pad">
      <p className="t-eyebrow">Ask Nodo about NOTtEodo</p>
      <div className="ask__log" aria-live="polite">
        {log.length === 0 && <p className="muted">Answers come from the app&rsquo;s own guide, right here in your browser. Nothing is sent anywhere.</p>}
        {log.map((x, i) => (
          <div key={i} className="stack" style={{ gap: 6 }}>
            <p className="ask__q">{x.q}</p>
            <p className="ask__a">{x.a}</p>
            {x.src && (
              <Link className="chip" href={`/help/${x.src.id}`}>
                From the guide: {x.src.title}
              </Link>
            )}
          </div>
        ))}
      </div>
      <div className="row">
        {suggestions.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => ask(s)}>
            {s}
          </button>
        ))}
      </div>
      <form
        className="row"
        style={{ flexWrap: "nowrap" }}
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <label className="sr-only" htmlFor="ask-q">Ask a question about the app</label>
        <input id="ask-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask how to do something" autoComplete="off" />
        <button className="btn">Ask</button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------- strike board */

export function StrikeBoard() {
  const p = useChapterProgress("free");
  const words = ["Ads.", "Trackers.", "Data brokers."];
  const after = band(p, 0.62, 0.72);
  return (
    <div className="board">
      {words.map((w, i) => (
        <p key={w} className="t-display board__word">
          <InkStrike progress={band(p, 0.28 + i * 0.1, 0.38 + i * 0.1)}>{w}</InkStrike>
        </p>
      ))}
      <p className="t-display it board__after" style={{ opacity: after, transform: `translateY(${(1 - after) * 20}px)` }}>
        Not here.
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- persona */

export function PersonaPicker() {
  const [persona, setPersona] = usePersona();
  return (
    <div className="persona" role="group" aria-label="Start where you are">
      {personas.map((p) => (
        <button
          key={p.slug}
          type="button"
          className="chip"
          aria-pressed={persona === p.slug}
          onClick={() => {
            setPersona(persona === p.slug ? null : (p.slug as Persona));
            play("tick");
          }}
        >
          {p.name}
        </button>
      ))}
      <p className="t-label" style={{ margin: 0, width: "100%" }}>
        Re-orders the tour for you. Kept only in this browser.
      </p>
    </div>
  );
}

export function PersonaLede() {
  const [persona] = usePersona();
  const p = personas.find((x) => x.slug === persona);
  return p ? (
    <p className="t-lede" aria-live="polite">
      <span className="it">{p.line}</span> {p.lede}
    </p>
  ) : null;
}

export type { Module };
