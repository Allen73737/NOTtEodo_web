"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { haptic, play } from "@/lib/sound";
import type { TourStep } from "./Simulator";

const STEPS: { id: TourStep; title: string; hint: string }[] = [
  { id: "capture", title: "Capture a line", hint: "Tap + and type “Dentist Friday 4pm” or “Coffee 180”." },
  { id: "strike", title: "Strike a task", hint: "Open Tasks and tap one. Watch the ink." },
  { id: "dial", title: "Turn the Focus Dial", hint: "Open Focus and drag the dial, or use the arrow keys." },
  { id: "seal", title: "Press the seal", hint: "On Home, press and hold the wax seal to check in." },
  { id: "flip", title: "Change the look", hint: "Tap Aa for Editorial, or the moon for OLED." },
];

/**
 * Try it, as a guided tour: five things to do in the simulator, ticked off as they happen (the
 * simulator fires `nt:sim`), with the next one suggested. Done, it hands over to the download.
 * Progress lasts for this tab (sessionStorage), like the simulator's own state.
 */
export function SimTour() {
  const [done, setDone] = useState<TourStep[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("nt-tour");
      if (raw) setDone(JSON.parse(raw) as TourStep[]);
    } catch {
      /* storage blocked */
    }
    const on = (e: Event) => {
      const step = (e as CustomEvent<TourStep>).detail;
      setDone((d) => {
        if (d.includes(step)) return d;
        const next = [...d, step];
        try {
          sessionStorage.setItem("nt-tour", JSON.stringify(next));
        } catch {
          /* fine */
        }
        play(next.length === STEPS.length ? "wax" : "tick");
        haptic(next.length === STEPS.length ? 24 : 8);
        return next;
      });
    };
    addEventListener("nt:sim", on);
    return () => removeEventListener("nt:sim", on);
  }, []);

  const nextStep = STEPS.find((s) => !done.includes(s.id));
  const all = !nextStep;
  return (
    <div className={`tour${all ? " is-done" : ""}`} aria-live="polite">
      <div className="tour__head">
        <p className="t-label" style={{ margin: 0 }}>
          The tour
        </p>
        <p className="t-label t-num" style={{ margin: 0 }}>
          {done.length} / {STEPS.length}
        </p>
      </div>
      <div className="tour__bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${done.length / STEPS.length})` }} />
      </div>
      <ol className="tour__steps">
        {STEPS.map((s) => {
          const ok = done.includes(s.id);
          const now = s.id === nextStep?.id;
          return (
            <li key={s.id} className={`${ok ? "is-ok" : ""}${now ? " is-now" : ""}`}>
              <span className="tour__tick" aria-hidden="true">
                {ok ? <Check size={13} strokeWidth={2.4} /> : null}
              </span>
              <span>
                <span className="tour__title">
                  {s.title}
                  {ok ? <span className="sr-only"> (done)</span> : null}
                </span>
                {now && <span className="tour__hint">{s.hint}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {all && (
        <div className="tour__end">
          <p className="tour__line">
            That&rsquo;s the app <span className="it">in your hand.</span>
          </p>
          <Link className="btn" href="/download" data-nav="forward">
            Get NOTtEodo
          </Link>
        </div>
      )}
    </div>
  );
}
