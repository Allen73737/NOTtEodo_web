"use client";

import { Wordmark } from "@/components/brand/Wordmark";
import {
  BookOpen,

  CircleCheck,
  Flame,
  Home,
  LayoutGrid,
  Menu,
  NotebookPen,
  Plane,
  Plus,
  Search,
  Sparkles,
  Sun,
  Moon,
  Timer,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { parseCapture, type Parsed } from "@/lib/capture";
import { useTheme, useView } from "@/lib/prefs";
import { answer } from "@/lib/search/guide";
import { haptic, play } from "@/lib/sound";
import { InkStrike } from "@/motion/primitives";
import { switchView, toggleTheme } from "@/motion/theme-wash";

/**
 * A working slice of NOTtEodo in the browser, recreated from the Flutter UI. Everything stays
 * in memory (and this tab's sessionStorage); nothing is sent anywhere. Follows the site's
 * theme and Cards/Editorial view, and is fully keyboard-operable.
 */
type Screen = "home" | "tasks" | "focus" | "nodo" | "expenses" | "notes";
type Task = { id: number; title: string; when?: string; done: boolean };
type State = { tasks: Task[]; notes: string[]; expenses: { title: string; amount: number; category: string }[]; streak: number; checkedIn: boolean };

const INITIAL: State = {
  tasks: [
    { id: 1, title: "Call the bank about the card", when: "Today", done: false },
    { id: 2, title: "Submit the lab report", when: "Fri", done: false },
    { id: 3, title: "Water the plants", done: true },
  ],
  notes: ["Ideas for the moodboard: deckled paper, oxblood wax", "Books to read this winter"],
  expenses: [{ title: "Groceries", amount: 1240, category: "Food & Dining" }],
  streak: 12,
  checkedIn: false,
};

/** The tour's steps (SimTour listens): each fires when the visitor first does the thing. */
export type TourStep = "capture" | "strike" | "dial" | "seal" | "flip";
function emit(step: TourStep) {
  window.dispatchEvent(new CustomEvent<TourStep>("nt:sim", { detail: step }));
}

function useSimState() {
  const [s, setS] = useState<State>(INITIAL);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("nt-sim");
      if (raw) setS(JSON.parse(raw));
    } catch {
      /* storage blocked */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem("nt-sim", JSON.stringify(s));
    } catch {
      /* storage blocked */
    }
  }, [s]);
  return [s, setS] as const;
}

const DOCK = {
  workspace: [
    { id: "home", label: "Home", Icon: Home },
    { id: "notes", label: "Notes", Icon: NotebookPen },
    { id: "tasks", label: "Tasks", Icon: CircleCheck },
    { id: "focus", label: "Focus", Icon: Timer },
  ],
  life: [
    { id: "expenses", label: "Expenses", Icon: Wallet },
    { id: "travel", label: "Travel", Icon: Plane },
    { id: "journal", label: "Journal", Icon: BookOpen },
    { id: "moodboard", label: "Moodboard", Icon: LayoutGrid },
  ],
} as const;

export function Simulator() {
  const [s, setS] = useSimState();
  const [screen, setScreen] = useState<Screen>("home");
  const [dockSet, setDockSet] = useState<"workspace" | "life">("workspace");
  const [capture, setCapture] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const theme = useTheme();
  const view = useView();

  const say = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2200);
  };

  // Tour steps that show in the state: a task struck, the seal pressed, the look switched.
  const done = s.tasks.filter((t) => t.done).length;
  const lastDone = useRef(done);
  useEffect(() => {
    if (done > lastDone.current) emit("strike");
    lastDone.current = done;
  }, [done]);
  useEffect(() => {
    if (s.checkedIn) emit("seal");
  }, [s.checkedIn]);
  const look = `${theme}/${view}`;
  const lastLook = useRef(look);
  useEffect(() => {
    if (look !== lastLook.current) emit("flip");
    lastLook.current = look;
  }, [look]);

  useEffect(() => {
    const onPreset = (e: Event) => {
      const detail = (e as CustomEvent<{ action: "capture" | "focus" | "tasks" | "seal" | "nodo"; text?: string }>).detail;
      if (!detail) return;
      if (detail.action === "capture") {
        setCapture(true);
      } else if (detail.action === "focus") {
        setCapture(false);
        setScreen("focus");
      } else if (detail.action === "tasks") {
        setCapture(false);
        setScreen("tasks");
      } else if (detail.action === "seal") {
        setCapture(false);
        setScreen("home");
      } else if (detail.action === "nodo") {
        setCapture(false);
        setScreen("nodo");
      }
    };
    window.addEventListener("nt:sim-preset", onPreset);
    return () => window.removeEventListener("nt:sim-preset", onPreset);
  }, []);

  return (
    <div className="sim-wrap">
      <div className={`sim sim--${view}`} data-sim-theme={theme} role="application" aria-label="NOTtEodo simulator">
        <div className="sim__status" aria-hidden="true">
          <span>9:41</span>
          <span>NOTtEodo</span>
        </div>
        <header className="sim__bar">
          <button className="sim__icon" aria-label="Menu" onClick={() => say("The full menu lives in the app.")}>
            <Menu size={18} />
          </button>
          <span className="sim__wordmark">
            <Wordmark />
          </span>
          <button className="sim__icon" aria-label="Search" onClick={() => say("Universal Spotlight searches everything in the app.")}>
            <Search size={17} />
          </button>
          <button className="sim__aa" aria-label={`Switch to ${view === "cards" ? "Editorial" : "Cards"} view`} onClick={() => switchView(view === "cards" ? "editorial" : "cards")}>
            A<i>a</i>
          </button>
          <button className="sim__icon" aria-label="Switch theme" onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </header>

        <main className="sim__screen" aria-live="polite">
          {screen === "home" && <HomeScreen s={s} setS={setS} go={setScreen} openCapture={() => setCapture(true)} />}
          {screen === "tasks" && <TasksScreen s={s} setS={setS} />}
          {screen === "notes" && <NotesScreen s={s} />}
          {screen === "focus" && <FocusScreen />}
          {screen === "nodo" && <NodoScreen />}
          {screen === "expenses" && <ExpensesScreen s={s} />}
        </main>

        <button className="sim__nodo" aria-label="Open Nodo" onClick={() => setScreen("nodo")}>
          <Sparkles size={18} />
        </button>

        <nav className="sim__dock" aria-label="Dock">
          <button className="sim__set" onClick={() => setDockSet(dockSet === "workspace" ? "life" : "workspace")} aria-label={`Switch dock to ${dockSet === "workspace" ? "Life" : "Workspace"} set`}>
            {dockSet === "workspace" ? "WORK" : "LIFE"}
          </button>
          {DOCK[dockSet].map(({ id, label, Icon }) => (
            <button
              key={id}
              className="sim__tab"
              aria-current={screen === id ? "page" : undefined}
              onClick={() => (["home", "notes", "tasks", "focus", "expenses"].includes(id) ? setScreen(id as Screen) : say(`${label} is in the full app.`))}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
          <button className="sim__plus" aria-label="Quick capture" onClick={() => setCapture(true)}>
            <Plus size={20} />
          </button>
        </nav>

        {capture && <CaptureSheet onClose={() => setCapture(false)} onAdd={(p) => {
          setS((st) => {
            if (p.kind === "task" || p.kind === "event") return { ...st, tasks: [{ id: Date.now(), title: p.title, when: p.when, done: false }, ...st.tasks] };
            if (p.kind === "expense") return { ...st, expenses: [{ title: p.title, amount: p.amount ?? 0, category: p.category ?? "General" }, ...st.expenses] };
            return { ...st, notes: [p.title, ...st.notes] };
          });
          say(`Saved as ${p.kind === "event" ? "a dated task" : `a ${p.kind}`}.`);
          emit("capture");
          setScreen(p.kind === "expense" ? "expenses" : p.kind === "note" ? "notes" : "tasks");
        }} />}
        {notice && <p className="sim__toast" role="status">{notice}</p>}
      </div>
      <p className="t-label sim__label">Simulation. The real app does much more.</p>
    </div>
  );
}

function HomeScreen({ s, setS, go, openCapture }: { s: State; setS: (f: (x: State) => State) => void; go: (x: Screen) => void; openCapture: () => void }) {
  const [sealing, setSealing] = useState(false);
  const [press, setPress] = useState(0);
  const timer = useRef<number | null>(null);
  const hold = () => {
    if (s.checkedIn) return;
    setSealing(true);
    const start = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - start) / 1100);
      setPress(p);
      if (p < 1) timer.current = requestAnimationFrame(step);
      else {
        play("wax");
        haptic(30);
        setS((x) => ({ ...x, checkedIn: true, streak: x.streak + 1 }));
        setSealing(false);
      }
    };
    timer.current = requestAnimationFrame(step);
  };
  const release = () => {
    if (timer.current) cancelAnimationFrame(timer.current);
    if (!s.checkedIn) setPress(0);
    setSealing(false);
  };
  const open = s.tasks.filter((t) => !t.done).length;
  return (
    <div className="sim__stack">
      <p className="sim__eyebrow">Today · daily overview</p>
      <h2 className="sim__h1">Good evening.</h2>
      <div className="sim__chips">
        <button className="sim__chip" onClick={openCapture}>Capture</button>
        <button className="sim__chip" onClick={() => go("tasks")}>Your tasks · {open}</button>
        <button className="sim__chip" onClick={() => go("focus")}>Focus</button>
      </div>
      <section className="sim__card sim__seal-card">
        <div>
          <p className="sim__eyebrow">Check-in</p>
          <p className="sim__big">
            <Flame size={18} /> {s.streak} day streak
          </p>
          <p className="sim__muted">{s.checkedIn ? "Sealed for today." : "Press and hold the seal to check in."}</p>
        </div>
        <button
          className={`sim__seal${s.checkedIn ? " is-done" : ""}`}
          style={{ ["--press" as string]: s.checkedIn ? 1 : press }}
          onPointerDown={hold}
          onPointerUp={release}
          onPointerLeave={release}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && hold()}
          onKeyUp={release}
          aria-label={s.checkedIn ? "Checked in today" : "Press and hold to check in"}
          aria-pressed={s.checkedIn}
        >
          <span>N</span>
        </button>
        {sealing && <span className="sr-only">Pressing</span>}
      </section>
      <section className="sim__card">
        <p className="sim__eyebrow">Next up</p>
        {s.tasks.slice(0, 3).map((t) => (
          <p key={t.id} className="sim__row">
            <InkStrike struck={t.done}>{t.title}</InkStrike>
            {t.when && <span className="sim__muted">{t.when}</span>}
          </p>
        ))}
      </section>
    </div>
  );
}

function TasksScreen({ s, setS }: { s: State; setS: (f: (x: State) => State) => void }) {
  return (
    <div className="sim__stack">
      <h2 className="sim__h1">Tasks</h2>
      <p className="sim__muted">Today · Upcoming · Anytime · Done</p>
      <ul className="sim__list">
        {s.tasks.map((t) => (
          <li key={t.id}>
            <label className="sim__task">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => {
                  setS((x) => ({ ...x, tasks: x.tasks.map((y) => (y.id === t.id ? { ...y, done: !y.done } : y)) }));
                  if (!t.done) {
                    play("paper");
                    haptic();
                  }
                }}
              />
              <InkStrike struck={t.done}>{t.title}</InkStrike>
              {t.when && <span className="sim__muted">{t.when}</span>}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotesScreen({ s }: { s: State }) {
  return (
    <div className="sim__stack">
      <h2 className="sim__h1">Notebook</h2>
      <p className="sim__muted">Ask your notes · Map of notes · Briefing</p>
      {s.notes.map((n, i) => (
        <section key={i} className="sim__card">
          <p style={{ margin: 0 }}>{n}</p>
        </section>
      ))}
    </div>
  );
}

function ExpensesScreen({ s }: { s: State }) {
  const spent = s.expenses.reduce((a, e) => a + e.amount, 0);
  const budget = 25000;
  return (
    <div className="sim__stack">
      <h2 className="sim__h1">Expenses</h2>
      <section className="sim__card">
        <p className="sim__eyebrow">Spending this month</p>
        <p className="sim__big sim__num">₹{spent.toLocaleString("en-IN")}</p>
        <div className="sim__meter"><span style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} /></div>
        <p className="sim__muted">₹{(budget - spent).toLocaleString("en-IN")} left of ₹25,000</p>
      </section>
      {s.expenses.map((e, i) => (
        <p key={i} className="sim__row">
          {e.title} <span className="sim__muted">{e.category}</span> <span className="sim__num">₹{e.amount.toLocaleString("en-IN")}</span>
        </p>
      ))}
    </div>
  );
}

function FocusScreen() {
  const [mins, setMins] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const firstMins = useRef(mins);
  useEffect(() => {
    setLeft(mins * 60);
    if (mins !== firstMins.current) emit("dial");
  }, [mins]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((l) => {
        play("tick");
        if (l <= 1) {
          setRunning(false);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);
  const frac = left / (mins * 60);
  const angle = (1 - frac) * 360;
  return (
    <div className="sim__stack" style={{ alignItems: "center" }}>
      <p className="sim__eyebrow">Watchmaker focus dial</p>
      <div
        className="sim__dial"
        role="slider"
        tabIndex={0}
        aria-label="Session length in minutes"
        aria-valuemin={5}
        aria-valuemax={90}
        aria-valuenow={mins}
        onKeyDown={(e) => {
          if (running) return;
          if (e.key === "ArrowUp" || e.key === "ArrowRight") setMins((m) => Math.min(90, m + 5));
          if (e.key === "ArrowDown" || e.key === "ArrowLeft") setMins((m) => Math.max(5, m - 5));
        }}
        onWheel={(e) => !running && setMins((m) => Math.max(5, Math.min(90, m + (e.deltaY < 0 ? 5 : -5))))}
      >
        {Array.from({ length: 60 }, (_, i) => (
          <i key={i} style={{ transform: `rotate(${i * 6}deg)` }} className={i % 5 === 0 ? "major" : ""} />
        ))}
        <span className="sim__hand" style={{ transform: `rotate(${angle}deg)` }} />
        <span className="sim__pin" />
      </div>
      <p className="sim__big sim__num">
        {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
      </p>
      <div className="sim__chips">
        {[15, 25, 45, 60, 90].map((m) => (
          <button key={m} className="sim__chip" aria-pressed={mins === m} disabled={running} onClick={() => setMins(m)}>
            {m}m
          </button>
        ))}
      </div>
      <button className="sim__primary" onClick={() => setRunning((r) => !r)}>
        {running ? "Pause" : left === 0 ? "Done" : "Start"}
      </button>
      <p className="sim__muted">Arrow keys or scroll set the length.</p>
    </div>
  );
}

function NodoScreen() {
  const [log, setLog] = useState<{ q: string; a: string }[]>([]);
  const [q, setQ] = useState("");
  return (
    <div className="sim__stack">
      <h2 className="sim__h1">Nodo</h2>
      <p className="sim__muted">In this simulation, Nodo answers questions about using the app from its built-in guide.</p>
      {log.map((x, i) => (
        <div key={i} className="sim__stack" style={{ gap: 6 }}>
          <p className="sim__bubble sim__bubble--me">{x.q}</p>
          <p className="sim__bubble">{x.a}</p>
        </div>
      ))}
      <form
        className="sim__ask"
        onSubmit={(e) => {
          e.preventDefault();
          if (!q.trim()) return;
          setLog((l) => [...l, { q, a: answer(q).text }].slice(-3));
          setQ("");
        }}
      >
        <label className="sr-only" htmlFor="sim-q">Ask Nodo</label>
        <input id="sim-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask Nodo about the app" />
        <button>Ask</button>
      </form>
    </div>
  );
}

function CaptureSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Parsed) => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const p = text.trim() ? parseCapture(text) : null;
  return (
    <div className="sim__sheet" role="dialog" aria-modal="true" aria-label="Quick capture" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <p className="sim__eyebrow">Quick add</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!p) return;
          play("drop");
          onAdd(p);
          onClose();
        }}
      >
        <input ref={ref} className="sim__input" value={text} onChange={(e) => setText(e.target.value)} placeholder="call mom tomorrow 5pm · coffee ₹240" />
        <p className="sim__muted" aria-live="polite">
          {p ? `Becomes a ${p.kind}${p.amount ? ` · ₹${p.amount}` : ""}${p.when ? ` · ${p.when}` : ""}` : "Type one line."}
        </p>
        <div className="sim__chips">
          <button type="submit" className="sim__primary" disabled={!p}>Save</button>
          <button type="button" className="sim__chip" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export function ContinueOnPhone() {
  return (
    <div className="row">
      <Link className="btn" href="/open/capture">Continue on your phone</Link>
      <Link className="btn btn-ghost" href="/download">Get NOTtEodo</Link>
    </div>
  );
}


