import { clsx } from "clsx";
import { LOGO_WORDMARK } from "./logo-paths";

type Props = {
  className?: string;
  /** static: the logo lettering · kinetic: written in from left to right · stroke: outlined, then filled */
  variant?: "static" | "kinetic" | "stroke";
  as?: "span" | "h1" | "p";
};

/** NOTtEodo, as lettered in the app's logo. One colour only: it takes the surrounding text colour. */
export function Wordmark({ className, variant = "static", as: Tag = "span" }: Props) {
  const { d, w, h } = LOGO_WORDMARK;
  return (
    <Tag className={clsx("wordmark", `wordmark--${variant}`, className)} translate="no">
      <span className="sr-only">NOTtEodo</span>
      <svg viewBox={`0 0 ${w} ${h}`} className="wordmark__svg" aria-hidden="true" style={{ aspectRatio: `${w} / ${h}` }}>
        <path d={d} fillRule="evenodd" pathLength={1} />
      </svg>
    </Tag>
  );
}
