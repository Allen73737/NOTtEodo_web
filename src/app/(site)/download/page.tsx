import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { LiveRelease } from "@/components/download/LiveRelease";
import { Subscribe } from "@/components/download/Subscribe";
import { Screenshot } from "@/components/shots/Screenshot";
import { PageHeader } from "@/components/site/PageHeader";
import { colors } from "@/content/generated/tokens";
import { siteUrl } from "@/lib/env";
import { getConfig, getLatestRelease } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Download",
  description: "Get NOTtEodo for Android: the APK with its checksum and verification steps, and Google Play when it arrives.",
  alternates: { canonical: "/download" },
  openGraph: { images: ["/posters/og/og-download-light.webp"] },
};
export const dynamic = "force-dynamic";

export default async function DownloadPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
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
      />
      {sp.subscribed === "1" && <Notice>You&rsquo;re confirmed. We&rsquo;ll write once, when it&rsquo;s time.</Notice>}
      {sp.unsubscribed === "1" && <Notice>You&rsquo;re unsubscribed. We won&rsquo;t email you again.</Notice>}
      {sp.missing === "1" && <Notice>That release isn&rsquo;t available any more. Here is the latest.</Notice>}

      <section className="wrap download-grid">
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
          <div className="card pad row" style={{ gap: 20, alignItems: "center" }}>
            <div className="qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
            <div>
              <p className="t-h3" style={{ margin: 0 }}>On a computer?</p>
              <p className="muted" style={{ margin: "6px 0 0" }}>Scan with your Android phone to open this page there.</p>
            </div>
          </div>
        </div>
        <div className="download-visual">
          <Screenshot screen="home" priority />
        </div>
      </section>

      <section className="section prose-wrap legal__body" aria-labelledby="verify">
        <div className="legal__section">
          <h2 id="verify" className="t-h2">
            Verify the file
          </h2>
          <p>
            Compare the SHA-256 shown above with the file you downloaded. If they differ, delete the file and don&rsquo;t install it.
          </p>
          <ul>
            <li>
              <strong>Windows (PowerShell):</strong> <code>Get-FileHash .\NOTtEodo-*.apk -Algorithm SHA256</code>
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
              <strong>Signature (advanced):</strong> <code>apksigner verify --print-certs NOTtEodo-*.apk</code> should show the signing
              certificate SHA-256 listed above.
            </li>
          </ul>
        </div>
        <div className="legal__section">
          <h2 className="t-h2">Install it safely</h2>
          <ol>
            <li>Download the APK on your phone (or scan the code above).</li>
            <li>Open it from your notifications or the Files app.</li>
            <li>
              If Android asks, allow your browser or Files app to <em>install unknown apps</em> for this one install. You can switch
              it off again afterwards in Settings → Apps → Special app access.
            </li>
            <li>Tap Install. Play Protect may scan it first; that&rsquo;s normal.</li>
          </ol>
          <p>
            Only install NOTtEodo from this website or Google Play. When NOTtEodo arrives on Google Play, it will update the version
            you installed here. Your notes stay where they are.
          </p>
        </div>
        <div className="legal__section">
          <h2 className="t-h2">Stay up to date</h2>
          <Subscribe topic="releases" label="Email me when a new version ships" />
          <p>
            Or follow the <Link href="/changelog">changelog</Link> (<a href="/changelog/rss.xml">RSS</a>).
          </p>
        </div>
      </section>
    </>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap" role="status">
      <p className="card pad" style={{ margin: "0 0 24px" }}>
        {children}
      </p>
    </div>
  );
}
