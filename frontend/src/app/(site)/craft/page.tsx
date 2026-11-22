import type { Metadata } from "next";
import { Monogram } from "@/components/brand/Monogram";
import { MotionDemos } from "@/components/demos/MotionDemos";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = {
  title: "Behind the craft",
  description: "The watchmaking-inspired details in NOTtEodo: the check-in seal, ink strikes, the Breguet focus dial, paper tears and ceremonies.",
  alternates: { canonical: "/craft" },
};

/** Only details normal users actually see in the app are described as "in the app". */
const IN_APP = [
  ["The wax seal", "Home → Check-in: press and hold the seal and the ribbon N is pressed into the wax. Tasks has a stamp to celebrate the day's work.", "wax_melt_compression_ritual"],
  ["Breguet hands", "The Focus Dial and the Home focus card use watchmaker's hands with hollow crescents.", "breguet_hands_tracker"],
  ["The paper tear", "Deleting a note tears it away like deckled paper; it waits in the Bin.", "deckled_paper_tear"],
  ["The ink strike", "Finishing a task draws a hand-inked line through it, rising a touch as it goes.", "ink_strike"],
  ["The theme wash", "Switching light and dark blooms a disc of the new colour from your fingertip.", "theme_wash"],
  ["Ceremonies", "Badges and streak milestones arrive with a small ceremony: medal finishes in Cards view, an engraved seal in Editorial view.", "rewards"],
  ["Touch sheen", "In Cards view a card catches the light where you touch it. Nothing tilts.", "touch_sheen"],
];

export default function CraftPage() {
  return (
    <>
      <PageHeader
        eyebrow="Behind the craft"
        title="A watchmaker's patience, applied to a to-do list."
        italic={["patience,"]}
        lede="Small rituals make a daily tool feel like yours. These are the ones you'll meet in the app."
      />
      <section className="wrap section" style={{ paddingTop: 0 }}>
        <ol className="craft-list">
          {IN_APP.map(([h, b, src], i) => (
            <li key={h} className="card pad">
              <span className="t-num acc">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="t-h3">{h}</h2>
              <p style={{ margin: 0 }}>{b}</p>
              <p className="t-label" style={{ margin: 0 }}>{src}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="wrap section">
        <h2 className="t-h2">Try them here</h2>
        <p className="t-lede">The website runs the same motion timings as the app, ported from its Flutter source.</p>
        <div style={{ marginTop: 24 }}>
          <MotionDemos />
        </div>
      </section>
      <section className="wrap section row" style={{ gap: 32 }}>
        <Monogram size={120} draw title="The ribbon N" />
        <p className="t-lede" style={{ maxWidth: "50ch" }}>
          The ribbon N is drawn the way the app&rsquo;s loader draws it: two pens trace the loop in parallel from the centre, then the
          tails land as a final flourish.
        </p>
      </section>
      <p className="wrap t-label" style={{ paddingBottom: 60 }}>
        The website also uses decorative ideas from the app&rsquo;s design lab (ink marbling, a watch movement, letterpress type) for its own
        scenes; those are the site&rsquo;s artwork, not features of the app.
      </p>
    </>
  );
}
