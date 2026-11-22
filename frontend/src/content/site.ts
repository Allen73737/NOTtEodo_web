/**
 * Site content model. Every claim here was checked against the app source
 * (docs/APP_AUDIT.md). Help text itself comes from app_guide.json; this file adds the
 * marketing layer: headlines, benefits, ordering and which real screenshot to show.
 */
import type { Persona } from "@/lib/prefs";

export type ShotScreen =
  | "home"
  | "notes"
  | "tasks"
  | "planner"
  | "habits"
  | "expenses"
  | "expenses-nodo"
  | "focus"
  | "nodo"
  | "travel"
  | "journal"
  | "moodboard"
  | "quick-add";

export type Module = {
  slug: string;
  name: string;
  /** app_guide.json section id */
  guide: string;
  icon: string;
  /** Bodoni italic chapter line */
  line: string;
  summary: string;
  benefits: [string, string, string];
  shot?: ShotScreen;
  /** Recreated illustration shown when no real screenshot exists. */
  illustration?: "widgets" | "vault" | "shopping" | "wardrobe" | "capture" | "rewards" | "notifications" | "sync";
  related: string[];
  personas: Partial<Record<Persona, number>>;
  set: "workspace" | "life" | "system";
};

export const modules: Module[] = [
  {
    slug: "notes",
    name: "Notes",
    guide: "notes",
    icon: "NotebookPen",
    line: "Your thoughts, connected.",
    summary:
      "A notebook that links itself. Pin what matters, see your notes as a map, and ask them questions. Answers point back to the note they came from.",
    benefits: [
      "Map of notes draws the links between your ideas.",
      "Ask your notes: answers come with the notes they came from.",
      "Deleting a note tears it away like paper, and it waits in the Bin.",
    ],
    shot: "notes",
    related: ["tasks", "journal", "nodo"],
    personas: { students: 3, creatives: 2, professionals: 2 },
    set: "workspace",
  },
  {
    slug: "tasks",
    name: "Tasks",
    guide: "tasks",
    icon: "CircleCheck",
    line: "Cross it off. Feel it.",
    summary:
      "Write a task the way you'd say it: “call mom tomorrow 5pm”. NOTtEodo picks out the time. Normal, high or urgent; Today, Upcoming, Anytime and Done; and finishing one draws an ink line through it.",
    benefits: [
      "Plain-words entry understands dates and times.",
      "Today, Upcoming, Anytime and Done, nothing more.",
      "An ink strike for every finished task, and a seal when the day is done.",
    ],
    shot: "tasks",
    related: ["planner", "habits", "focus-dial"],
    personas: { students: 3, professionals: 3 },
    set: "workspace",
  },
  {
    slug: "planner",
    name: "Planner",
    guide: "planner",
    icon: "CalendarRange",
    line: "An open day, well planned.",
    summary:
      "Events and dated tasks on one calm timeline. Swipe through the week, add an event in a line, and bring calendars in or out with .ics files.",
    benefits: [
      "Events and tasks share one timeline.",
      "Import and export standard .ics calendar files.",
      "Reminders arrive at the minute you set.",
    ],
    shot: "planner",
    related: ["tasks", "notifications", "travel"],
    personas: { professionals: 3, students: 2 },
    set: "workspace",
  },
  {
    slug: "habits",
    name: "Habits",
    guide: "habits",
    icon: "Flame",
    line: "Small things, done often.",
    summary:
      "Start with one habit. A heatmap shows the days you kept it, streaks count up, and a daily check-in seals the day with a press of your thumb.",
    benefits: [
      "Heatmaps and streaks that read at a glance.",
      "Streak freezes for the days life gets in the way.",
      "A wax-seal check-in to close each day.",
    ],
    shot: "habits",
    related: ["rewards", "focus-dial", "journal"],
    personas: { students: 2, creatives: 2, professionals: 1 },
    set: "life",
  },
  {
    slug: "focus-dial",
    name: "Focus Dial",
    guide: "focus",
    icon: "Timer",
    line: "Time, well kept.",
    summary:
      "A watchmaker’s dial for deep work. Choose 15, 25, 45, 60 or 90 minutes, or set your own, add ambient sound, and start it from the dial, a launcher shortcut or the Quick Settings tile.",
    benefits: [
      "Breguet-style hands sweep the session.",
      "Ambient sound for the length of the session.",
      "Start from the Quick Settings tile without opening the app.",
    ],
    shot: "focus",
    related: ["tasks", "habits", "widgets"],
    personas: { students: 3, professionals: 2, creatives: 1 },
    set: "workspace",
  },
  {
    slug: "expenses",
    name: "Expenses",
    guide: "expenses",
    icon: "Wallet",
    line: "Every rupee, accounted for.",
    summary:
      "A monthly budget with a per-day allowance, category limits that work like envelopes, subscriptions and recurring costs, bill splitting, and CSV in and out.",
    benefits: [
      "See what you can spend today, not just this month.",
      "Category envelopes and subscriptions in one ledger.",
      "Split a bill and track who owes whom.",
    ],
    shot: "expenses",
    related: ["shopping", "travel", "nodo"],
    personas: { students: 2, professionals: 2, travellers: 2 },
    set: "life",
  },
  {
    slug: "wardrobe",
    name: "Wardrobe",
    guide: "wardrobe",
    icon: "Shirt",
    line: "Dressed for the day.",
    summary:
      "Keep your garments with photos, season and fabric, build outfits from them, see today’s look on Home and put it on your home screen.",
    benefits: [
      "Garments with photos, season and fabric.",
      "An outfit-of-the-day widget.",
      "Nodo suggests looks from what you own.",
    ],
    illustration: "wardrobe",
    related: ["moodboard", "travel", "widgets"],
    personas: { creatives: 3, travellers: 1 },
    set: "workspace",
  },
  {
    slug: "travel",
    name: "Travel",
    guide: "travel",
    icon: "Plane",
    line: "Packed for the trip.",
    summary:
      "Each trip is a ticket-style card with a departure countdown, a packing checklist, shared spending with settlements, and an itinerary you can export as a PDF or HTML dossier.",
    benefits: ["A countdown on a ticket-style card.", "Packing lists by essentials, clothing, electronics and toiletries.", "Shared trip spending, settled fairly."],
    shot: "travel",
    related: ["planner", "expenses", "wardrobe"],
    personas: { travellers: 3 },
    set: "life",
  },
  {
    slug: "journal",
    name: "Journal",
    guide: "journal",
    icon: "BookOpen",
    line: "Keep what mattered.",
    summary:
      "Dated entries with a mood, text and voice recordings. A memo can become a note, task or expense. Private entries can live behind the Vault.",
    benefits: ["Entries with a mood.", "Voice memos you can turn into notes, tasks or expenses.", "An evening review and Zen mode for quieter days."],
    shot: "journal",
    related: ["vault", "habits", "notes"],
    personas: { creatives: 3, students: 1 },
    set: "life",
  },
  {
    slug: "moodboard",
    name: "Moodboard",
    guide: "moodboard",
    icon: "LayoutGrid",
    line: "Collect what moves you.",
    summary:
      "Polaroid-style cards that flip to show a handwritten note on the back. Add images in the app or share photos in from any other app.",
    benefits: ["Polaroid cards with a note on the back.", "Share photos in from any app.", "Pin an image link with a note."],
    shot: "moodboard",
    related: ["wardrobe", "journal", "capture"],
    personas: { creatives: 3, travellers: 1 },
    set: "life",
  },
  {
    slug: "shopping",
    name: "Shopping",
    guide: "shopping",
    icon: "ShoppingBag",
    line: "Nothing forgotten at the shop.",
    summary: "Lists you tick off as you buy, sorted in store order with aisle headers: produce, bakery, dairy.",
    benefits: ["Sorted in store order.", "Tick as you go.", "Add items from Capture."],
    illustration: "shopping",
    related: ["expenses", "capture", "planner"],
    personas: { students: 1, professionals: 1 },
    set: "life",
  },
  {
    slug: "vault",
    name: "Vault",
    guide: "vault",
    icon: "LockKeyhole",
    line: "Private, even from a borrowed glance.",
    summary:
      "Private notes and entries behind a PIN or your fingerprint, encrypted on the device. Forget the PIN and you can still get in with biometrics, your account or a backup.",
    benefits: ["PIN or biometric unlock.", "Encrypted on the device.", "Recovery that doesn't need us."],
    illustration: "vault",
    related: ["journal", "sync-backup", "notes"],
    personas: { professionals: 1, creatives: 1 },
    set: "system",
  },
  {
    slug: "widgets",
    name: "Home-screen widgets",
    guide: "widgets",
    icon: "LayoutDashboard",
    line: "Your day, before you open the app.",
    summary:
      "Design widgets in the Widget Studio: sticky memo, daily checklist, Polaroid pin, outfit of the day, budget meter, voice memo, boarding pass and focus clock.",
    benefits: ["Eight widget styles.", "Shows your level and the next badge.", "Tap a widget to open that part of the app."],
    illustration: "widgets",
    related: ["focus-dial", "wardrobe", "expenses"],
    personas: { creatives: 2, travellers: 2, students: 1 },
    set: "system",
  },
  {
    slug: "capture",
    name: "Quick capture",
    guide: "capture",
    icon: "Zap",
    line: "Say it once. It finds its place.",
    summary:
      "Type one line and it becomes a task, note, expense or event. Capture from the Home chip, the dock, the app-icon shortcuts, the Quick Settings tile, or share text, links and photos from any app.",
    benefits: ["One line, four destinations.", "A Quick Settings tile and launcher shortcuts.", "Share text, links and photos from any app."],
    shot: "quick-add",
    illustration: "capture",
    related: ["tasks", "notes", "expenses"],
    personas: { professionals: 3, students: 2, creatives: 2, travellers: 2 },
    set: "system",
  },
  {
    slug: "nodo",
    name: "Nodo",
    guide: "nodo",
    icon: "Sparkles",
    line: "A companion that forgets on request.",
    summary:
      "Nodo knows your tasks, notes, habits, budget and schedule, can add things for you, and remembers what you tell it. You can review and erase every memory. Without an account, Nodo answers on the device from your own items.",
    benefits: [
      "Adds tasks, notes and expenses when you ask.",
      "Memory you can read and erase.",
      "On-device answers when the cloud is off.",
    ],
    shot: "nodo",
    related: ["notes", "expenses", "travel"],
    personas: { professionals: 2, students: 2 },
    set: "system",
  },
  {
    slug: "notifications",
    name: "Reminders",
    guide: "notifications",
    icon: "BellRing",
    line: "On time, every time.",
    summary:
      "Reminders at the exact minute you set, daily nudges you can tune, and quiet hours. Reminders are set again after a restart or a timezone change.",
    benefits: ["Reminders at the exact minute.", "Quiet hours.", "Set again after a restart."],
    illustration: "notifications",
    related: ["planner", "tasks", "habits"],
    personas: { professionals: 2, students: 2 },
    set: "system",
  },
  {
    slug: "rewards",
    name: "Badges & streaks",
    guide: "badges",
    icon: "Award",
    line: "A small ritual, every day.",
    summary:
      "A daily goal, a day streak with freezes, badges with four finishes, levels, and a weekly recap. Share a milestone and the card shows the badge, never your data.",
    benefits: ["A streak calendar with freezes.", "Weekly recap: this week against the last.", "Milestone cards with nothing personal on them."],
    illustration: "rewards",
    related: ["habits", "tasks", "widgets"],
    personas: { students: 2, creatives: 1 },
    set: "system",
  },
  {
    slug: "sync-backup",
    name: "Sync & backup",
    guide: "backup",
    icon: "RefreshCcw",
    line: "Yours on every phone, or only this one.",
    summary:
      "Use NOTtEodo with no account and everything stays on your phone. Sign in to sync between devices, add a passphrase so synced data is encrypted before it leaves, and make an encrypted backup file whenever you like.",
    benefits: ["No account needed.", "Optional end-to-end encryption passphrase.", "Encrypted backup file, CSV and .ics export."],
    illustration: "sync",
    related: ["vault", "nodo", "notes"],
    personas: { professionals: 2, travellers: 1 },
    set: "system",
  },
];

export const moduleBySlug = Object.fromEntries(modules.map((m) => [m.slug, m])) as Record<string, Module>;

export const personas: { slug: Persona; name: string; line: string; lede: string }[] = [
  {
    slug: "students",
    name: "Students",
    line: "Lectures, deadlines, a life.",
    lede: "Notes that answer questions, tasks that understand “submit lab report friday”, a focus dial for the hard hours and a budget that lasts to the end of the month.",
  },
  {
    slug: "creatives",
    name: "Creatives",
    line: "Room for the ideas.",
    lede: "Moodboards, a journal you can speak into, outfits and a map of notes that shows how one idea leads to the next.",
  },
  {
    slug: "professionals",
    name: "Professionals",
    line: "The day, held in one hand.",
    lede: "Capture from anywhere on the phone, a planner that keeps meetings and tasks together, reminders at the minute, and a companion that drafts the next step.",
  },
  {
    slug: "travellers",
    name: "Travellers",
    line: "Somewhere new, nothing lost.",
    lede: "Trips with flights and packing lists, shared costs split fairly, outfits for the weather, and a boarding-pass widget on your home screen.",
  },
];

export function modulesFor(persona: Persona | null): Module[] {
  if (!persona) return modules;
  return [...modules].sort((a, b) => (b.personas[persona] ?? 0) - (a.personas[persona] ?? 0));
}

/** Top-level navigation. */
export const nav = [
  { href: "/features", label: "Features" },
  { href: "/try", label: "Try it" },
  { href: "/nodo", label: "Nodo" },
  { href: "/security", label: "Privacy" },
  { href: "/download", label: "Download" },
];

export const footerGroups: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "All features" },
      { href: "/try", label: "Try it in the browser" },
      { href: "/why", label: "Why NOTtEodo" },
      { href: "/download", label: "Download" },
      { href: "/changelog", label: "Changelog" },
      { href: "/roadmap", label: "Roadmap" },
    ],
  },
  {
    title: "Atelier",
    links: [
      { href: "/design", label: "Design language" },
      { href: "/craft", label: "Behind the craft" },
      { href: "/gallery", label: "Poster gallery" },
      { href: "/press", label: "Press kit" },
      { href: "/brand", label: "Brand guidelines" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/help", label: "Help centre" },
      { href: "/faq", label: "FAQ" },
      { href: "/guides", label: "Guides" },
      { href: "/support", label: "Contact & feedback" },
      { href: "/status", label: "Status" },
      { href: "/account", label: "Your account" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/security", label: "Security" },
      { href: "/data-safety", label: "Data safety" },
      { href: "/delete-account", label: "Delete your account" },
      { href: "/terms", label: "Terms" },
      { href: "/child-safety", label: "Child safety" },
      { href: "/cookies", label: "Cookies" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "/licenses", label: "Licences" },
    ],
  },
];

export const GITHUB_URL = "https://github.com/Allen73737/NOTtEodo";
export const PACKAGE_NAME = "com.notteodo.notteodo";
