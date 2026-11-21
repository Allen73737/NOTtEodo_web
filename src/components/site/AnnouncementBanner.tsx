"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Announcement } from "@/lib/db/types";

const SAFE_URL = /^(https:\/\/|\/(?!\/))/;

/** Live banner for announcements targeted at "web" or "both". Updates over Realtime. */
export function AnnouncementBanner({ initial }: { initial: Announcement[] }) {
  const [items, setItems] = useState(initial);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    try {
      setHidden(JSON.parse(sessionStorage.getItem("nt-hidden-ann") ?? "[]"));
    } catch {
      /* storage blocked */
    }
    // supabase-js loads lazily, after first paint, so it never weighs on initial JS.
    // If the effect is torn down before the import resolves (strict mode, fast navigation), never
    // subscribe: a second subscriber would get the already-subscribed channel back and throw.
    let cancelled = false;
    let cleanup = () => {
      cancelled = true;
    };
    void import("@/lib/supabase/client").then(({ supabaseBrowser }) => {
    if (cancelled) return;
    const sb = supabaseBrowser();
    if (!sb) return;
    const ch = sb
      .channel("web-announcements")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, async () => {
        const { data } = await sb
          .from("announcements")
          .select("*")
          .eq("is_active", true)
          .in("target", ["web", "both"])
          .order("created_at", { ascending: false });
        const now = Date.now();
        setItems(
          ((data ?? []) as Announcement[]).filter(
            (a) => (!a.starts_at || Date.parse(a.starts_at) <= now) && (!a.ends_at || Date.parse(a.ends_at) > now),
          ),
        );
      })
      .subscribe();
    cleanup = () => void sb.removeChannel(ch);
    });
    return () => cleanup();
  }, []);

  const a = items.find((x) => !hidden.includes(x.id));
  if (!a) return null;
  return (
    <div className={`banner banner--${a.severity} no-print`} role={a.severity === "critical" ? "alert" : "status"}>
      <p>
        <strong>{a.title}</strong> <span>{a.body_md}</span>
        {a.cta_url && SAFE_URL.test(a.cta_url) && (
          <>
            {" "}
            <a href={a.cta_url}>{a.cta_label ?? "Learn more"}</a>
          </>
        )}
      </p>
      <button
        type="button"
        className="icon-btn"
        aria-label="Dismiss announcement"
        onClick={() => {
          const next = [...hidden, a.id];
          setHidden(next);
          try {
            sessionStorage.setItem("nt-hidden-ann", JSON.stringify(next));
          } catch {
            /* storage blocked */
          }
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
