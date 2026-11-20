import manifest from "@/content/generated/posters.json";

export type PosterEntry = (typeof manifest.posters)[number];
export const posters = manifest.posters as PosterEntry[];

/** The best poster for a module (a cover or Swiss poster), in a given theme. */
export function posterFor(slug: string, theme: "light" | "dark" = "light"): PosterEntry | undefined {
  return (
    posters.find((p) => p.module === slug && p.series === "covers" && p.theme === theme) ??
    posters.find((p) => p.module === slug && p.theme === theme) ??
    undefined
  );
}

export function byId(id: string) {
  return posters.find((p) => p.id === id);
}
