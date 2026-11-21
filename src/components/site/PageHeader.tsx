import { Monogram } from "@/components/brand/Monogram";
import { KineticText } from "@/motion/primitives";
import { HeadDrift } from "./HeadDrift";

/**
 * Editorial page opener, the same on every page: a rail with the ribbon N and the eyebrow, a
 * Bodoni title with italic words, a lede under a drawn hairline, an optional aside (a phone,
 * a poster, a fact card) and a giant outlined word that drifts as you scroll.
 */
export function PageHeader({
  eyebrow,
  title,
  italic = [],
  lede,
  aside,
  word,
  children,
}: {
  eyebrow: string;
  title: string;
  italic?: string[];
  lede?: React.ReactNode;
  aside?: React.ReactNode;
  /** The drifting background word; defaults to the eyebrow. */
  word?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={`page-head wrap${aside ? " page-head--aside" : ""}`} data-no-reveal>
      <HeadDrift />
      <p className="page-head__word" aria-hidden="true">
        {word ?? eyebrow}
      </p>
      <div className="page-head__rail">
        <Monogram size={22} className="page-head__mono" />
        <p className="t-eyebrow page-head__eyebrow">{eyebrow}</p>
      </div>
      <div className="page-head__main">
        <h1 className="t-display page-head__title">
          <KineticText text={title} italicWords={italic} start="mount" />
        </h1>
        <div className="page-head__foot">
          <span className="page-head__rule" aria-hidden="true" />
          {lede ? <div className="t-lede page-head__lede">{lede}</div> : null}
          {children}
        </div>
      </div>
      {aside ? <div className="page-head__aside">{aside}</div> : null}
    </header>
  );
}
