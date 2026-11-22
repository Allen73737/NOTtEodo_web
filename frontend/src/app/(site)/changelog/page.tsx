import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { formatBytes, formatDate } from "@/lib/format";
import { APP, getReleases } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every NOTtEodo release, newest first. The same notes the app's update sheet shows.",
  alternates: { canonical: "/changelog", types: { "application/rss+xml": "/changelog/rss.xml" } },
};
export const revalidate = 300;

export default async function ChangelogPage() {
  const releases = await getReleases();
  return (
    <>
      <PageHeader
        eyebrow="Changelog"
        title="What changed, and when."
        italic={["when."]}
        lede={
          <>
            The same release notes the app shows in its update sheet. Subscribe with <a href="/changelog/rss.xml">RSS</a>.
          </>
        }
      />
      <section className="prose-wrap legal__body">
        {releases.length === 0 ? (
          <div className="legal__section">
            <p className="t-label">Version {APP.versionName}</p>
            <h2 className="t-h3">The first public release is on its way.</h2>
            <p>
              Release notes appear here as each version is published. <Link href="/download">Get notified</Link>.
            </p>
          </div>
        ) : (
          releases.map((r) => (
            <article key={r.id} className="legal__section" id={`v${r.version_name}`}>
              <p className="t-label">
                {formatDate(r.published_at)} · {r.channel === "beta" ? "Beta · " : ""}
                {formatBytes(r.file_size_bytes)}
              </p>
              <h2 className="t-h2">
                {r.version_name}
                {r.is_latest && <span className="chip" style={{ marginLeft: 12, verticalAlign: "middle" }}>Latest</span>}
              </h2>
              {r.release_notes_md
                .split("\n")
                .filter(Boolean)
                .map((l, i) => (
                  <p key={i}>{l.replace(/^[-*]\s*/, "· ")}</p>
                ))}
            </article>
          ))
        )}
      </section>
    </>
  );
}
