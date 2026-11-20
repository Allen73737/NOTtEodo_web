import { KineticText } from "@/motion/primitives";

/** Editorial page opener: eyebrow, Bodoni title with italic words, and a lede. */
export function PageHeader({
  eyebrow,
  title,
  italic = [],
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  italic?: string[];
  lede?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-head wrap">
      <p className="t-eyebrow">{eyebrow}</p>
      <h1 className="t-display page-head__title">
        <KineticText text={title} italicWords={italic} start="mount" />
      </h1>
      {lede ? <div className="t-lede page-head__lede">{lede}</div> : null}
      {children}
    </header>
  );
}
