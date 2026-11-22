import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import QRCode from "qrcode";
import { LiveRelease } from "@/components/download/LiveRelease";
import { Subscribe } from "@/components/download/Subscribe";
import { Notices } from "@/components/download/Notices";
import { PhoneInstall } from "@/components/download/PhoneInstall";
import { Screenshot } from "@/components/shots/Screenshot";
import { Chapter } from "@/components/site/Chapter";
import { PageHeader } from "@/components/site/PageHeader";
import { colors } from "@/content/generated/tokens";
import { siteUrl } from "@/lib/env";
import { getConfig, getLatestRelease } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Get NOTtEodo for Android: the APK with its checksum and verification steps, and Google Play when it arrives.",
  alternates: { canonical: "/download" },
  openGraph: { images: ["/posters/og/og-download-light.webp"] },
};
export const revalidate = 120;

export default async function DownloadPage() {
  const [cfg, release] = await Promise.all([getConfig(), getLatestRelease()]);
  const qr = await QRCode.toString(`${siteUrl}/open/release/latest`, {
    type: "svg",
    margin: 0,
    color: { dark: colors.light.ink, light: "#00000000" },
  });

  return (
    <>
      <PageHeader
        eyebrow={cfg.play_live ? "Download" : "Early access · Android"}
        title="Bring it to your phone."
        italic={["phone."]}
        lede={
          cfg.play_live
            ? "Google Play is the recommended way to install NOTtEodo: it keeps the app updated for you. The APK is here for phones without Play."
            : "NOTtEodo is coming to Google Play. Until then, install the signed APK below and verify it in a minute."
        }
        aside={<Screenshot screen="home" priority />}
        word="Android"
      />
      <PhoneInstall release={release} playLive={cfg.play_live} playUrl={cfg.urls.play} />
      <Suspense fallback={null}>
        <Notices />
      </Suspense>

      <Chapter id="get" n="01" label="Get it" title="Three ways onto your phone.">
        <div className="download-grid">
          <div className="stack" style={{ gap: 24 }}>
            {cfg.play_live ? (
              <div className="card pad stack">
                <p className="t-eyebrow">Recommended</p>
                <p className="t-h3">Google Play, with automatic updates.</p>
                <a className="btn" href={cfg.urls.play} rel="noopener">
                  Get it on Google Play
                </a>
              </div>
            ) : (
              <div className="card pad stack">
                <p className="t-eyebrow">Google Play · coming soon</p>
                <p className="t-h3">Be told the day it lands.</p>
                <Subscribe topic="play_launch" label="Your email" />
              </div>
            )}
            <LiveRelease initial={release} />
            <div className="card pad row qr-card" style={{ gap: 20, alignItems: "center" }}>
              <div className="qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
              <div>
                <p className="t-h3" style={{ margin: 0 }}>
                  On a computer?
                </p>
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  Scan with your Android phone to open this page there.
                </p>
              </div>
            </div>
          </div>
          <div className="download-visual">
            <ol className="download-steps">
              <li>
                <span className="t-num">01</span> Download the APK
              </li>
              <li>
                <span className="t-num">02</span> Check its SHA-256
              </li>
              <li>
                <span className="t-num">03</span> Allow this one install
              </li>
              <li>
                <span className="t-num">04</span> Open NOTtEodo
              </li>
            </ol>
          </div>
        </div>
      </Chapter>

      <Chapter id="verify" n="02" label="Verify the file" title="A minute that's worth it." tone="ink">
        <p className="t-lede">
          Compare the SHA-256 shown above with the file you downloaded. If they differ, delete the file and
          don&rsquo;t install it.
        </p>
        <ul>
          <li>
            <strong>Windows (PowerShell):</strong>{" "}
            <code>Get-FileHash .\NOTtEodo-*.apk -Algorithm SHA256</code>
          </li>
          <li>
            <strong>macOS:</strong> <code>shasum -a 256 NOTtEodo-*.apk</code>
          </li>
          <li>
            <strong>Linux:</strong> <code>sha256sum NOTtEodo-*.apk</code>
          </li>
          <li>
            <strong>Android:</strong> use a hash-checker app from Google Play and pick the APK in Downloads.
          </li>
          <li>
            <strong>Signature (advanced):</strong> <code>apksigner verify --print-certs NOTtEodo-*.apk</code>{" "}
            should show the signing certificate SHA-256 listed above.
          </li>
        </ul>
      </Chapter>
      <Chapter id="install" n="03" label="Install it safely" title="Four taps, once.">
        <ol className="install-steps">
          <li>Download the APK on your phone (or scan the code above).</li>
          <li>Open it from your notifications or the Files app.</li>
          <li>
            If Android asks, allow your browser or Files app to <em>install unknown apps</em> for this one
            install. You can switch it off again afterwards in Settings → Apps → Special app access.
          </li>
          <li>Tap Install. Play Protect may scan it first; that&rsquo;s normal.</li>
        </ol>
        <p>
          Only install NOTtEodo from this website or Google Play. When NOTtEodo arrives on Google Play, it
          will update the version you installed here. Your notes stay where they are.
        </p>
      </Chapter>
      <Chapter id="updates" n="04" label="Stay up to date" title="One email per release. Nothing else.">
        <Subscribe topic="releases" label="Email me when a new version ships" />
        <p>
          Or follow the <Link href="/changelog">changelog</Link> (<a href="/changelog/rss.xml">RSS</a>).
        </p>
      </Chapter>
    </>
  );
}
