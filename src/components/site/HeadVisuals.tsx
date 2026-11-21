import { posterFor } from "@/content/posters";

/** Three module posters fanned like a hand of cards; they spread further on hover. */
export function PosterFan({ slugs }: { slugs: string[] }) {
  const posters = slugs.map((s) => posterFor(s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  return (
    <div className="poster-fan" aria-hidden="true">
      {posters.slice(0, 3).map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p.src} src={p.src} alt="" width={p.width} height={p.height} style={{ ["--i" as string]: i - 1 }} />
      ))}
    </div>
  );
}

/** A block of ciphertext with a wax lock: the look of data the server can't read. */
export function CipherCard({ lines = 9, label = "AES-256-GCM" }: { lines?: number; label?: string }) {
  const glyphs = "0123456789ABCDEF";
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rows = Array.from({ length: lines }, () => Array.from({ length: 28 }, () => glyphs[Math.floor(rnd() * 16)]).join(""));
  return (
    <div className="cipher card no-tilt" aria-hidden="true">
      {rows.map((r, i) => (
        <span key={i} style={{ ["--i" as string]: i }}>
          {r}
        </span>
      ))}
      <span className="cipher__seal t-label">{label}</span>
    </div>
  );
}

/** A numbered list on paper, for "how it works" asides. */
export function StepsCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="steps card pad">
      <p className="t-eyebrow">{title}</p>
      <ol>
        {steps.map((s, i) => (
          <li key={s} style={{ ["--i" as string]: i }}>
            <span className="t-num">{String(i + 1).padStart(2, "0")}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
