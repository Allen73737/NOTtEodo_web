import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { Wordmark } from "@/components/brand/Wordmark";
import { FilmProvider } from "@/components/film/FilmProvider";
import {
  AaWipe,
  AskNodo,
  CaptureDemo,
  ChapterRail,
  Deal,
  HeroInk,
  Letterpress,
  PersonaLede,
  PersonaPicker,
  Preloader,
  StreakFill,
  StrikeBoard,
  StrikeList,
} from "@/components/film/interactive";
import { Stage } from "@/components/film/Stage";
import { Screenshot } from "@/components/shots/Screenshot";
import { DownloadCta } from "@/components/site/DownloadCta";
import { JsonLd } from "@/components/site/JsonLd";
import { colors } from "@/content/generated/tokens";
import { modules } from "@/content/site";
import { siteUrl } from "@/lib/env";
import { APP, getConfig, getLatestRelease, getTestimonials } from "@/lib/platform";
import { CountUp, KineticText, Marquee, Reveal, Scramble } from "@/motion/primitives";

export const metadata: Metadata = {
  title: { absolute: "NOTtEodo: Notes. Tasks. Life. | Curate your everyday." },
  alternates: { canonical: "/" },
  openGraph: { images: [{ url: "/posters/og/og-default-light.png", width: 1200, height: 630 }] },
};
export const revalidate = 120;

const CHAPTERS = [
  { id: "hero", label: "Curate" },
  { id: "aa", label: "Two views" },
  { id: "deal", label: "Every part" },
  { id: "capture", label: "Capture" },
  { id: "curate", label: "Curate" },
  { id: "plan", label: "Plan" },
  { id: "rhythm", label: "Rhythm" },
  { id: "movement", label: "Focus" },
  { id: "money", label: "Money" },
  { id: "wardrobe", label: "Wardrobe & travel" },
  { id: "remember", label: "Remember" },
  { id: "nodo", label: "Nodo" },
  { id: "widgets", label: "Widgets" },
  { id: "privacy", label: "Privacy" },
  { id: "free", label: "Free" },
  { id: "try", label: "Try it" },
  { id: "finale", label: "Download" },
];

function Chapter({ id, n, title, italic, children, tall, className }: { id: string; n: string; title: string; italic?: string[]; children: React.ReactNode; tall?: boolean; className?: string }) {
  return (
    <section id={id} data-chapter={id} className={`chapter${tall ? " chapter--tall" : ""} ${className ?? ""}`} aria-labelledby={`${id}-title`}>
      <div className="chapter__sticky">
        <div className="wrap chapter__inner">
          <p className="chapter__num" aria-hidden="true">{n}</p>
          <h2 id={`${id}-title`} className="t-display chapter__title">
            <KineticText text={title} italicWords={italic} />
          </h2>
          {children}
        </div>
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
      <Preloader />
      <ChapterRail chapters={CHAPTERS} />

      {/* I. Hero: ink in water */}
      <section id="hero" data-chapter="hero" className="hero" aria-labelledby="hero-title">
        <HeroInk />
        <div className="wrap hero__inner">
          <div className="hero__copy">
            <p className="t-eyebrow">{cfg.hero.eyebrow}</p>
            <h1 id="hero-title" className="t-mega hero__title">
              <KineticText text="Curate your everyday." italicWords={["everyday."]} start="mount" />
            </h1>
            <p className="t-lede hero__lede">
              <Wordmark /> holds your notes, tasks, plans, habits, money, wardrobe, travel and journal in one calm, private app for Android.
            </p>
            {cta}
            <ul className="trust" aria-label="Promises">
              <li>Free</li>
              <li>No ads</li>
              <li>No trackers</li>
              <li>Works offline</li>
              <li>Encrypted on your phone</li>
            </ul>
          </div>
          <Stage kind="phone" chapter="hero" screen="home" className="hero__stage" fallback={<Screenshot screen="home" priority />} />
        </div>
        <a href="#aa" className="hero__scroll t-label">Scroll</a>
      </section>

      <Chapter id="aa" n="II" title="Two ways to see the same day." italic={["same", "day."]}>
        <div className="split">
          <div className="stack">
            <p className="t-lede">
              <strong>Cards view</strong> is tactile and alive. <strong>Editorial view</strong> is a quiet magazine page with rules
              instead of boxes. The app switches with its Aa pill, and so does this whole site. Drag across the phone to try it.
            </p>
            <p className="t-lede">Ivory by day. Pure OLED black by night.</p>
          </div>
          <AaWipe />
        </div>
      </Chapter>

      <Chapter id="deal" n="III" title="One app, every part of life." italic={["every"]} tall>
        <PersonaPicker />
        <PersonaLede />
        <Deal />
        <Marquee items={modules.map((m) => m.name)} />
      </Chapter>

      <Chapter id="capture" n="IV" title="Say it once. It finds its place." italic={["finds"]}>
        <div className="split">
          <div className="stack">
            <p className="t-lede">
              One line becomes a task, a note, an expense or an event. Capture from the Home chip, the dock, the app icon&rsquo;s
              shortcuts, the Quick Settings tile, or share text, links and photos in from any app.
            </p>
            <ul className="facts-list">
              <li>Quick Settings tiles: Quick Capture, Voice Memo, Focus</li>
              <li>Long-press the icon: Capture · Voice · Focus</li>
              <li>Android share sheet: text, links, photos</li>
            </ul>
          </div>
          <CaptureDemo />
        </div>
      </Chapter>

      <Chapter id="curate" n="V" title="Your thoughts, connected." italic={["connected."]}>
        <div className="split">
          <div className="stack">
            <p className="t-lede">
              See your notes as a map of linked ideas. Ask your notes a question and the answer points back to the notes it came from.
            </p>
            <Constellation />
          </div>
          <Screenshot screen="notes" />
        </div>
      </Chapter>

      <Chapter id="plan" n="VI" title="Cross it off. Feel it." italic={["Feel"]} tall>
        <div className="split">
          <div className="stack">
            <p className="t-lede">Write tasks the way you&rsquo;d say them. Finishing one draws an ink line through it, just like this:</p>
            <StrikeList chapter="plan" items={["Call the bank about the card", "Submit the lab report", "Book train to Pune"]} />
            <p className="muted">Today · Upcoming · Anytime · Done. Events and dated tasks share one planner timeline.</p>
          </div>
          <div className="stack-shots">
            <Screenshot screen="tasks" />
            <Screenshot screen="planner" className="stack-shots__back" />
          </div>
        </div>
      </Chapter>

      <Chapter id="rhythm" n="VII" title="A small ritual, every day." italic={["ritual,"]} tall>
        <div className="split">
          <div className="stack">
            <p className="t-lede">
              Close the day with a check-in: press and hold the wax seal and the ribbon N is pressed into it. Streaks grow, freezes
              cover the days life gets in the way, and badges arrive with a small ceremony.
            </p>
            <StreakFill />
          </div>
          <Stage kind="seal" chapter="rhythm" fallback={<Screenshot screen="habits" />} />
        </div>
      </Chapter>

      <Chapter id="movement" n="VIII" title="Time, well kept." italic={["well", "kept."]} tall className="chapter--dark">
        <div className="split">
          <Stage kind="movement" chapter="movement" fallback={<Screenshot screen="focus" />} />
          <div className="stack">
            <p className="t-lede">
              A watchmaker&rsquo;s dial for deep work. 15, 25, 45, 60 or 90 minutes, or your own; ambient sound such as rain;
              lock-screen controls; and a Quick Settings tile to start without opening the app.
            </p>
            <Screenshot screen="focus" className="phone--small" />
          </div>
        </div>
      </Chapter>

      <Chapter id="money" n="IX" title="Every rupee, accounted for." italic={["accounted"]}>
        <div className="split">
          <div className="stack">
            <p className="t-display t-num money__figure">
              <CountUp text="₹24,500" />
            </p>
            <p className="t-label">An example monthly budget</p>
            <p className="t-lede">
              See what you can spend today, not just this month. Category envelopes, subscriptions, splitting a bill and who owes whom,
              and CSV in and out.
            </p>
            <Letterpress />
          </div>
          <Screenshot screen="expenses" />
        </div>
      </Chapter>

      <Chapter id="wardrobe" n="X" title="Dressed for the day. Packed for the trip." italic={["Dressed", "Packed"]}>
        <div className="split">
          <div className="outfit card pad" aria-label="Illustration: an outfit built from garments">
            {["Linen shirt", "Oxblood scarf", "Ivory trousers", "Leather loafers"].map((g, i) => (
              <span key={g} className="outfit__piece" style={{ ["--i" as string]: i }}>{g}</span>
            ))}
            <p className="t-label">Garments with photos, season and fabric · an outfit-of-the-day widget</p>
          </div>
          <div className="passport card pad" aria-label="Illustration: a travel stamp">
            <p className="t-eyebrow" style={{ color: "var(--c-bronze)" }}>Travel</p>
            <p className="passport__stamp">GOA · 12 DEC</p>
            <p className="muted">A countdown to departure, packing by essentials, clothing, electronics and toiletries, shared trip costs settled fairly.</p>
          </div>
        </div>
      </Chapter>

      <Chapter id="remember" n="XI" title="Keep what mattered." italic={["mattered."]}>
        <div className="split">
          <div className="stack">
            <p className="t-lede">
              Journal entries with a mood. Voice memos you can turn into a note, task or expense. Polaroid-style moodboards with a
              handwritten note on the back. <em>Your week</em> compares the last seven days with the seven before; the{" "}
              <em>Evening review</em> closes the day; <em>Zen mode</em> hides everything but today&rsquo;s essentials.
            </p>
            <svg className="wave" viewBox="0 0 600 80" aria-hidden="true" preserveAspectRatio="none">
              <path pathLength={1} d="M0 40 C 20 10, 40 70, 60 40 S 100 5, 120 40 S 160 75, 180 40 S 220 15, 240 40 S 280 70, 300 40 S 340 2, 360 40 S 400 78, 420 40 S 460 20, 480 40 S 520 66, 540 40 S 580 30, 600 40" />
            </svg>
          </div>
          <div className="strip" aria-label="Posters">
            {["cover-notes-notes-light", "type-remember-light", "collage-light", "swiss-notes-light"].map((id) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={id} src={`/posters/${id.split("-")[0] === "type" ? "typographic" : id.startsWith("cover") ? "covers" : id.startsWith("collage") ? "collage" : "swiss"}/${id}.webp`} alt="" loading="lazy" width={540} height={675} />
            ))}
          </div>
        </div>
      </Chapter>

      <Chapter id="nodo" n="XII" title="A companion that forgets on request." italic={["forgets"]}>
        <div className="split">
          <div className="stack">
            <AskNodo />
            <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <div className="card pad"><p className="t-eyebrow">On the device</p><p style={{ margin: 0 }}>Without an account, Nodo searches your own items on your phone. Nothing leaves.</p></div>
              <div className="card pad">
                <p className="t-eyebrow">In the cloud</p>
                <p style={{ margin: 0 }}>
                  {cfg.nodo_cloud_opt_in
                    ? "Only if you say yes: your question and the matching items go to an AI provider that may not train on them."
                    : "When signed in, cloud Nodo sends your question and matching items to an AI provider that may not train on them. Turn it off any time."}
                </p>
              </div>
              <div className="card pad"><p className="t-eyebrow">Memory you can see</p><p style={{ margin: 0 }}>Read every memory Nodo keeps, and erase one or all.</p></div>
            </div>
          </div>
          <Screenshot screen="nodo" />
        </div>
      </Chapter>

      <Chapter id="widgets" n="XIII" title="Your day, before you open the app." italic={["before"]}>
        <div className="homescreen" aria-label="Illustration: NOTtEodo widget styles on an Android home screen">
          {["Sticky memo", "Daily checklist", "Polaroid pin", "Outfit of the day", "Budget meter", "Voice memo", "Boarding pass", "Focus clock"].map((w, i) => (
            <div key={w} className={`widget widget--${i}`} style={{ ["--i" as string]: i }}>
              <span className="t-label">{w}</span>
            </div>
          ))}
          <p className="t-label homescreen__note">Illustration of the eight widget styles from the app&rsquo;s Widget Studio.</p>
        </div>
      </Chapter>

      <Chapter id="privacy" n="XIV" title="Nothing for sale. Everything yours." italic={["yours."]} tall className="chapter--dark">
        <div className="split">
          <Stage kind="vault" chapter="privacy" fallback={<img src="/posters/og/og-privacy-dark.webp" alt="" width={1200} height={630} loading="lazy" />} />
          <div className="stack">
            <Reveal className="promises">
              <p className="t-h2">Encrypted on your phone.</p>
              <p className="t-h2">Yours to delete, everywhere.</p>
              <p className="t-h2">No ads. No trackers.</p>
            </Reveal>
            <p className="t-label">
              <Scramble text="AES-256-GCM · ANDROID KEYSTORE · OPTIONAL E2E PASSPHRASE" />
            </p>
            <p className="muted">
              Synced data is end-to-end encrypted only if you set a passphrase; without one it is protected in transit and at rest.{" "}
              <Link href="/privacy">Privacy policy</Link> · <Link href="/security">Security</Link>
            </p>
          </div>
        </div>
      </Chapter>

      <Chapter id="free" n="XV" title="Free to use." italic={["use."]} tall>
        <StrikeBoard />
      </Chapter>

      <section id="try" data-chapter="try" className="section wrap try" aria-labelledby="try-title">
        <p className="chapter__num" aria-hidden="true">XVI</p>
        <h2 id="try-title" className="t-display">
          Don&rsquo;t take our word for it. <span className="it">Touch it.</span>
        </h2>
        <p className="t-lede">Capture a line, strike a task, set the Focus Dial and press the seal in a working simulation of the app.</p>
        <Link href="/try" className="btn" data-cursor="Play">Open the simulator</Link>
      </section>

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

      <section className="section wrap" aria-labelledby="why-title">
        <h2 id="why-title" className="t-h2">Why people switch</h2>
        <div className="grid-auto why">
          {[
            ["Private", "No account needed. Everything is encrypted on your phone; we never see it unless you sync."],
            ["Free", "No subscription, no ads, no paywall in the app today."],
            ["Offline", "Everything works without a connection. Sync catches up later."],
            ["Battery", "Animations pause off-screen; reminders use Android's own alarm system."],
            ["Your data, portable", "Encrypted backups, CSV and .ics export, and a JSON copy of synced data on the web."],
            ["Easy to leave", "Delete your account and its cloud data in the app or on the web, instantly."],
            ["AI is optional", "Nodo works on the device without an account; cloud answers can be switched off."],
          ].map(([h, b]) => (
            <div key={h} className="card pad">
              <p className="t-eyebrow">{h}</p>
              <p style={{ margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="finale" data-chapter="finale" className="finale" aria-labelledby="finale-title">
        <div className="wrap finale__inner">
          <Stage kind="phone-finale" chapter="finale" screen="home" className="finale__stage" fallback={<Screenshot screen="home" />} />
          <div className="stack finale__copy">
            <p className="chapter__num" aria-hidden="true">XVII</p>
            <h2 id="finale-title" className="t-display">
              <span className="it">Your life, curated.</span>
            </h2>
            <p className="t-h3">Download NOTtEodo.</p>
            {cta}
            <div className="row" style={{ gap: 18 }}>
              <div className="qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="t-label" style={{ maxWidth: 200 }}>
                Scan with your Android phone · version {release?.version_name ?? APP.versionName}
              </p>
            </div>
          </div>
        </div>
      </section>
    </FilmProvider>
  );
}

function Constellation() {
  const nodes = [
    [50, 50], [20, 30], [80, 25], [30, 75], [72, 78], [10, 60], [90, 55], [55, 15],
  ] as const;
  const links = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 6], [2, 7], [3, 5], [4, 6], [1, 7]] as const;
  return (
    <svg className="constellation" viewBox="0 0 100 100" aria-label="Illustration: notes linked as a map">
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} pathLength={1} style={{ ["--i" as string]: i }} />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 3.2 : 2} />
      ))}
    </svg>
  );
}
