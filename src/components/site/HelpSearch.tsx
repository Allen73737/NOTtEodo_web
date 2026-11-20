"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { searchGuide } from "@/lib/search/guide";

/** Instant help search over app_guide.json, in the browser. */
export function HelpSearch({ extra = [] }: { extra?: { question: string; answer: string }[] }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchGuide(q, 6), [q]);
  const extraHits = useMemo(
    () => (q.length > 2 ? extra.filter((e) => (e.question + e.answer).toLowerCase().includes(q.toLowerCase())).slice(0, 3) : []),
    [q, extra],
  );
  return (
    <div className="stack">
      <label className="field">
        Search help
        <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. widget, backup, delete account" autoComplete="off" />
      </label>
      {q && (
        <ul className="help-results" aria-live="polite">
          {results.map((r) => (
            <li key={r.id}>
              <Link href={`/help/${r.id}`}>
                <strong>{r.title}</strong>
                <span className="muted">{r.body.slice(0, 140)}…</span>
              </Link>
            </li>
          ))}
          {extraHits.map((e) => (
            <li key={e.question}>
              <strong>{e.question}</strong>
              <span className="muted">{e.answer}</span>
            </li>
          ))}
          {results.length + extraHits.length === 0 && <li className="muted">No matches. Try another word.</li>}
        </ul>
      )}
    </div>
  );
}
