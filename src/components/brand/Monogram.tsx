import { clsx } from "clsx";
import { LOGO_MONOGRAM } from "./logo-paths";

type Props = {
  className?: string;
  size?: number | string;
  /** Traces the ribbon outline with a pen, then floods it with ink. */
  draw?: boolean;
  title?: string;
};

/** The ribbon N, traced from the app's logo. Always one colour: it takes the surrounding text colour. */
export function Monogram({ className, size = 40, draw = false, title }: Props) {
  const { d, w, h } = LOGO_MONOGRAM;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={size}
      className={clsx("monogram", draw && "monogram--draw", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path className="monogram__ink" d={d} fillRule="evenodd" pathLength={1} />
    </svg>
  );
}
