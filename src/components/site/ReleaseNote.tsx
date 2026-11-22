"use client";

import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "nt-seen-release";

/**
 * "New in v1.x": a small card for returning visitors when a release has come out since their
 * last visit. A first visit only records the current version, so nobody is greeted with news
 * they have no "before" for. Dismissing or opening it marks the version seen.
 */
export function ReleaseNote({ code, name, line }: { code: number; name: string; line: string }) {
  const path = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const seen = Number(localStorage.getItem(KEY) ?? 0);
      if (!seen) localStorage.setItem(KEY, String(code));
      else if (seen < code) {
        // Let the page settle first; news shouldn't race the opening.
        const t = setTimeout(() => setShow(true), 2400);
        return () => clearTimeout(t);
      }
    } catch {
      /* storage blocked: never show */
    }
  }, [code]);

  const seen = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, String(code));
    } catch {
      /* fine */
    }
  };

  if (!show || path?.startsWith("/changelog") || path?.startsWith("/admin")) return null;
  return (
    <aside className="release-note no-print" aria-label={`New in version ${name}`}>
      <span className="release-note__ico" aria-hidden="true">
        <Sparkles size={16} strokeWidth={1.8} />
      </span>
      <div className="release-note__body">
        <p className="t-label">New in v{name}</p>
        {line && <p className="release-note__line">{line}</p>}
        <Link href="/changelog" onClick={seen} className="release-note__go">
          See what&rsquo;s new →
        </Link>
      </div>
      <button type="button" className="icon-btn release-note__x" aria-label="Dismiss" onClick={seen}>
        <X size={16} strokeWidth={1.8} />
      </button>
    </aside>
  );
}
