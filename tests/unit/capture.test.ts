import { describe, expect, it } from "vitest";
import { parseCapture } from "@/lib/capture";

const now = new Date("2026-11-21T10:00:00+05:30");
describe("capture parser", () => {
  it("money becomes an expense with a category", () => {
    const p = parseCapture("coffee with Asha ₹240", now);
    expect(p).toMatchObject({ kind: "expense", amount: 240, category: "Food & Dining" });
  });
  it("a dated meeting becomes an event", () => {
    expect(parseCapture("dinner with Asha friday 8pm", now)).toMatchObject({ kind: "event", title: "dinner with Asha" });
  });
  it("a verb or a time makes a task", () => {
    expect(parseCapture("call mom tomorrow 5pm", now)).toMatchObject({ kind: "task", title: "call mom" });
  });
  it("anything else is a note", () => {
    expect(parseCapture("ideas for the moodboard: deckled paper, wax", now).kind).toBe("note");
  });
});
