import { clsx } from "clsx";

type Props = {
  className?: string;
  /** static: plain type · kinetic: letters rise in sequence · stroke: outlined type that fills */
  variant?: "static" | "kinetic" | "stroke";
  as?: "span" | "h1" | "p";
};

const LETTERS: { ch: string; it?: boolean }[] = [
  { ch: "N" }, { ch: "O" }, { ch: "T" }, { ch: "t", it: true }, { ch: "e", it: true }, { ch: "o" }, { ch: "d" }, { ch: "o" },
];

/** NOTtEodo: the lowercase t and e are italic Bodoni Moda, as in the app's top bar. */
export function Wordmark({ className, variant = "static", as: Tag = "span" }: Props) {
  return (
    <Tag className={clsx("wordmark", `wordmark--${variant}`, className)} aria-label="NOTtEodo" translate="no">
      {LETTERS.map((l, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={clsx("wordmark__ch", l.it && "wordmark__it")}
          style={{ ["--i" as string]: i }}
        >
          {l.ch}
        </span>
      ))}
    </Tag>
  );
}
