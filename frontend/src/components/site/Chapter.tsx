import { Monogram } from "@/components/brand/Monogram";

/**
 * The inner pages' section layout: a numbered head that stays in view on the left while the
 * section's content scrolls on the right (stacked on phones). Every inner page uses it, so all
 * sections hang from the same two lines.
 */
export function Chapter({
  id,
  n,
  label,
  title,
  lede,
  tone,
  children,
}: {
  id?: string;
  n: string;
  label: string;
  title?: React.ReactNode;
  lede?: React.ReactNode;
  /** "ink": the page's one dark band, for proof and hands-on sections (see folio.css). */
  tone?: "ink";
  children: React.ReactNode;
}) {
  const head = id ? `${id}-head` : undefined;
  return (
    <section id={id} className={`chapter${tone ? ` chapter--${tone}` : ""}`} aria-labelledby={head}>
      <div className="wrap chapter__grid">
        <header className="chapter__head">
          <p className="chapter__n" aria-hidden="true">
            {n}
          </p>
          <p className="t-eyebrow chapter__label">{label}</p>
          {title ? (
            <h2 id={head} className="chapter__title">
              {title}
            </h2>
          ) : (
            <h2 id={head} className="sr-only">
              {label}
            </h2>
          )}
          {lede ? <p className="chapter__lede">{lede}</p> : null}
        </header>
        <div className="chapter__body">{children}</div>
      </div>
    </section>
  );
}

/** A full-bleed ink band with one large line that drifts as it passes. */
export function Interlude({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <section className="interlude" aria-label="Interlude">
      <Monogram size="min(46vw, 560px)" className="interlude__mark" />
      <div className="wrap interlude__inner">
        <p className="interlude__line">{children}</p>
        {sub ? <p className="interlude__sub t-label">{sub}</p> : null}
      </div>
    </section>
  );
}
