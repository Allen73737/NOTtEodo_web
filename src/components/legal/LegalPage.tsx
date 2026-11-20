import Link from "next/link";
import type { ReactNode } from "react";
import { getLegalVersions } from "@/lib/platform";
import { formatDate } from "@/lib/format";

export type LegalDoc = "privacy" | "terms" | "child-safety" | "cookies" | "data-safety" | "accessibility";

/** Built-in version history. A newer row in `legal_documents` (published from /admin) takes precedence. */
export const LEGAL_META: Record<LegalDoc, { version: string; effective: string; log: { version: string; date: string; change: string }[] }> = {
  privacy: {
    version: "1.0",
    effective: "2026-11-21",
    log: [
      {
        version: "1.0",
        date: "2026-11-21",
        change:
          "Rewritten from the app's code: Nodo memory, voice transcription, the password breach check, font loading, image links, retention periods, your rights under Indian law and the website itself are now covered.",
      },
    ],
  },
  terms: { version: "1.0", effective: "2026-11-21", log: [{ version: "1.0", date: "2026-11-21", change: "First published." }] },
  "child-safety": { version: "1.0", effective: "2026-11-21", log: [{ version: "1.0", date: "2026-11-21", change: "First published." }] },
  cookies: { version: "1.0", effective: "2026-11-21", log: [{ version: "1.0", date: "2026-11-21", change: "First published." }] },
  "data-safety": { version: "1.0", effective: "2026-11-21", log: [{ version: "1.0", date: "2026-11-21", change: "First published." }] },
  accessibility: { version: "1.0", effective: "2026-11-21", log: [{ version: "1.0", date: "2026-11-21", change: "First published." }] },
};

export type Section = { id: string; title: string; body: ReactNode };

/**
 * Legal pages: server-rendered, no JS required, no 3D, stable URLs, print-clean.
 * A plain-English summary card, a table of contents, version and effective date, and a change log.
 */
export async function LegalPage({
  doc,
  title,
  summary,
  sections,
}: {
  doc: LegalDoc;
  title: string;
  summary: ReactNode;
  sections: Section[];
}) {
  const published = (await getLegalVersions()).filter((d) => d.doc === doc);
  const meta = LEGAL_META[doc];
  const latest = published[0];
  const version = latest?.version ?? meta.version;
  const effective = latest?.effective_date ?? meta.effective;
  const log = [
    ...published.map((p) => ({ version: p.version, date: p.effective_date, change: p.summary_of_changes })),
    ...meta.log.filter((l) => !published.some((p) => p.version === l.version)),
  ];

  return (
    <article className="legal">
      <div className="deckle" aria-hidden="true" />
      <header className="legal__head prose-wrap">
        <p className="t-eyebrow">
          <Link href="/">NOTtEodo</Link> · Legal
        </p>
        <h1 className="t-h1">{title}</h1>
        <p className="t-label">
          Version {version} · Effective {formatDate(effective)}
        </p>
      </header>

      <div className="prose-wrap legal__body">
        <aside className="legal__summary card pad" aria-labelledby="summary">
          <h2 id="summary" className="t-h3">
            In plain English
          </h2>
          {summary}
        </aside>

        <nav className="legal__toc" aria-labelledby="toc">
          <h2 id="toc" className="t-label">
            Contents
          </h2>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="legal__section" aria-labelledby={`${s.id}-h`}>
            <h2 id={`${s.id}-h`} className="t-h3">
              <span className="legal__num t-num">{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </h2>
            {s.body}
          </section>
        ))}

        <section className="legal__section" aria-labelledby="changes">
          <h2 id="changes" className="t-h3">
            Changes to this document
          </h2>
          <table className="legal__table">
            <thead>
              <tr>
                <th scope="col">Version</th>
                <th scope="col">Date</th>
                <th scope="col">What changed</th>
              </tr>
            </thead>
            <tbody>
              {log.map((l) => (
                <tr key={l.version}>
                  <td className="t-num">{l.version}</td>
                  <td>{formatDate(l.date)}</td>
                  <td>{l.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="legal__back no-print">
          <Link href="/" className="btn btn-ghost">
            Back to NOTtEodo
          </Link>
        </p>
      </div>
    </article>
  );
}

/** Small helpers so legal copy stays readable. */
export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="legal__scroll">
      <table className="legal__table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
