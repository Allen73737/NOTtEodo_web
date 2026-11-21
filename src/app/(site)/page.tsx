import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { FilmProvider } from "@/components/film/FilmProvider";
import { Intro } from "@/components/film/Intro";
import { AskNodo, CaptureDemo, ChapterRail, Deal, HeroInk, Letterpress, PersonaLede, PersonaPicker, StreakFill, StrikeBoard } from "@/components/film/interactive";
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
  { id: "modules", label: "Every part", time: "09:30" },
  { id: "plan", label: "Plan", time: "10:15" },
  { id: "focus", label: "Focus", time: "11:30" },
  { id: "money", label: "Money", time: "13:20" },
  { id: "evening", label: "Ritual", time: "21:30" },
  { id: "nodo", label: "Nodo", time: "22:00" },
  { id: "privacy", label: "Privacy", time: "23:00" },
  { id: "finale", label: "Tomorrow", time: "06:00" },
];

type ActProps = {
  id: string;
  n: string;
  title: string;
  italic?: string[];
  /** Which side the copy sits on; the 3D object takes the other. */
  side?: "left" | "right" | "center";
  night?: boolean;
  /** Shown instead of the 3D stage on the lite and reduced paths (and without JS). */
  visual?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

function Act({ id, n, title, italic, side = "left", night, visual, className, children }: ActProps) {
  const a = ACTS.find((x) => x.id === id)!;
  return (
    <section id={id} data-act={id} data-chapter={id} className={`act act--${side}${night ? " act--night" : ""} ${className ?? ""}`} aria-labelledby={`${id}-title`}>
      <div className="act__pin">
        <div className="wrap act__grid">
          <div className="act__copy">
            <p className="act__kicker">
              <span className="act__n">{n}</span>
              <span className="act__time t-num">{a.time}</span>
              <span className="act__label">{a.label}</span>
            </p>
            <h2 id={`${id}-title`} className="t-display act__title">
              <KineticText text={title} italicWords={italic} />
            </h2>
            {children}
          </div>
          {visual && side !== "center" && <div className="act__visual">{visual}</div>}
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
      <Intro />
      <ChapterRail chapters={ACTS} />

      {/* I. Dawn: the ribbon N floats in ink */}
      <section id="hero" data-act="hero" data-chapter="hero" className="act act--left act--hero" aria-labelledby="hero-title">
        <HeroInk />
        <div className="act__pin">
          <div className="wrap act__grid">
            <div className="act__copy hero__copy">
              <p className="t-eyebrow">{cfg.hero.eyebrow}</p>
              <h1 id="hero-title" className="t-mega hero__title">
                <KineticText text="Curate your everyday." italicWords={["everyday."]} start="mount" />
              </h1>
              <p className="t-lede hero__lede">
                <Wordmark /> keeps your notes, tasks, plans, habits, money, wardrobe, travel and journal in one calm, private app for Android.
              </p>
              <Magnetic>{cta}</Magnetic>
              <ul className="trust" aria-label="Promises">
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
        </div>
        <p className="hero__cue t-label" aria-hidden="true">
          <span>Scroll to begin the day</span>
          <i />
        </p>
        <p className="hero__tap t-label" aria-hidden="true">Tap the N</p>
      </section>

      <Act
        id="open"
        n="I"
        title="One app for the whole day."
        italic={["whole"]}
        visual={<Screenshot screen="home" />}
      >
        <p className="t-lede">
          Morning plans, midday spending, the evening&rsquo;s journal. Everything you keep track of, kept in one place that
          feels like paper and works without a connection.
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

      <Act id="capture" n="II" side="right" title="Say it once. It finds its place." italic={["finds"]} visual={<Screenshot screen="quick-add" />}>
        <p className="t-lede">
          One line becomes a task, a note, an expense or an event. Try it: type anything and press Capture.
        </p>
        <CaptureDemo />
        <p className="t-label">Also from the Quick Settings tile, the app icon&rsquo;s shortcuts, or the Android share sheet.</p>
      </Act>

      <Act id="views" n="III" title="Two ways to see the same day." italic={["same", "day."]} visual={<Screenshot screen="home" />}>
        <p className="t-lede">
          <strong>Cards</strong> is tactile and alive. <strong>Editorial</strong> is a quiet magazine page with rules instead of boxes.
          Switch here and the phone, and this whole site, follow.
        </p>
        <ViewSwitch />
        <SpinPad />
      </Act>

      <Act id="modules" n="IV" side="center" title="Every part of life, in orbit." italic={["orbit."]} className="act--modules">
        <div className="act__lite">
          <Deal />
        </div>
        <div className="act__foot">
          <p className="t-lede act__centerlede">Fourteen parts, one calm system. Tap a card to open it.</p>
          <PersonaPicker />
          <PersonaLede />
          <Marquee items={modules.map((m) => m.name)} />
        </div>
      </Act>

      <Act id="plan" n="V" title="Cross it off. Feel it." italic={["Feel"]} visual={<Screenshot screen="tasks" />}>
        <p className="t-lede">Write tasks the way you&rsquo;d say them. Finishing one draws an ink line through it. Go on:</p>
        <TaskTicker items={["Call the bank about the card", "Submit the lab report", "Book train to Pune", "Water the plants"]} />
        <p className="muted">Today · Upcoming · Anytime · Done. Events and dated tasks share one planner timeline.</p>
      </Act>

      <Act id="focus" n="VI" title="Time, well kept." italic={["well", "kept."]} visual={<Screenshot screen="focus" />}>
        <p className="t-lede">
          A watchmaker&rsquo;s dial for deep work, with ambient sound, lock-screen controls and a Quick Settings tile. Scroll
          faster and the movement runs faster.
        </p>
        <FocusDial />
      </Act>

      <Act id="money" n="VII" side="right" title="Every rupee, accounted for." italic={["accounted"]} visual={<Screenshot screen="expenses" />}>
        <p className="t-lede">See what you can spend today, not just this month. Move the budget and watch it change:</p>
        <SpendSlider />
        <Letterpress />
      </Act>

      <Act id="evening" n="VIII" night title="A small ritual, every evening." italic={["ritual,"]} visual={<Screenshot screen="habits" />}>
        <p className="t-lede">
          Close the day with a check-in: the wax seal presses the ribbon N. Runs grow, freezes cover the days life gets in the
          way, and badges arrive with a small ceremony.
        </p>
        <HoldSeal />
        <StreakFill />
      </Act>

      <Act id="nodo" n="IX" night title="A companion that forgets on request." italic={["forgets"]} visual={<Screenshot screen="nodo" />}>
        <AskNodo />
        <Memories />
        <p className="t-label">
          {cfg.nodo_cloud_opt_in
            ? "Without an account, Nodo works on the device. Cloud answers only if you say yes."
            : "Without an account, Nodo works on the device. Signed in, cloud answers can be switched off any time."}
        </p>
      </Act>

      <Act
        id="privacy"
        n="X"
        side="right"
        night
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
          Encrypted on your phone. Synced data is end-to-end encrypted if you set a passphrase; without one it is protected in
          transit and at rest. <Link href="/privacy">Privacy policy</Link> · <Link href="/security">Security</Link>
        </p>
      </Act>

      <section id="finale" data-act="finale" data-chapter="finale" className="act act--left act--finale" aria-labelledby="finale-title">
        <div className="act__pin">
          <div className="wrap act__grid">
            <div className="act__copy">
              <p className="act__kicker">
                <span className="act__n">XI</span>
                <span className="act__time t-num">06:00</span>
                <span className="act__label">Tomorrow</span>
              </p>
              <h2 id="finale-title" className="t-display">
                <KineticText text="Your life, curated." italicWords={["curated."]} />
              </h2>
              <p className="t-h3">
                Get <Wordmark /> for Android.
              </p>
              <Magnetic>{cta}</Magnetic>
              <div className="row" style={{ gap: 18 }}>
                <div className="qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
                <p className="t-label" style={{ maxWidth: 220 }}>
                  Scan with your Android phone · version {release?.version_name ?? APP.versionName}
                </p>
              </div>
              <p className="t-label">
                Or <Link href="/try">try it in your browser first</Link>.
              </p>
            </div>
            <div className="act__visual">
              <Screenshot screen="home" />
            </div>
          </div>
        </div>
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
