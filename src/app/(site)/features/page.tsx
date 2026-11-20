import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { modules } from "@/content/site";
import { posterFor } from "@/content/posters";
import { Reveal } from "@/motion/primitives";

export const metadata: Metadata = {
  title: "Features",
  description: "Every part of NOTtEodo: notes, tasks, planner, habits, focus, expenses, wardrobe, travel, journal, moodboard, shopping, vault, widgets, capture and Nodo.",
  alternates: { canonical: "/features" },
  openGraph: { images: ["/posters/og/og-features-light.png"] },
};

const SETS = [
  { id: "workspace", label: "Workspace" },
  { id: "life", label: "Life" },
  { id: "system", label: "Across the app" },
] as const;

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="One app, every part of life."
        italic={["every"]}
        lede="Each part is complete on its own and better together. Every line here is something the app does today."
      />
      {SETS.map((set) => (
        <section key={set.id} className="wrap section" style={{ paddingTop: 0 }} aria-labelledby={`set-${set.id}`}>
          <h2 id={`set-${set.id}`} className="t-label" style={{ marginBottom: 18 }}>
            {set.label}
          </h2>
          <Reveal className="masonry">
            {modules
              .filter((m) => m.set === set.id)
              .map((m) => {
                const poster = posterFor(m.slug);
                return (
                  <Link key={m.slug} href={`/features/${m.slug}`} className="card feature-card sheen pressable" data-cursor="Open">
                    {poster && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={poster.src} alt="" loading="lazy" width={poster.width} height={poster.height} className="feature-card__poster" />
                    )}
                    <div className="pad stack" style={{ gap: 8 }}>
                      <p className="t-eyebrow" style={{ margin: 0 }}>{m.name}</p>
                      <p className="t-h3 it" style={{ margin: 0 }}>{m.line}</p>
                      <p className="muted" style={{ margin: 0 }}>{m.summary}</p>
                    </div>
                  </Link>
                );
              })}
          </Reveal>
        </section>
      ))}
    </>
  );
}
