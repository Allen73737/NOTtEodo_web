import type { Metadata } from "next";
import Link from "next/link";
import { Screenshot } from "@/components/shots/Screenshot";
import { PageHeader } from "@/components/site/PageHeader";
import { InkStrike, Reveal } from "@/motion/primitives";

export const metadata: Metadata = {
  title: "Why NOTtEodo",
  description: "One calm app instead of six: notes, tasks, planner, habits, money and more, private by design.",
  alternates: { canonical: "/why" },
};

const SIX = ["A notes app", "A to-do list", "A calendar", "A habit tracker", "A budget app", "A journal"];

export default function WhyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Why NOTtEodo"
        title="One app instead of six."
        italic={["one"]}
        lede="Most of us keep our days in half a dozen apps that don't know about each other. NOTtEodo keeps them in one place, so a capture can become a task, a task can sit on your planner, and Nodo can see the whole day."
        aside={<Screenshot screen="home" />}
        word="One"
      />
      <section className="wrap split section" style={{ paddingTop: 0 }}>
        <ul className="six">
          {SIX.map((s) => (
            <li key={s} className="t-h2">
              <InkStrike struck>{s}</InkStrike>
            </li>
          ))}
        </ul>
        <div className="stack">
          <p className="t-display it">NOTtEodo.</p>
          <p className="t-lede">Notes, tasks, planner, habits, focus, expenses, wardrobe, travel, journal, moodboard and shopping, all sharing one search, one capture bar and one companion.</p>
        </div>
      </section>
      <section className="wrap section">
        <h2 className="t-h2">What we believe</h2>
        <Reveal className="grid-auto" style={{ marginTop: 24 }}>
          {[
            ["Private first", "Your day belongs to you. It lives encrypted on your phone; the cloud is optional and you can encrypt that too."],
            ["Calm by design", "Two views for two moods: Cards when you want things tactile, Editorial when you want quiet."],
            ["Honest by default", "No ads, no trackers, no dark patterns, no invented testimonials. If something isn't true, it isn't on this site."],
            ["Made with care", "Watchmaker details where they help: a seal for the day's check-in, an ink line for a finished task, a dial for focus."],
          ].map(([h, b]) => (
            <div key={h} className="card pad">
              <p className="t-eyebrow">{h}</p>
              <p style={{ margin: 0 }}>{b}</p>
            </div>
          ))}
        </Reveal>
        <p style={{ marginTop: 32 }}>
          NOTtEodo is free to use today. <Link href="/terms#price">What that means</Link>.
        </p>
      </section>
    </>
  );
}
