/**
 * A small TypeScript port of the app's Quick Capture idea (one line → task, note, expense or
 * event), for the film and the simulator. It mirrors the app's behaviour in spirit (money
 * becomes an expense, a time or day makes it dated, verbs make it a task) but is simplified;
 * the app's own parser (nlp_date_parser.dart + smart_classifier.dart) is richer.
 */
export type CaptureKind = "task" | "note" | "expense" | "event";
export type Parsed = { kind: CaptureKind; title: string; amount?: number; when?: string; category?: string };

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const TASK_VERBS = /^(call|email|buy|pay|book|send|finish|submit|fix|clean|pick up|remind|renew|write|read|review|check|ask|plan)\b/i;
const EVENT_WORDS = /\b(meeting|dinner|lunch|party|appointment|flight|class|lecture|interview|wedding|call with|movie|concert)\b/i;
const CATEGORIES: [RegExp, string][] = [
  [/\b(coffee|lunch|dinner|food|groceries|swiggy|zomato|cafe|restaurant)\b/i, "Food & Dining"],
  [/\b(uber|ola|metro|fuel|petrol|cab|train|bus|flight)\b/i, "Transport"],
  [/\b(netflix|spotify|subscription|prime)\b/i, "Subscriptions"],
  [/\b(rent|electricity|wifi|internet|bill)\b/i, "Bills"],
  [/\b(book|course|fees|stationery)\b/i, "Education"],
];

export function parseCapture(input: string, now = new Date()): Parsed {
  const text = input.trim();
  const money = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|rupees|inr)\b/i.exec(text);
  const time = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i.exec(text);
  const dayWord = /\b(today|tonight|tomorrow|day after tomorrow|(?:next\s+)?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday))\b/i.exec(text);

  let when: Date | null = null;
  if (dayWord || time) {
    when = new Date(now);
    const w = dayWord?.[1]?.toLowerCase() ?? "today";
    if (w === "tomorrow") when.setDate(when.getDate() + 1);
    else if (w === "day after tomorrow") when.setDate(when.getDate() + 2);
    else {
      const d = DAYS.findIndex((x) => w.endsWith(x));
      if (d >= 0) {
        let diff = (d - when.getDay() + 7) % 7 || 7;
        if (w.startsWith("next ")) diff += 7 * (diff < 7 ? 0 : 0);
        when.setDate(when.getDate() + diff);
      }
    }
    if (time) {
      let h = Number(time[1]) % 12;
      if (time[3]!.toLowerCase() === "pm") h += 12;
      when.setHours(h, Number(time[2] ?? 0), 0, 0);
    } else if (w === "tonight") when.setHours(20, 0, 0, 0);
  }

  const strip = (s: string) =>
    s
      .replace(money?.[0] ?? "\u0000", "")
      .replace(time?.[0] ?? "\u0000", "")
      .replace(dayWord?.[0] ?? "\u0000", "")
      .replace(/\b(at|on|for|by)\s*$/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  const title = strip(text) || text;
  const whenText = when
    ? when.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", ...(time || dayWord?.[1] === "tonight" ? { hour: "numeric", minute: "2-digit" } : {}) })
    : undefined;

  if (money) {
    const amount = Number((money[1] ?? money[2] ?? "0").replace(/,/g, ""));
    const category = CATEGORIES.find(([re]) => re.test(text))?.[1] ?? "General";
    return { kind: "expense", title: title || category, amount, category, when: whenText };
  }
  if (when && EVENT_WORDS.test(text)) return { kind: "event", title, when: whenText };
  if (TASK_VERBS.test(text) || when) return { kind: "task", title, when: whenText };
  return { kind: "note", title };
}
