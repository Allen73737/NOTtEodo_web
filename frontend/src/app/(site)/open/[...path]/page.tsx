import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Monogram } from "@/components/brand/Monogram";
import { DownloadCta } from "@/components/site/DownloadCta";
import { colors } from "@/content/generated/tokens";
import { siteUrl } from "@/lib/env";
import { getConfig, getLatestRelease } from "@/lib/platform";
import { OpenInApp } from "./OpenInApp";

export const metadata: Metadata = { title: "Open in NOTtEodo", robots: { index: false } };

/**
 * App Link landings. With the app installed on Android, the verified link opens the app
 * before this page loads. Otherwise: "Open in app" (custom scheme), then download, plus a QR
 * code on desktop. `app` is the target the app's deep-link handler understands today.
 */
const ROUTES: Record<string, { title: string; app: string; fallback?: string; supported: boolean }> = {
  capture: { title: "Quick Capture", app: "capture", supported: true },
  focus: { title: "the Focus Dial", app: "focus", supported: true },
  "note/new": { title: "a new note", app: "note/new", supported: false },
  "task/new": { title: "a new task", app: "task/new", supported: false },
  "expense/new": { title: "a new expense", app: "expense/new", supported: false },
  "settings/account": { title: "Account & sync", app: "settings/account", fallback: "/account", supported: false },
  "release/latest": { title: "the update screen", app: "release/latest", fallback: "/download", supported: false },
  notes: { title: "Notes", app: "notes", supported: true },
  tasks: { title: "Tasks", app: "tasks", supported: true },
  planner: { title: "the Planner", app: "planner", supported: true },
  habits: { title: "Habits", app: "habits", supported: true },
  expenses: { title: "Expenses", app: "expenses", supported: true },
  wardrobe: { title: "Wardrobe", app: "wardrobe", supported: true },
  travel: { title: "Travel", app: "travel", supported: true },
  journal: { title: "the Journal", app: "journal", supported: true },
  moodboard: { title: "the Moodboard", app: "moodboard", supported: true },
  shopping: { title: "Shopping", app: "shopping", supported: true },
};

export default async function OpenPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join("/");
  const feedback = /^feedback\/([0-9a-f-]{36})$/i.exec(key);
  const route = feedback
    ? { title: "your feedback thread", app: key, fallback: "/account", supported: false }
    : ROUTES[key];
  if (!route) notFound();

  const [cfg, release] = await Promise.all([getConfig(), getLatestRelease()]);
  const url = `${siteUrl}/open/${key}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 0, color: { dark: colors.light.ink, light: "#00000000" } });

  return (
    <section className="wrap open-page">
      <Monogram size={72} draw className="open-page__mark" title="NOTtEodo" />
      <p className="t-eyebrow">Open in NOTtEodo</p>
      <h1 className="t-h1">
        Continue to <span className="it">{route.title}</span>.
      </h1>
      <OpenInApp target={route.app} />
      <div className="open-page__grid">
        <div className="card pad stack">
          <p className="t-h3" style={{ margin: 0 }}>Don&rsquo;t have the app yet?</p>
          <DownloadCta release={release} playLive={cfg.play_live} playUrl={cfg.urls.play} />
          {route.fallback && (
            <Link href={route.fallback} className="btn btn-quiet">
              Continue on the web instead
            </Link>
          )}
        </div>
        <div className="card pad stack cards-only" style={{ alignItems: "center" }}>
          <div className="qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="t-label">On a computer? Scan with your phone.</p>
        </div>
      </div>
      {!route.supported && (
        <p className="t-label" style={{ marginTop: 24 }}>
          This link needs the next app update; older versions open the Home screen.
        </p>
      )}
    </section>
  );
}
