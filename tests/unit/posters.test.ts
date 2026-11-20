import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { magazineCover, og } from "../../poster-studio/templates";

describe("Poster Studio determinism", () => {
  it("renders byte-identical HTML for the same inputs", () => {
    const a = magazineCover({ t: "light", file: "02_notes_light.png", issue: 1, module: "Notes", coverLine: "x", kicker: "Curate" });
    const b = magazineCover({ t: "light", file: "02_notes_light.png", issue: 1, module: "Notes", coverLine: "x", kicker: "Curate" });
    expect(createHash("sha256").update(a).digest("hex")).toBe(createHash("sha256").update(b).digest("hex"));
  });
  it("uses only token colours", () => {
    const html = og({ t: "dark", eyebrow: "E", title: "T" });
    expect(html).not.toMatch(/#(?:00f|0000ff|008080|00ff00|ffd700)/i);
  });
});
