import type { ReactNode } from "react";

export function AdminHead({ cap, title, lede, children }: { cap: string; title: string; lede?: ReactNode; children?: ReactNode }) {
  return (
    <header className="admin-head">
      <p className="mono-cap">{cap}</p>
      <h1>{title}</h1>
      {lede ? <p className="muted" style={{ margin: 0, maxWidth: "70ch" }}>{lede}</p> : null}
      {children}
    </header>
  );
}

export function Metric({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card pad metric">
      <p className="mono-cap" style={{ margin: 0 }}>{label}</p>
      <p className="metric__value" style={{ margin: 0 }}>{value}</p>
      {sub ? <p className="t-label" style={{ margin: 0 }}>{sub}</p> : null}
    </div>
  );
}

export function Panel({ cap, children, wide }: { cap: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className="card pad stack" style={wide ? { gridColumn: "1 / -1" } : undefined}>
      <p className="mono-cap" style={{ margin: 0, color: "var(--c-accent)" }}>{cap}</p>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted" style={{ margin: 0 }}>{children}</p>;
}
