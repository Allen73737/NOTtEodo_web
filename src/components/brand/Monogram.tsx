import { clsx } from "clsx";
import { MONOGRAM, MONOGRAM_STROKE } from "./monogram-paths";

type Props = {
  className?: string;
  size?: number | string;
  /** Draws the ribbon N stroke by stroke (two pens on the loop, then the tails), as the app's loader does. */
  draw?: boolean;
  title?: string;
};

/** The ribbon N monogram, traced from the app's vector geometry (notteodo_monogram.dart). */
export function Monogram({ className, size = 40, draw = false, title }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={clsx("monogram", draw && "monogram--draw", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth={MONOGRAM_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path className="monogram__loop" pathLength={1} d={MONOGRAM.loopWest} />
      <path className="monogram__loop" pathLength={1} d={MONOGRAM.loopEast} />
      <path className="monogram__tail" pathLength={1} d={MONOGRAM.tailNorth} />
      <path className="monogram__tail" pathLength={1} d={MONOGRAM.tailSouth} />
    </svg>
  );
}
