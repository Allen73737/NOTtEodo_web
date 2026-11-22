import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, ViewTransition } from "react";
import { Chapter, Interlude } from "@/components/site/Chapter";
import { PosterFan } from "@/components/site/HeadVisuals";
import { PageHeader } from "@/components/site/PageHeader";
import { modules } from "@/content/site";
import { posterFor } from "@/content/posters";
import { Reveal } from "@/motion/primitives";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Every part of NOTtEodo: notes, tasks, planner, habits, focus, expenses, wardrobe, travel, journal, moodboard, shopping, vault, widgets, capture and Nodo.",
  alternates: { canonical: "/features" },
  openGraph: { images: ["/posters/og/og-features-light.png"] },
};

const SETS = [
  {
    id: "workspace",
    n: "01",
    label: "Workspace",
    title: "Where the work of a day gets done.",
    lede: "Notes, tasks, the planner and the Focus Dial: the parts you open first thing.",
  },
  {
    id: "life",
    n: "02",
    label: "Life",
    title: "Everything around the work.",
    lede: "Habits, money, wardrobe, travel, the journal and the moodboard.",
  },
  {
    id: "system",
    n: "03",
    label: "Across the app",
    title: "The quiet parts that hold it together.",
    lede: "Capture, reminders, the vault, widgets, sync and Nodo.",
  },
] as const;

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="One app, every part of life."
        italic={["every"]}
        lede="Each part is complete on its own and better together. Every line here is something the app does today."
        aside={<PosterFan slugs={["notes", "expenses", "focus-dial"]} />}
        word="Features"
      />
      {SETS.map((set, si) => (
        <Fragment key={set.id}>
          {si === 2 && (
            <Interlude sub="Fourteen parts · one calm system · no ads, ever">
              Say it once. <span className="it">It finds its place.</span>
            </Interlude>
          )}
          <Chapter id={`set-${set.id}`} n={set.n} label={set.label} title={set.title} lede={set.lede}>
            <Reveal className="bento">
              {modules
                .filter((m) => m.set === set.id)
                .map((m) => {
                  const poster = posterFor(m.slug);
                  return (
                    <Link
                      key={m.slug}
                      href={`/features/${m.slug}`}
                      className={`card feature-card pressable${poster ? " feature-card--poster" : ""}`}
                      data-cursor="Open"
                      data-word={poster ? undefined : m.name}
                    >
                      {poster && (
                        // The poster grows into the feature page's header (see its ViewTransition).
                        <ViewTransition name={`poster-${m.slug}`} share="morph" default="none">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={poster.src}
                            alt=""
                            loading="lazy"
                            width={poster.width}
                            height={poster.height}
                            className="feature-card__poster"
                          />
                        </ViewTransition>
                      )}
                      <div className="feature-card__body">
                        <p className="t-eyebrow" style={{ margin: 0 }}>
                          {m.name}
                        </p>
                        <p className="feature-card__line">{m.line}</p>
                        <p className="muted" style={{ margin: 0 }}>
                          {m.summary}
                        </p>
                        <span className="feature-card__go" aria-hidden="true">
                          Open →
                        </span>
                      </div>
                    </Link>
                  );
                })}
            </Reveal>
          </Chapter>
        </Fragment>
      ))}
    </>
  );
}
