/** Long-form guides (SEO + HowTo). Every step matches app_guide.json and the app's settings. */
export type Guide = { slug: string; title: string; lede: string; steps: { name: string; text: string }[]; related: string[] };

export const guides: Guide[] = [
  {
    slug: "moving-to-a-new-phone",
    title: "Moving NOTtEodo to a new phone",
    lede: "Two ways to bring everything with you: sync with an account, or carry an encrypted backup file.",
    steps: [
      { name: "Choose sync or a backup file", text: "With an account, your data syncs automatically. Without one, an encrypted backup file carries everything; it's protected by a password you choose." },
      { name: "Make the backup (no account)", text: "On the old phone open Settings → Backup & export and create an encrypted backup. Save it somewhere you can reach from the new phone." },
      { name: "Or sign in (account)", text: "On the old phone open Settings → Account & sync and make sure you're signed in and synced. If you use an encryption passphrase, have it ready." },
      { name: "Install on the new phone", text: "Install NOTtEodo from the download page (or Google Play once it's there)." },
      { name: "Restore", text: "Sign in with the same account in Settings → Account & sync, or restore the backup file from Settings → Backup & export." },
      { name: "Set up the extras again", text: "Add home-screen widgets again (long-press the home screen → Widgets), and re-enable biometrics and reminders permissions if Android asks." },
    ],
    related: ["sync-backup", "vault", "widgets"],
  },
  {
    slug: "planning-a-trip",
    title: "Planning a trip with NOTtEodo",
    lede: "From the first idea to the packing list and the shared bill.",
    steps: [
      { name: "Create the trip", text: "Open Travel from the Life dock and add a trip with its dates. It appears as a ticket-style card with a countdown." },
      { name: "Plan with Nodo", text: "Use Plan with Nodo for ideas for the days you'll be there." },
      { name: "Pack", text: "Tick off the packing checklist by essentials, clothing, electronics and toiletries." },
      { name: "Choose outfits", text: "Build looks in Wardrobe for the weather you'll have." },
      { name: "Share the costs", text: "Log trip spending; the splitter works out who owes whom." },
      { name: "Take it with you", text: "Export the itinerary as a PDF or HTML dossier, and add the boarding-pass widget to your home screen." },
    ],
    related: ["travel", "wardrobe", "expenses"],
  },
  {
    slug: "building-a-habit",
    title: "Building a habit that sticks",
    lede: "Start with one small thing and let the streak do the rest.",
    steps: [
      { name: "Start with one", text: "In Habits, add one habit small enough to do on a bad day." },
      { name: "Give it a time", text: "A habit with a time gets its own reminder today and tomorrow, skipped once it's done." },
      { name: "Check in each day", text: "Use the Check-in chip on Home: press and hold the wax seal to keep your day streak." },
      { name: "Use freezes", text: "Streak milestones earn freezes that protect a missed day automatically." },
      { name: "Look back", text: "The heatmap shows every day you kept it; Your week compares the last seven days with the seven before." },
    ],
    related: ["habits", "rewards", "notifications"],
  },
];
