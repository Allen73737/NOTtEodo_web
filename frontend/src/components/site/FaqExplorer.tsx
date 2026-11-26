"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { haptic, play } from "@/lib/sound";

export type FaqItem = { q: string; a: string; category?: string; help?: string };

const CATEGORIES = [
  { id: "all", label: "All Questions" },
  { id: "privacy", label: "Privacy & Encryption" },
  { id: "nodo", label: "Nodo AI" },
  { id: "sync", label: "Sync & Accounts" },
  { id: "app", label: "Android & Free" },
] as const;

function categorize(item: FaqItem): string {
  if (item.category) return item.category;
  const q = (item.q + " " + item.a).toLowerCase();
  if (q.includes("nodo") || q.includes("ai") || q.includes("cloud")) return "nodo";
  if (q.includes("encrypt") || q.includes("privacy") || q.includes("track") || q.includes("store") || q.includes("delete")) return "privacy";
  if (q.includes("sync") || q.includes("account") || q.includes("backup") || q.includes("restore") || q.includes("phone")) return "sync";
  return "app";
}

export function FaqExplorer({ items, guideSections }: { items: FaqItem[]; guideSections: { id: string }[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchCat = activeCategory === "all" || categorize(item) === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    });
  }, [items, activeCategory, query]);

  const selectCategory = (cat: string) => {
    setActiveCategory(cat);
    play("paper");
    haptic();
  };

  return (
    <div className="faq-explorer stack" style={{ gap: 24 }}>
      <div className="faq-explorer__controls stack" style={{ gap: 14 }}>
        <div className="faq-explorer__search">
          <Search size={18} className="faq-explorer__icon" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions or topics (e.g. encryption, backup, pricing)..."
            className="faq-explorer__input"
            aria-label="Search frequently asked questions"
          />
          {query && (
            <button
              type="button"
              className="icon-btn faq-explorer__clear"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="faq-explorer__chips" role="tablist" aria-label="Filter FAQ by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.id}
              className={`chip faq-explorer__chip${activeCategory === cat.id ? " is-active" : ""}`}
              onClick={() => selectCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="faq-explorer__list">
        {filtered.length === 0 ? (
          <div className="card pad stack faq-explorer__empty" style={{ textAlign: "center", padding: "48px 24px" }}>
            <p className="t-h3" style={{ margin: 0 }}>No questions matched “{query}”</p>
            <p className="muted" style={{ margin: "8px 0 16px" }}>
              Can&rsquo;t find what you need? Ask Nodo in the app or explore the comprehensive help centre.
            </p>
            <div className="row" style={{ justifyContent: "center", gap: 12 }}>
              <button type="button" className="btn btn--outline" onClick={() => { setQuery(""); setActiveCategory("all"); }}>
                Reset filters
              </button>
              <Link href="/help" className="btn">
                Visit Help Centre
              </Link>
            </div>
          </div>
        ) : (
          filtered.map((i) => (
            <details key={i.q} className="faq" open={false}>
              <summary>{i.q}</summary>
              <p>{i.a}</p>
              {i.help && guideSections.some((s) => s.id === i.help) && (
                <Link href={`/help/${i.help}`} className="faq__link">
                  Read more in Guide &rarr;
                </Link>
              )}
            </details>
          ))
        )}
      </div>
    </div>
  );
}
