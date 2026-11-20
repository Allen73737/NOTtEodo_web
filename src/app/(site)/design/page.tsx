import type { Metadata } from "next";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { MotionDemos } from "@/components/demos/MotionDemos";
import { Screenshot } from "@/components/shots/Screenshot";
import { PageHeader } from "@/components/site/PageHeader";
import { colors, motion } from "@/content/generated/tokens";
import { Reveal } from "@/motion/primitives";

export const metadata: Metadata = {
  title: "Design language",
  description: "NOTtEodo's Ivory & Oxblood palette in both modes, its type, its motion library and its two views.",
};

const showcase = ["canvas", "surface", "sheet", "hairline", "text", "text-muted", "accent", "accent-fill", "rosewood", "clay", "noir", "bronze"] as const;

export default function DesignPage() {
  return (
    <>
      <PageHeader
        eyebrow="Design language"
        title="Ivory, oxblood and a steady hand."
        italic={["steady", "hand."]}
        lede="Everything on this site is drawn from the app itself: the same colour tokens, the same three typefaces and the same motion timings, generated from the Flutter source on every build."
      />

      <section className="section wrap" aria-labelledby="palette">
        <h2 id="palette" className="t-h2">
          The palette, <span className="it">in both lights</span>
        </h2>
        <p className="t-lede">Ivory for daylight with warm shadows. Pure OLED black at night: no shadows, only hairlines and light. No blue, teal, green or gold anywhere.</p>
        {(["light", "dark"] as const).map((mode) => (
          <div key={mode} style={{ marginTop: 40 }}>
            <p className="t-label">{mode === "light" ? "Ivory · light mode" : "OLED · dark mode"}</p>
            <Reveal className="grid-auto" style={{ marginTop: 14 }}>
              {showcase.map((k) => (
                <div key={k} className="swatch">
                  <div className="swatch__chip" style={{ background: colors[mode][k] }} />
                  <span className="t-label">
                    {k} · {colors[mode][k]}
                  </span>
                </div>
              ))}
            </Reveal>
          </div>
        ))}
      </section>

      <section className="section wrap" aria-labelledby="type">
        <h2 id="type" className="t-h2">
          Three faces, <span className="it">one voice</span>
        </h2>
        <div className="grid-auto" style={{ marginTop: 32 }}>
          <div className="card pad stack">
            <p className="t-label">Bodoni Moda · display</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "3rem", lineHeight: 1, margin: 0 }}>
              Curate your <span className="it">everyday.</span>
            </p>
          </div>
          <div className="card pad stack">
            <p className="t-label">DM Sans · reading</p>
            <p style={{ margin: 0 }}>Body text is DM Sans at a calm 1.6 line height, the same as the app’s bodyLg.</p>
          </div>
          <div className="card pad stack">
            <p className="t-label">Space Grotesk · figures and labels</p>
            <p className="t-num" style={{ fontSize: "2rem", margin: 0 }}>
              ₹2,227 / DAY
            </p>
          </div>
        </div>
        <div className="row" style={{ marginTop: 40, gap: 32 }}>
          <Monogram size={96} draw title="NOTtEodo monogram" />
          <Wordmark className="t-h1" variant="stroke" />
        </div>
      </section>

      <section className="section wrap" aria-labelledby="motion">
        <h2 id="motion" className="t-h2">
          Motion, <span className="it">ported from the app</span>
        </h2>
        <p className="t-lede">
          Silk out ({motion.easing.silk.join(", ")}) over {motion.duration.entrance} ms; things that land settle with a
          whisper of overshoot. Nothing tilts. Each demo below is the web twin of a file in <code>core/motion</code>.
        </p>
        <div style={{ marginTop: 32 }}>
          <MotionDemos />
        </div>
      </section>

      <section className="section wrap" aria-labelledby="views">
        <h2 id="views" className="t-h2">
          Cards view <span className="it">and</span> Editorial view
        </h2>
        <p className="t-lede">Use the Aa pill in the bar above. The whole site, and every screenshot, switches with it.</p>
        <div className="row" style={{ marginTop: 32, gap: 32, alignItems: "flex-start" }}>
          <Screenshot screen="home" />
          <Screenshot screen="expenses" />
        </div>
      </section>
    </>
  );
}
