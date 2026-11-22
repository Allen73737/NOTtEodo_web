import MiniSearch from "minisearch";
import guide from "@/content/generated/app_guide.json";

export type GuideSection = { id: string; title: string; keywords?: string[]; body: string };
export const sections = guide.sections as GuideSection[];

let index: MiniSearch<GuideSection> | null = null;

function getIndex() {
  if (index) return index;
  index = new MiniSearch<GuideSection>({
    fields: ["title", "keywords", "body"],
    storeFields: ["id", "title", "body"],
    extractField: (doc, field) => (field === "keywords" ? (doc.keywords ?? []).join(" ") : (doc as Record<string, unknown>)[field] as string),
    searchOptions: { boost: { title: 3, keywords: 2 }, fuzzy: 0.2, prefix: true },
  });
  index.addAll(sections);
  return index;
}

export function searchGuide(q: string, limit = 5) {
  if (!q.trim()) return [];
  return getIndex()
    .search(q)
    .slice(0, limit)
    .map((r) => ({ id: r.id as string, title: r.title as string, body: r.body as string, score: r.score }));
}

/**
 * The in-browser "Ask Nodo about NOTtEodo": answers how-to questions from the app's own guide,
 * like the app's on-device Nodo does. No network, no model: picks the best section and quotes
 * its most relevant sentences.
 */
export function answer(q: string): { text: string; source?: { id: string; title: string } } {
  const hits = searchGuide(q, 3);
  const top = hits[0];
  if (!top) {
    return { text: "I only know about using NOTtEodo here. Try asking how to capture, set a budget, back up, or delete your account." };
  }
  const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const sentences = top.body.split(/(?<=[.!?])\s+/);
  const scored = sentences
    .map((s, i) => ({ s, i, score: words.reduce((n, w) => n + (s.toLowerCase().includes(w) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
  const picked = scored
    .slice(0, 4)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
  return { text: picked.join(" "), source: { id: top.id, title: top.title } };
}
