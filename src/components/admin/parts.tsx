import type { ReactNode } from "react";

/*
 * One layout for every admin tab: a header, then full-width sections stacked down the page.
 * Peers that belong side by side (status cards, small editors) go in a <Panels> grid; numbers go in
 * <Metrics>. Nothing else sets its own width, so every tab lines up on the same left edge.
 */

export function AdminHead({
  cap,
  title,
  lede,
  children,
}: {
  cap: string;
  title: string;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="admin-head">
      <p className="mono-cap">{cap}</p>
      <h1>{title}</h1>
      {lede ? <p className="admin-head__lede">{lede}</p> : null}
      {children}
    </header>
  );
}

export function Metrics({ children }: { children: ReactNode }) {
  return <div className="metrics">{children}</div>;
}

export function Metric({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card metric">
      <p className="mono-cap">{label}</p>
      <p className="metric__value">{value}</p>
      {sub ? <p className="t-label">{sub}</p> : null}
    </div>
  );
}

/** Side-by-side peers. A `wide` Panel inside still takes the whole row. */
export function Panels({ children }: { children: ReactNode }) {
  return <div className="panels">{children}</div>;
}

export function Panel({
  cap,
  note,
  actions,
  children,
  wide,
}: {
  cap: string;
  note?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`card panel${wide ? " panel--wide" : ""}`}>
      <header className="panel__head">
        <div className="panel__title">
          <h2 className="mono-cap">{cap}</h2>
          {note ? <p className="panel__note">{note}</p> : null}
        </div>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

/** One line in a panel's list: what it is on the left, what you can do on the right. */
export function Line({ children, end }: { children: ReactNode; end?: ReactNode }) {
  return (
    <div className="panel__line">
      <div className="panel__line-main">{children}</div>
      {end ? <div className="panel__line-end">{end}</div> : null}
    </div>
  );
}

/** Filter chips under a tab's header. */
export function Filters({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav className="admin-filters" aria-label={label}>
      {children}
    </nav>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted panel__empty">{children}</p>;
}
