import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { Children } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { FilmProvider } from "@/components/film/FilmProvider";
import { Intro } from "@/components/film/Intro";
import { AskNodo, CaptureDemo, ChapterRail, Deal, HeroInk, PersonaPicker, StreakFill, StrikeBoard } from "@/components/film/interactive";
import { FocusDial, HoldSeal, Memories, SpendSlider, SpinPad, TaskTicker, ViewSwitch } from "@/components/film/story";
import { Screenshot } from "@/components/shots/Screenshot";
import { DownloadCta } from "@/components/site/DownloadCta";
import { JsonLd } from "@/components/site/JsonLd";
import { colors } from "@/content/generated/tokens";
import { modules } from "@/content/site";
import { siteUrl } from "@/lib/env";
import { APP, getConfig, getLatestRelease, getTestimonials } from "@/lib/platform";
import { CountUp, KineticText, Magnetic, Marquee, Scramble } from "@/motion/primitives";

export const metadata: Metadata = {
  title: { absolute: "NOTtEodo: Notes. Tasks. Life. | Curate your everyday." },
  alternates: { canonical: "/" },
  openGraph: { images: [{ url: "/posters/og/og-default-light.png", width: 1200, height: 630 }] },
};
export const revalidate = 120;

/** The story is one day, dawn to night. Each act's time sits in the chapter rail. */
const ACTS = [
  { id: "hero", label: "Dawn", time: "06:00" },
  { id: "open", label: "One app", time: "06:30" },
  { id: "capture", label: "Capture", time: "07:05" },
  { id: "views", label: "Two views", time: "08:00" },
  { id: "tour", label: "The tour", time: "09:00" },
  { id: "modules", label: "Every part", time: "09:30" },
  { id: "plan", label: "Plan", time: "10:15" },
  { id: "focus", label: "Focus", time: "11:30" },
  { id: "money", label: "Money", time: "13:20" },
  { id: "evening", label: "Ritual", time: "21:30" },
  { id: "nodo", label: "Nodo", time: "22:00" },
  { id: "privacy", label: "Privacy", time: "23:00" },
  { id: "finale", label: "Tomorrow", time: "06:00" },
];

/** The tour's screens, in the order the 3D phone shows them (keep in step with KEYS.tour.screens). */
const TOUR = [
  ["Home", "Your day at a glance: brief, focus, run and the next thing."],
  ["Notes", "A notebook that links itself, and answers back."],
  ["Tasks", "Plain words in, an ink line through when done."],
  ["Planner", "Events and dated tasks on one timeline."],
  ["Habits", "Small things, done often, with runs and freezes."],
  ["Money", "Envelopes, subscriptions and what's safe to spend."],
  ["Journal", "Entries with a mood, and voice that becomes text."],
  ["Travel", "Countdowns, packing lists and shared trip costs."],
  ["Moodboard", "Polaroids with a handwritten note on the back."],
  ["Focus Dial", "A watchmaker's dial for deep work."],
  ["Nodo", "A companion that answers from your own things."],
];

type ActProps = {
  id: string;
  n: string;
  title: string;
  italic?: string[];
  /** Which side the copy sits on; the 3D object takes the other. */
  side?: "left" | "right" | "center";
  night?: boolean;
  /** A giant outlined word that drifts behind the phone as the act scrolls. */
  word?: string;
  /** Act length in screens; the act stays pinned for all but the last one. */
  len?: number;
  /** Shown instead of the 3D stage on the lite and reduced paths (and without JS). */
  visual?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

function Act({ id, n, title, italic, side = "left", night, word, len = 2.6, visual, className, children }: ActProps) {
  const a = ACTS.find((x) => x.id === id)!;
  return (
    <section
      id={id}
      data-act={id}
      data-chapter={id}
      className={`act act--${side}${night ? " act--night" : ""} ${className ?? ""}`}
      style={{ ["--len" as string]: len }}
      aria-labelledby={`${id}-title`}
    >
      <div className="act__back" aria-hidden="true">
        {word && <p className="act__word">{word}</p>}
      </div>
      <div className="act__pin">
        <div className="wrap act__grid">
          <div className="act__copy">
            <p className="act__kicker act__line" style={{ ["--k" as string]: 0 }}>
              <span className="act__n">{n}</span>
              <span className="act__time t-num">{a.time}</span>
              <span className="act__label">{a.label}</span>
            </p>
            <h2 id={`${id}-title`} className="t-display act__title act__line" style={{ ["--k" as string]: 1 }}>
              <KineticText text={title} italicWords={italic} />
            </h2>
            {Children.toArray(children).map((child, i) => (
              <div key={i} className="act__line" style={{ ["--k" as string]: i + 2 }}>
                {child}
              </div>
            ))}
          </div>
          {visual && side !== "center" && <div className="act__visual">{visual}</div>}
        </div>
        <span className="act__progress" aria-hidden="true" />
      </div>
    </section>
  );
}

export default async function Home() {
  const [cfg, release, testimonials] = await Promise.all([getConfig(), getLatestRelease(), getTestimonials()]);
  const qr = await QRCode.toString(`${siteUrl}/open/release/latest`, { type: "svg", margin: 0, color: { dark: colors.light.ink, light: "#00000000" } });
  const cta = <DownloadCta release={release} playLive={cfg.play_live} playUrl={cfg.urls.play} />;

  return (
    <FilmProvider>
      <JsonLd release={release} />
      <Intro />
      <ChapterRail chapters={ACTS} />

      {/* Dawn: the ribbon N turns in ink */}
      <section id="hero" data-act="hero" data-chapter="hero" className="act act--left act--hero" style={{ ["--len" as string]: 1.8 }} aria-labelledby="hero-title">
        <div className="act__back" aria-hidden="true">
          <HeroInk />
        </div>
        <div className="act__pin">
          <div className="wrap act__grid">
            <div className="act__copy hero__copy">
              <p className="t-eyebrow act__line" style={{ ["--k" as string]: 0 }}>{cfg.hero.eyebrow}</p>
              <h1 id="hero-title" className="t-mega hero__title act__line" style={{ ["--k" as string]: 1 }}>
                <KineticText text="Curate your everyday." italicWords={["everyday."]} start="mount" />
              </h1>
              <p className="t-lede hero__lede act__line" style={{ ["--k" as string]: 2 }}>
                <Wordmark /> keeps your notes, tasks, plans, habits, money, wardrobe, travel and journal in one calm, private app for Android.
              </p>
              <div className="act__line" style={{ ["--k" as string]: 3 }}>
                <Magnetic>{cta}</Magnetic>
              </div>
              <ul className="trust act__line" style={{ ["--k" as string]: 4 }} aria-label="Promises">
                <li>No ads</li>
                <li>No trackers</li>
                <li>Works offline</li>
                <li>Encrypted on your phone</li>
              </ul>
            </div>
            <div className="act__visual hero__visual">
              <Monogram size="min(52vmin, 420px)" className="hero__mark" />
            </div>
          </div>
          <p className="hero__cue t-label" aria-hidden="true">
            <span>Scroll to begin the day</span>
            <i />
          </p>
          <p className="hero__tap t-label" aria-hidden="true">Tap the N</p>
        </div>
      </section>

      <Act id="open" n="I" word="EVERYDAY" title="One app for the whole day." italic={["whole"]} visual={<Screenshot screen="home" />}>
        <p className="t-lede">
          Morning plans, midday spending, the evening&rsquo;s journal. Everything you keep track of, in one place that feels
          like paper and works without a connection.
        </p>
        <div className="act__stats">
          <div>
            <p className="t-display t-num"><CountUp text="14" /></p>
            <p className="t-label">parts of life, one app</p>
          </div>
          <div>
            <p className="t-display t-num"><CountUp text="2" /></p>
            <p className="t-label">views of every screen</p>
          </div>
          <div>
            <p className="t-display t-num">0</p>
            <p className="t-label">ads or trackers</p>
          </div>
        </div>
      </Act>

      <Act id="capture" n="II" side="right" word="CAPTURE" title="Say it once. It finds its place." italic={["finds"]} visual={<Screenshot screen="quick-add" />}>
        <p className="t-lede">One line becomes a task, a note, an expense or an event. Type anything and press Capture.</p>
        <CaptureDemo />
      </Act>

      <Act id="views" n="III" word="Aa" title="Two ways to see the same day." italic={["same", "day."]} visual={<Screenshot screen="home" />}>
        <p className="t-lede">
          Keep scrolling and watch the phone change from <strong>Cards</strong>, tactile and alive, to <strong>Editorial</strong>,
          a quiet magazine page. Or switch it yourself: this whole site follows.
        </p>
        <ViewSwitch />
        <SpinPad />
      </Act>

      <section id="tour" data-act="tour" data-chapter="tour" className="act act--center act--tour" style={{ ["--len" as string]: 6, ["--n" as string]: TOUR.length }} aria-labelledby="tour-title">
        <div className="act__back" aria-hidden="true">
          <div className="tour__names">
            {TOUR.map(([name], i) => (
              <p key={name} className="tour__name" style={{ ["--i" as string]: i }}>{name}</p>
            ))}
          </div>
        </div>
        <div className="act__pin">
          <div className="wrap tour__grid">
            <div className="tour__head act__line" style={{ ["--k" as string]: 0 }}>
              <p className="act__kicker">
                <span className="act__n">IV</span>
                <span className="act__time t-num">09:00</span>
                <span className="act__label">The tour</span>
              </p>
              <h2 id="tour-title" className="t-h1 tour__title">
                One phone. <span className="it">Every world.</span>
              </h2>
            </div>
            <ol className="tour__caps">
              {TOUR.map(([name, line], i) => (
                <li key={name} className="tour__cap" style={{ ["--i" as string]: i }}>
                  <span className="tour__idx t-num">{String(i + 1).padStart(2, "0")} / {String(TOUR.length).padStart(2, "0")}</span>
                  <span className="tour__capname">{name}</span>
                  <span className="tour__line">{line}</span>
                </li>
              ))}
            </ol>
            <div className="tour__ticks" aria-hidden="true">
              {TOUR.map(([name], i) => (
                <span key={name} style={{ ["--i" as string]: i }}>
                  <b className="t-num">{String(i + 1).padStart(2, "0")}</b>
                  <em>{name}</em>
                </span>
              ))}
            </div>
            <div className="tour__lite">
              <Screenshot screen="home" />
            </div>
          </div>
          <span className="act__progress" aria-hidden="true" />
        </div>
      </section>

      <Act id="modules" n="V" side="center" title="Every part of life, in orbit." italic={["orbit."]} className="act--modules" len={2.4}>
        <div className="act__lite">
          <Deal />
        </div>
        <div className="act__foot">
          <p className="t-lede act__centerlede">Fourteen parts, one calm system. Tap a card to open it.</p>
          <PersonaPicker />
          <Marquee items={modules.map((m) => m.name)} />
        </div>
      </Act>

      <Act id="plan" n="VI" word="TODAY" title="Cross it off. Feel it." italic={["Feel"]} visual={<Screenshot screen="tasks" />}>
        <p className="t-lede">Write tasks the way you&rsquo;d say them. Finishing one draws an ink line through it. Go on:</p>
        <TaskTicker items={["Call the bank about the card", "Submit the lab report", "Book train to Pune", "Water the plants"]} />
      </Act>

      <Act id="focus" n="VII" word="FOCUS" title="Time, well kept." italic={["well", "kept."]} visual={<Screenshot screen="focus" />}>
        <p className="t-lede">
          A watchmaker&rsquo;s dial for deep work, with ambient sound and lock-screen controls. Scroll faster and the movement
          runs faster.
        </p>
        <FocusDial />
      </Act>

      <Act id="money" n="VIII" side="right" word="₹" title="Every rupee, accounted for." italic={["accounted"]} visual={<Screenshot screen="expenses" />}>
        <p className="t-lede">See what you can spend today, not just this month. Move the budget:</p>
        <SpendSlider />
      </Act>

      <Act id="evening" n="IX" night word="RITUAL" title="A small ritual, every evening." italic={["ritual,"]} className="act--evening" visual={<Screenshot screen="habits" />}>
        <p className="t-lede">Close the day with a check-in. The wax seal presses the ribbon N, and your run grows by one.</p>
        <HoldSeal />
        <StreakFill />
      </Act>

      <Act id="nodo" n="X" night word="NODO" title="A companion that forgets on request." italic={["forgets"]} visual={<Screenshot screen="nodo" />}>
        <AskNodo />
        <Memories />
      </Act>

      <Act
        id="privacy"
        n="XI"
        side="right"
        night
        word="YOURS"
        title="Nothing for sale. Everything yours."
        italic={["yours."]}
        // eslint-disable-next-line @next/next/no-img-element
        visual={<img src="/posters/og/og-privacy-dark.webp" alt="" width={1200} height={630} loading="lazy" />}
      >
        <StrikeBoard chapter="privacy" />
        <p className="t-label">
          <Scramble text="AES-256-GCM · ANDROID KEYSTORE · OPTIONAL E2E PASSPHRASE" />
        </p>
        <p className="muted">
          Synced data is end-to-end encrypted if you set a passphrase; without one it is protected in transit and at rest.{" "}
          <Link href="/privacy">Privacy policy</Link> · <Link href="/security">Security</Link>
        </p>
      </Act>

      <Act id="finale" n="XII" word="TOMORROW" title="Your life, curated." italic={["curated."]} className="act--finale" len={2.8} visual={<Screenshot screen="home" />}>
        <p className="t-h3">
          Get <Wordmark /> for Android.
        </p>
        <Magnetic>{cta}</Magnetic>
        <div className="row" style={{ gap: 18 }}>
          <div className="qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="t-label" style={{ maxWidth: 220 }}>
            Scan with your Android phone · version {release?.version_name ?? APP.versionName}
            <br />
            Or <Link href="/try">try it in your browser first</Link>.
          </p>
        </div>
      </Act>

      {testimonials.length > 0 && cfg.flags.testimonials && (
        <section className="section wrap" aria-label="What people say">
          <div className="grid-auto">
            {testimonials.map((t) => (
              <figure key={t.id} className="card pad" style={{ margin: 0 }}>
                <blockquote className="t-h3 it" style={{ margin: 0 }}>&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="t-label">{t.name}{t.handle ? ` · ${t.handle}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="section wrap why-wrap" aria-labelledby="why-title">
        <h2 id="why-title" className="t-h2">Why people switch</h2>
        <div className="why">
          {[
            ["Private", "No account needed. Everything is encrypted on your phone; we never see it unless you sync."],
            ["No ads", "No ads and no trackers, in the app or on this site."],
            ["Offline", "Everything works without a connection. Sync catches up later."],
            ["Battery", "Animations pause off-screen; reminders use Android's own alarm system."],
            ["Portable", "Encrypted backups, CSV and .ics export, and a JSON copy of synced data on the web."],
            ["Easy to leave", "Delete your account and its cloud data in the app or on the web, instantly."],
          ].map(([h, b], i) => (
            <div key={h} className="why__card card pad" style={{ ["--i" as string]: i }}>
              <p className="why__n t-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</p>
              <p className="t-h3" style={{ margin: 0 }}>{h}</p>
              <p className="muted" style={{ margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>
      </section>
    </FilmProvider>
  );
}
