import { describe, expect, it } from "vitest";
import { answer, searchGuide } from "@/lib/search/guide";

describe("Ask Nodo (in-browser, app_guide.json)", () => {
  it("finds the right section", () => {
    expect(searchGuide("how do I delete my account")[0]?.id).toBe("backup");
    expect(searchGuide("widget can't load")[0]?.id).toBe("widgets");
    expect(searchGuide("focus timer rain sound")[0]?.id).toBe("focus");
  });
  it("answers with sentences from the guide and cites the section", () => {
    const a = answer("Where do I switch between cards and editorial view?");
    expect(a.source?.id).toBe("views");
    expect(a.text).toMatch(/Aa/);
  });
  it("admits when it doesn't know", () => {
    expect(answer("").source).toBeUndefined();
  });
});
