"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { play } from "@/lib/sound";

type State = "ask" | "note" | "sending" | "done" | "error";

/**
 * "Was this helpful?" at the foot of help, guide and FAQ pages. One tap answers; a "no" (or a
 * "yes", if they like) can add a short note. Anonymous: see /api/feedback. Each page asks once
 * per browser (sessionStorage), so a thank-you stays a thank-you on reload.
 */
export function Helpful() {
  const path = usePathname();
  const [state, setState] = useState<State>("ask");
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const shownAt = useRef(0);
  const key = `nt-helpful:${path}`;

  useEffect(() => {
    shownAt.current = Date.now();
    try {
      if (sessionStorage.getItem(key)) setState("done");
    } catch {
      /* storage blocked: ask anyway */
    }
  }, [key]);

  const send = async (answer: boolean, text?: string) => {
    setState("sending");
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, helpful: answer, note: text || undefined, t: shownAt.current }),
      });
      if (!r.ok) throw new Error();
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        /* fine */
      }
      play("land");
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <aside className="helpful no-print" aria-live="polite">
      {state === "done" ? (
        <p className="helpful__thanks">Thank you. It helps us make the next page clearer.</p>
      ) : state === "note" || (state === "sending" && helpful !== null) || state === "error" ? (
        <form
          className="helpful__form"
          onSubmit={(e) => {
            e.preventDefault();
            void send(helpful ?? false, note.trim());
          }}
        >
          <label htmlFor="helpful-note" className="helpful__q">
            {helpful ? "Glad it helped. Anything to add?" : "Sorry about that. What were you looking for?"}
          </label>
          <textarea
            id="helpful-note"
            className="input"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional. Please don't include personal details."
          />
          <div className="row">
            <button type="submit" className="btn btn-primary" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Send"}
            </button>
            <button type="button" className="btn btn-ghost" disabled={state === "sending"} onClick={() => void send(helpful ?? false)}>
              Skip
            </button>
          </div>
          {state === "error" && <p className="helpful__err">That didn&rsquo;t send. Please try again in a moment.</p>}
        </form>
      ) : (
        <div className="helpful__ask">
          <p className="helpful__q">Was this page helpful?</p>
          <div className="row">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                className="chip"
                onClick={() => {
                  setHelpful(v);
                  setState("note");
                }}
              >
                {v ? <ThumbsUp size={15} strokeWidth={1.8} aria-hidden /> : <ThumbsDown size={15} strokeWidth={1.8} aria-hidden />}
                {v ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
