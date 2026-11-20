import manifest from "@/content/generated/screenshots.json";
import type { ShotScreen } from "@/content/site";

type View = "cards" | "editorial";
type Theme = "light" | "dark";
type Entry = (typeof manifest.entries)[number];

/** Typed lookup over the verified screenshot manifest (screen + view + theme). */
export function getScreenshot(q: { screen: ShotScreen; view: View; theme: Theme }): Entry | undefined {
  return manifest.entries.find((e) => e.screen === q.screen && e.view === q.view && e.theme === q.theme);
}

/** Which views exist for a screen. If only one exists, it is shown in both views and labelled. */
export function viewsFor(screen: ShotScreen): View[] {
  return (["cards", "editorial"] as const).filter((v) => manifest.entries.some((e) => e.screen === screen && e.view === v));
}

const ALT: Record<string, string> = {
  home: "NOTtEodo Home: greeting, daily brief, Capture, Check-in and Your week",
  notes: "NOTtEodo Notes: the notebook with Ask your notes, Map of notes and Briefing",
  tasks: "NOTtEodo Tasks: Today, Upcoming, Anytime and Done with plain-words entry",
  planner: "NOTtEodo Planner: today with a week strip and events",
  habits: "NOTtEodo Habits: start with one habit",
  expenses: "NOTtEodo Expenses: spending this month, per-day allowance and category limits",
  "expenses-nodo": "NOTtEodo Expenses with a note from Nodo about pacing",
  focus: "NOTtEodo Focus Dial: a watch-style dial with session lengths and ambient sound",
  nodo: "Nodo, the companion inside NOTtEodo, in a chat sheet",
  travel: "NOTtEodo Travel: trips, packing and plan with Nodo",
  journal: "NOTtEodo Journal: entries with a mood",
  moodboard: "NOTtEodo Moodboard: upload a photo or add a pin",
  "quick-add": "NOTtEodo Quick add: note, task, event, expense, wardrobe, shopping, journal, moodboard",
};

/**
 * A real app screenshot that follows the visitor's theme (Ivory/OLED) and view (Cards/Editorial)
 * with a crossfade. All four variants are in the HTML, so it works without JS and the CSS
 * switch is instant. Only the visible one is fetched eagerly; the rest are lazy.
 */
export function Screenshot({
  screen,
  priority = false,
  sizes = "(max-width: 700px) 70vw, 360px",
  className,
  frame = true,
}: {
  screen: ShotScreen;
  priority?: boolean;
  sizes?: string;
  className?: string;
  frame?: boolean;
}) {
  const views = viewsFor(screen);
  const imgs = (["light", "dark"] as const).flatMap((theme) =>
    (["cards", "editorial"] as const).map((view) => {
      const source = views.includes(view) ? view : views[0];
      if (!source) return null;
      const e = getScreenshot({ screen, view: source, theme });
      if (!e) return null;
      return { e, theme, view, borrowed: source !== view };
    }),
  );
  const first = imgs.find(Boolean);
  if (!first) return null;
  const inner = (
    <div className="shot__stack" style={{ aspectRatio: `${first.e.width} / ${first.e.height}` }}>
      {imgs.map((x) =>
        x ? (
          <picture key={`${x.theme}-${x.view}`} className="shot__img" data-theme-img={x.theme} data-view-img={x.view}>
            <source type="image/avif" srcSet={x.e.sources.avif.join(", ")} sizes={sizes} />
            <source type="image/webp" srcSet={x.e.sources.webp.join(", ")} sizes={sizes} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={x.e.sources.webp[1]!.split(" ")[0]}
              alt={x.theme === "light" && x.view === "cards" ? ALT[screen] ?? "NOTtEodo screen" : ""}
              width={x.e.width}
              height={x.e.height}
              loading={priority && x.theme === "light" && x.view === "cards" ? "eager" : "lazy"}
              fetchPriority={priority && x.theme === "light" && x.view === "cards" ? "high" : undefined}
              decoding="async"
              style={{ backgroundImage: `url(${x.e.blur})` }}
            />
          </picture>
        ) : null,
      )}
    </div>
  );
  return frame ? (
    <figure className={`phone ${className ?? ""}`}>
      <div className="phone__glass">{inner}</div>
      <figcaption className="sr-only">Screenshot of the real app.</figcaption>
    </figure>
  ) : (
    <div className={className}>{inner}</div>
  );
}
