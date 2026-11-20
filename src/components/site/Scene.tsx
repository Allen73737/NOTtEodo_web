/** Small animated scenes for error and status pages. Pure SVG + CSS; still for reduced motion. */
export function Scene({ kind }: { kind: "ink" | "movement" | "envelope" | "plane" }) {
  if (kind === "ink")
    return (
      <svg className="scene scene--ink" viewBox="0 0 200 140" aria-hidden="true">
        <path className="scene__bottle" d="M70 20 h30 v14 l14 12 v40 h-58 v-40 l14 -12z" transform="rotate(-62 85 60)" />
        <ellipse className="scene__spill" cx="120" cy="112" rx="56" ry="12" />
        <circle className="scene__drop" cx="104" cy="70" r="5" />
      </svg>
    );
  if (kind === "movement")
    return (
      <svg className="scene scene--movement" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="80" className="scene__ring" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="100" y1="26" x2="100" y2={i % 3 ? 34 : 40} transform={`rotate(${i * 30} 100 100)`} className="scene__tick" />
        ))}
        <line x1="100" y1="100" x2="100" y2="50" className="scene__hand scene__hand--min" />
        <line x1="100" y1="100" x2="136" y2="100" className="scene__hand" />
        <circle cx="100" cy="100" r="5" className="scene__pin" />
      </svg>
    );
  if (kind === "envelope")
    return (
      <svg className="scene scene--envelope" viewBox="0 0 200 140" aria-hidden="true">
        <rect x="30" y="30" width="140" height="90" rx="6" className="scene__paper" />
        <path d="M30 34 L100 84 L170 34" className="scene__fold" />
        <circle cx="100" cy="84" r="16" className="scene__wax" />
        <text x="100" y="91" textAnchor="middle" className="scene__n">N</text>
      </svg>
    );
  return (
    <svg className="scene scene--plane" viewBox="0 0 200 140" aria-hidden="true">
      <path d="M20 110 C 70 100, 110 60, 180 30" className="scene__trail" />
      <g className="scene__plane-g">
        <path d="M0 0 L40 14 L0 28 L8 14z" className="scene__plane" />
      </g>
    </svg>
  );
}
