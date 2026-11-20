# Google Play Console checklist: NOTtEodo (`com.notteodo.notteodo`)

Answers derived from the app's code (docs/APP_AUDIT.md) and the decisions in OPEN_QUESTIONS.md. **Bold ⚠ items must be done in the app before submission** (APP_HANDOFF.md covers each one).

## 0. Before you submit
- [ ] **⚠ Remove `USE_EXACT_ALARM`** from the manifest (keep `SCHEDULE_EXACT_ALARM` + the "Allow exact reminders" screen). APP_HANDOFF §4.
- [ ] **⚠ Replace `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`** with the battery-settings intent (no permission). APP_HANDOFF §4.
- [ ] **⚠ Cloud Nodo opt-in sheet** shipped, then set `platform_config.nodo_cloud_opt_in = true`. APP_HANDOFF §3.
- [ ] **⚠ Age gate on sign-up** (18+, or parental consent). APP_HANDOFF §5.
- [ ] Privacy policy URL in the app = `https://[DOMAIN]/privacy` (read from `platform_config.urls.privacy`).
- [ ] Turn on Groq zero data retention, then set `platform_config.groq_zdr = true`.
- [ ] Release signing: one app signing key (see OPEN_QUESTIONS D19). Upload it to Play App Signing; create a separate upload key.
- [ ] Fill the placeholders: `[DEVELOPER NAME]`, `[SUPPORT EMAIL]`, `[DOMAIN]`, `[POSTAL ADDRESS]`, `[GRIEVANCE OFFICER …]`, `[CITY]`.
- [ ] Recommended: disable Google Fonts runtime fetching (APP_HANDOFF §6), then remove that row from the privacy policy.

## 1. App content

| Section | Answer |
|---|---|
| **Privacy policy** | `https://[DOMAIN]/privacy` |
| **App access** | "All or some functionality is restricted" → No. Everything works without an account. For reviewers who want to test sync and Nodo, provide a test account in the *App access* form only (never in the repo): Settings → Account & sync → Sign in with the test email/password. |
| **Ads** | No, the app does not contain ads |
| **Content rating** | Category: Utility, productivity, communication or other. Violence, sexuality, language, controlled substances, gambling: all No. User-generated content shared with other users: **No** (no social features). Shares location: No. Digital purchases: No. AI-generated content: **Yes**, Nodo writes text answers for the user only; no sharing between users. Expected result: Everyone / PEGI 3 / IARC 3+ |
| **Target audience and content** | **13–15, 16–17, 18+** (not under 13; see D12). Appeal to children: No. Store listing does not target children. |
| **News app** | No |
| **COVID-19 contact tracing** | No |
| **Data safety** | see §2 |
| **Government app** | No |
| **Financial features** | None (expense tracking is personal record-keeping; no lending, payments, crypto or banking) |
| **Health** | None |
| **Account deletion** | Yes, accounts can be created. Deletion URL: `https://[DOMAIN]/delete-account`. In-app path: Settings → Account & sync → Delete my account |
| **Permissions declarations** | Exact alarm: after removing `USE_EXACT_ALARM`, no declaration is needed for `SCHEDULE_EXACT_ALARM`. Foreground service: only if the focus timer uses one (check `CadenceTimerManager.kt`); if so, declare type `specialUse` or `mediaPlayback` with the reason "Focus timer with ambient sound and lock-screen controls". |

## 2. Data safety form

**Does your app collect or share any of the required user data types?** Yes.
**Is all of the user data collected by your app encrypted in transit?** Yes.
**Do you provide a way for users to request that their data is deleted?** Yes.

| Play data type | Collected | Shared | Ephemeral | Required/optional | Purposes |
|---|---|---|---|---|---|
| Personal info → Email address | ✓ | ✗ | no | Optional (account) | Account management |
| Personal info → Name | ✓ | ✗ | no | Optional | App functionality, Personalisation |
| Personal info → User IDs | ✓ | ✗ | no | Optional (account) | Account management, Fraud prevention/security |
| Personal info → Other info (motto, typed location) | ✓ | ✗ | no | Optional | Personalisation |
| Financial info → Other financial info (expenses) | ✓ | ✗ | no | Optional (sync) | App functionality |
| Photos and videos → Photos | ✓ | ✗ | no | Optional | App functionality |
| Audio → Voice or sound recordings | ✓ | ✗ | no | Optional | App functionality |
| Messages → Other in-app messages (Nodo chats, feedback) | ✓ | ✗ | no | Optional | App functionality, Developer communications |
| Calendar → Calendar events (created in the app) | ✓ | ✗ | no | Optional (sync) | App functionality |
| App activity → Other user-generated content (notes, tasks, journal…) | ✓ | ✗ | no | Optional (sync) | App functionality |
| App activity → In-app search history | ✗ | | | | |
| App info and performance (crash logs, diagnostics) | ✗ | | | | No crash/analytics SDKs |
| Device or other IDs | ✗ | | | | |
| Location | ✗ | | | | |

"Shared" is ✗ throughout: Supabase, Cloudinary, Groq and Resend are service providers processing on our behalf, which Play does not count as sharing.

## 3. Store listing (copy in the brand voice)

- **App name (28/30):** `NOTtEodo: Notes, Tasks, Life`
- **Short description (78/80):** `Notes, tasks, habits, money and focus in one private, offline-first organiser.`
- **Full description (≤4000):**

```
Curate your everyday.

NOTtEodo is a calm, private organiser for the whole of your day: notes, tasks, a planner, habits, a focus dial, expenses, wardrobe, travel, a journal with voice memos, moodboards and shopping lists, in one app that works offline.

TWO WAYS TO SEE THE SAME DAY
Cards view is tactile and alive. Editorial view is a quiet, magazine-like page with no boxes. Switch with the Aa pill. Ivory by day, pure OLED black by night.

CAPTURE
Type one line and it becomes a task, a note, an expense or an event. Capture from Home, the dock, the app-icon shortcuts, the Quick Settings tile, or share text, links and photos from any app.

NOTES THAT CONNECT
See your notes as a map, pin what matters, and ask your notes a question. Answers point to the notes they came from.

TASKS AND PLANNER
Write tasks the way you'd say them ("call mom tomorrow 5pm"). Today, Upcoming, Anytime, Done. Events and dated tasks share one timeline, with .ics import and export. Reminders arrive at the minute you set.

RHYTHM
Habits with a 52-week heatmap and streaks. A daily wax-seal check-in. Streak freezes for the days life gets in the way. Badges, levels and a weekly recap of this week against the last.

FOCUS DIAL
A watchmaker's dial for deep work: 15 to 90 minutes or your own, with ambient sound and lock-screen controls.

MONEY
A monthly budget with a per-day allowance, category envelopes, subscriptions, bill splitting and CSV export.

LIFE
Wardrobe and outfits, trips with packing lists and shared costs, a journal you can speak into, Polaroid-style moodboards and store-ordered shopping lists.

NODO
A companion that knows your day, can add tasks, notes and expenses for you, and remembers what you tell it. You can read and erase every memory. Without an account, Nodo answers on your phone from your own items.

HOME-SCREEN WIDGETS
Sticky memo, checklist, Polaroid pin, outfit of the day, budget meter, voice memo, boarding pass and focus clock.

PRIVATE BY DESIGN
• No account needed. Everything is encrypted on your phone.
• Sign in only if you want sync. Add a passphrase and synced data is encrypted before it leaves your phone.
• No ads. No trackers. No analytics.
• Delete your account and data at any time, in the app or on the web.

Free to use. Made in India.
```

- **App category:** Productivity. **Tags:** Notes, To-do list, Planner, Habit tracker, Budget.
- **Contact:** `[SUPPORT EMAIL]`, website `https://[DOMAIN]`.

## 4. Graphics (from the Poster Studio: `pnpm posters` → `public/posters/play/`)

| Asset | Size | File |
|---|---|---|
| App icon | 512 × 512 PNG | `public/icon-512.png` (replace with the app's own launcher icon if it differs) |
| Feature graphic | 1024 × 500 | `public/posters/play/feature-graphic-light.png` (or `-dark`) |
| Phone screenshots (2–8) | 1080 × 1920 | `public/posters/play/screenshot-0N-<screen>-<theme>.png`, with captions in the image |

Captions are honest and describe only what the screenshot shows.

## 5. Promo video (optional), 30-second storyboard

| t | Shot | Caption |
|---|---|---|
| 0–3 s | Ink drop blooms on ivory; the wordmark condenses out of it | *Curate your everyday.* |
| 3–8 s | The phone surfaces; Home in Cards view; the Aa pill flips to Editorial | Two ways to see the same day |
| 8–13 s | One typed line splits into a task and an expense | Say it once |
| 13–18 s | Task struck through in ink; the wax-seal check-in | Cross it off. Feel it. |
| 18–23 s | Focus Dial hands sweep; budget figure counts up | Time, well kept. Every rupee, accounted for. |
| 23–27 s | Vault door, a data cube sealed in wax | Encrypted on your phone |
| 27–30 s | Phone lands on ivory; wordmark | NOTtEodo, on Android |

Render: `pnpm dev`, then record `/` with Playwright's video capture at 1080×1920 (script stub in `poster-studio/render-video.md`).
