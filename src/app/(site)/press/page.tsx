import type { Metadata } from "next";
import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { PageHeader } from "@/components/site/PageHeader";
import app from "@/content/generated/app.json";
import { colors } from "@/content/generated/tokens";
import { posters } from "@/content/posters";
import { modules } from "@/content/site";

export const metadata: Metadata = { title: "Press kit", description: "Logos, posters, screenshots, palette and a fact sheet for NOTtEodo.", alternates: { canonical: "/press" } };

export default function PressPage() {
  const play = posters.filter((p) => p.series === "play");
  return (
    <>
      <PageHeader eyebrow="Press kit" title="Everything you need to write about NOTtEodo." italic={["write"]} />
      <section className="prose-wrap legal__body">
        <div className="legal__section">
          <h2 className="t-h3">Boilerplate</h2>
          <p>
            NOTtEodo is a private, offline-first daily organiser for Android. It brings notes, tasks, a planner, habits, a focus dial,
            expenses, wardrobe, travel, a journal with voice memos, moodboards and shopping lists into one calm app with two views, Cards and
            Editorial, and a companion called Nodo. Everything is encrypted on the phone; an account is optional. It is free to use, with no ads
            or trackers, and made in India.
          </p>
        </div>
        <div className="legal__section">
          <h2 className="t-h3">Fact sheet</h2>
          <ul>
            <li>Platform: Android · package com.notteodo.notteodo · current version {app.versionName}</li>
            <li>Parts of the app: {modules.length} (see <Link href="/features">features</Link>)</li>
            <li>Price: free to use · no ads · no analytics SDKs</li>
            <li>Distribution: signed APK from this site; Google Play coming soon</li>
            <li>Source: MIT licence on GitHub</li>
          </ul>
        </div>
        <div className="legal__section">
          <h2 className="t-h3">Logos</h2>
          <div className="row" style={{ gap: 32 }}>
            <Monogram size={96} title="NOTtEodo monogram" />
            <Wordmark className="t-h1" />
          </div>
          <p>
            <a href="/monogram.svg" download>Monogram (SVG)</a> · <a href="/icon-512.png" download>App icon (PNG)</a> · <Link href="/brand">Brand guidelines</Link>
          </p>
        </div>
        <div className="legal__section">
          <h2 className="t-h3">Palette</h2>
          <div className="row">
            {(["canvas", "text", "accent", "rosewood", "noir", "bronze"] as const).map((k) => (
              <span key={k} className="chip"><span style={{ width: 14, height: 14, borderRadius: 4, background: colors.light[k], border: "1px solid var(--c-hairline)" }} />{k} {colors.light[k]}</span>
            ))}
          </div>
        </div>
        <div className="legal__section">
          <h2 className="t-h3">Screens and posters</h2>
          <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            {play.map((p) => (
              <a key={p.id} href={p.png ?? p.src} download>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.alt} loading="lazy" width={p.width} height={p.height} style={{ borderRadius: 10 }} />
              </a>
            ))}
          </div>
          <p>More in the <Link href="/gallery">poster gallery</Link>.</p>
        </div>
      </section>
    </>
  );
}
