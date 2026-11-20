# Open questions

These are things I can't verify from the code, or decisions only you can make. Each has a default I'll use if you don't answer. **★ = blocks Phase 6 (Play compliance) or affects what's legally true.**

---

## Decisions (answered 21 Nov 2026)

**D1, Play status (Q1).** Not live yet; the site should feel launch-ready.
- The APK download is the primary CTA. The Google Play badge appears dimmed as *Coming soon*, with no link.
- One switch, `platform_config.play_live`, flips every Play CTA live with no redeploy.
- No countdowns, launch dates or waitlist numbers (ground rule 5).

**D2, Pricing (Q2).** Not free forever.
- All copy is present tense only: "Free", "No ads", "No trackers". Never "forever" or "ever".
- Chapter XV is now "Ads. Trackers. Data brokers. *Not here.*"
- The Terms reserve the right to add optional paid features later, with notice.

**D5, Identity (Q5).** Use placeholders: `[DEVELOPER NAME]`, `[SUPPORT EMAIL]`, `[DOMAIN]`, `[POSTAL ADDRESS]`, `[GRIEVANCE OFFICER NAME / EMAIL]`. **Country: India.** So:
- **Primary law:** the Digital Personal Data Protection Act 2023, with the DPDP Rules 2025 phasing in. Consent must be free, specific, informed and given by a clear affirmative act; there must be a way to withdraw it and a grievance contact.
- **Also:** the IT Act 2000 and the SPDI Rules 2011, which require a named Grievance Officer in the privacy policy. Passwords and biometric settings count as sensitive data there.
- The GDPR, UK GDPR and CCPA sections stay as "if you live in…" sections, because the APK is downloadable worldwide.
- No `/imprint` page (that resolves Q25).

**D6, Nodo cloud default (Q6). Recommendation: switch to opt-in before launch.**
- **Why:** today, signing in silently turns on sending item context to a US AI provider. Under DPDP s.6, consent can't be implied from signing in for a separate purpose, and Play's User Data policy wants prominent disclosure before sending personal content to third parties.
- **What changes:** the first time Nodo would go to the cloud, a one-time sheet says what is sent (your question, the matching items, a short summary of your app state, recent chat), to whom (our server, then Groq, USA), and what's kept (memory you can view and erase).
  - It has two equal buttons: *Use cloud Nodo* and *Keep it on this phone*.
  - The choice can be changed in Settings → Nodo assistant.
  - Voice transcription asks the same way.
- This goes into `APP_HANDOFF.md`, and the privacy policy is written for the opt-in behaviour.
- **Launch blocker:** the app must ship this before the policy goes live.

**D8, ID sent to Groq (Q8). Recommendation: send a pseudonym, not the account ID.**
- Groq's API says the `user` field is "a unique identifier representing your end-user, which can help us monitor and detect abuse". It's useful, but it doesn't need to be the real Supabase UUID.
- **Fix:** in `ai-assist`, send `HMAC-SHA256(user_id, AI_USER_SALT)`, truncated to 32 hex characters. It stays stable, so abuse tracking still works, but it can't be linked back to an account without the server secret.
- This is an edge-function change in the app repo, so it goes in the hand-off. The policy then says "a random-looking identifier that is not your account ID".

**D9, Groq retention and training (Q9).** From Groq's own documents, read 21 Nov 2026:
- **Training:** the Services Agreement §4.2 says *"Groq is not permitted to use Inputs or Outputs for training or fine-tuning any AI Model Services or other models, unless explicitly granted permission or instructed by Customer."*
- **Retention:** by default Groq doesn't keep inference data. But inputs and outputs *may* be logged when troubleshooting errors or investigating suspected abuse, kept *"for up to 30 days, unless legally required"*.
- **Zero Data Retention (ZDR):** a self-serve setting at console.groq.com → Settings → Data Controls ("All customers may enable…"; the Agreement says "Eligible Customers"). It turns that logging off. It only disables batch and fine-tuning, which NOTtEodo doesn't use (it uses chat completions and Whisper transcription).
- **DPA:** it's accepted automatically with the Services Agreement (effective 15 Oct 2025) and includes EU SCCs and the UK addendum.
- **Location:** stored data is in US Google Cloud buckets; processing may happen in other countries where Groq or its subprocessors operate.
- **→ Your action (2 minutes):** turn on ZDR for all features in the Groq console, and tell me when it's done.
  - Once it's on, the policy says: *"Our AI provider, Groq, Inc. (USA), processes the request only to produce the answer. Its contract forbids using it to train models, and we have turned on its zero-data-retention setting, so it keeps no copy once the answer is returned."*
  - Until then, the policy says *"may keep it for up to 30 days to investigate abuse"*.
  - India: DPDP s.16 allows transfers to any country not on a government restricted list, and the US isn't on one.

**D19, Signing keys (Q19).** No Play app exists yet, so set things up so the website APK and the future Play build share **one signing key**. Otherwise, people who sideload now could never update from Play: they'd have to uninstall, and because `allowBackup="false"` and the data is tied to the Keystore, uninstalling **erases their on-device data**.
1. **Now:** create one long-lived release keystore (the *app signing key*) and sign every website APK with it. Never use debug signing for a public APK. `build.gradle` currently falls back to debug signing when `key.properties` is missing, and the hand-off adds a guard against that.
2. **When creating the Play app:** at Play App Signing choose *Use a different key → Export and upload a key from Java keystore* (Google's PEPK tool) and upload **that same key**. Then create a separate *upload key* for submissions.
3. **After launch:** keep signing website APKs with the app signing key, or download Play's signed universal APK from *App bundle explorer*.
4. **Before relying on it:** test on a spare phone that a sideloaded APK updates from Play.

`assetlinks.json` lists the app-signing-key SHA-256, plus the upload key's once it exists. Both are env placeholders (`ANDROID_CERT_SHA256_APP_SIGNING`, `ANDROID_CERT_SHA256_UPLOAD`), and the production build refuses to ship if they're empty.

---

## Still open

## Identity and placeholders
| # | Question | Default if unanswered |
|---|---|---|

## Screenshots
| # | Question | Default |
|---|---|---|
| Q3 | 14 of the 16 `bento` (Cards view) screenshots show a different screen from their filename (see APP_AUDIT §13). Please **recapture Cards view for Home, Notes, Tasks, Planner, Habits, Expenses and Focus Dial** with the same naming. Also wanted, both themes and both views: Wardrobe, Travel (with a trip), Journal, Moodboard (with pins), Shopping, Vault (locked screen), Bin, Profile / Curator Passport, Widget Studio, a home screen with widgets, the Check-in seal, the streak calendar, a ceremony, Notes → Map of notes, Ask your notes, the Quick Settings tiles, the share sheet, Settings → Nodo assistant (memories). | I use a hand-verified mapping; Cards-view gaps are filled with HTML recreations labelled "Illustration" |
| Q4 | The screenshots contain test data ("Football Freak", "hi I am gopd", "ration kada"). OK to publish, or should I crop/blur names? Better: recapture with a clean demo dataset (I can write one as a JSON backup you restore). | Crop the greeting/name area on posters; never alter the UI otherwise |

## Privacy and policy facts
| # | Question | Default |
|---|---|---|
| Q10 ★ | Cloudinary region and Supabase region (for the international transfers section). | "Servers may be outside your country"; region filled from your answer |
| Q11 | Exact on-device erase path: Settings → Backup & export → *Permanently Erase All Data*? (The old policy says Privacy & data.) | Use Backup & export, verified on device before launch |
| Q12 ★ | Who are the users? Is the app aimed at India first (₹ in screenshots, DPDP Act), the EU, the US? Any users under 18 expected? | Rights sections for GDPR/UK GDPR, DPDP 2023 and CCPA/CPRA; "not for under-13s" (16 in the EEA where required) |
| Q13 | Should the website offer **"email me when a new version ships"** (`release_subscribers`, double opt-in)? It adds an email processor (which one: Supabase SMTP, Resend, …?). | Not built; the table migration is written but the feature flag is off |
| Q20 ★ | `USE_EXACT_ALARM` and `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` are likely Play rejections. OK to recommend removing both in the hand-off? | Yes, recommended in APP_HANDOFF with code |
| Q21 | Google Fonts runtime fetching (`main.dart:143`): disable it (and bundle or drop the extra fonts: Inter, Playfair, Courier Prime, Plus Jakarta Sans, Outfit, Lora), or keep and disclose? | Disclose now; recommend bundling + disabling |

## Admin and platform
| # | Question | Default |
|---|---|---|
| Q7 ★ | The app's **sub-admin invite codes and announcement banner are local-only** (no server effect; codes are guessable). OK for the web portal to introduce server-side `admin_invites` (single-use, hashed, expiring, redeemed via RPC into `app_admins`) and `announcements`, with the hand-off moving the app onto them? | Yes |
| Q22 | Should sub-admins have the same rights as owners, or a read-only/limited role? (`app_admins` has no role column.) | Add `role in ('owner','admin','viewer')`; owners only can invite or publish releases |
| Q23 | Hosting: Vercel (as specified), and do you already have a **staging** Supabase project for previews? | Vercel; previews run with a staging project's env or mocked data, never production |

## Content and claims
| # | Question | Default |
|---|---|---|
| Q14 | Ship the **Bodoni Moda variable font** (OFL, adds the weight and optical-size axes for hover effects) in addition to the app's static weights? About 90 KB woff2 subset, lazy-loaded. | Yes, lazy-loaded for display only; the static app weights stay primary |
| Q15 | Currency on the site: ₹ (matches the screenshots) or locale-aware? | ₹ in copy and posters (matches the screenshots); the simulator follows the browser locale |
| Q16 | Capture demo: may I port the app's NLP date parser rules to TS for the simulator, or should it use fixed real examples? | Port (MIT, your code) |
| Q17 | The brief's "shopping → expense → wardrobe" continuous path: I found no code linking Shopping to Expenses or Wardrobe. Is there one? | The chapter shows them side by side, not as one flow |
| Q18 | "**Zen mode**": the code only has the *Evening review* dialog (`EveningZenReviewDialog`). Is there a Zen mode that collapses the UI? | The beat becomes "Evening review"; no Zen mode claim |
| Q24 | The persona picker (Student · Creative · Professional · Traveller): any feature you want emphasised per persona? | My ordering, from the features list |
| Q26 | Roadmap: what's genuinely planned/"exploring"? | Empty roadmap page with an admin-managed list; hidden until it has one item |

---

## Decisions, round 2 (21 Nov 2026, owner away; remaining questions decided by me)

**D3/D4, Screenshots.** The owner wants demo data in place of the test data. I can't drive a real phone overnight, so:
- The site uses the existing real screenshots through a hand-verified mapping (APP_AUDIT §13).
- Every poster crops the greeting line, so "Football Freak" never appears.
- `scripts/demo-data/` ships a clean demo dataset and a capture checklist, so the owner can recapture with the same filenames. The pipeline picks up new files automatically.

**D10, Regions.** Supabase and Cloudinary are both hosted in India, so personal data rests in India. Groq (USA) only sees opted-in AI requests, and Resend (USA) only sees subscriber emails. Both are disclosed as cross-border transfers under DPDP s.16.

**D12, Age.** The owner wants the app usable by anyone, and I've kept that as far as the law allows:
- **On-device use (no account): every age.** NOTtEodo processes no personal data of the user on its servers in this mode.
- **Accounts, sync and cloud Nodo: 18+, or under 18 with a parent or guardian's verifiable consent.** DPDP s.9 and Rule 10 require that consent before any personal data of a child (under 18) is processed. Sign-up asks for an age confirmation, and the hand-off adds the gate to the app.
- **Play Console target audience: 13+.** Selecting under-13 groups pulls the app into the Families policy, which is designed for children's apps and would restrict the AI chat and cloud features. The rating questionnaire is answered honestly, so it will likely land at "Everyone"/"3+" because the content is benign. Target audience and content rating are different settings.

**D20, Exact alarms and battery.** The owner keeps both *features*; only how they're requested changes, to avoid rejection:
- `USE_EXACT_ALARM` is reserved by Play for alarm/timer/calendar-core apps and needs a declaration. Keep `SCHEDULE_EXACT_ALARM`, plus a one-tap "Allow exact reminders" screen. Alarms still fire at the exact minute once granted.
- `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` (the direct exemption dialog) is only acceptable for chat/VoIP, safety, task-automation and device-companion apps. Replace it with `ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS`, which needs no permission: a "Keep reminders reliable" button opens the battery list, where the user picks NOTtEodo. Same result, no policy risk.
- If the owner still wants to try `USE_EXACT_ALARM`, the planner/calendar argument goes in the declaration form. The hand-off includes both variants.

**D13, Email (Resend).** Built:
- A double opt-in list for "Tell me when NOTtEodo is on Google Play" and "Email me new versions" (`release_subscribers`).
- Sending through the Resend HTTP API (server-only `RESEND_API_KEY`), with unsubscribe in every email.
- Auth emails can also go through Resend SMTP (a dashboard setting; documented in RUNBOOKS).

**D22, Admins.** Every admin (owner or sub-admin) has full rights. There's no role column. Guards: you can't remove the last admin, and every admin write is audited.

**Defaults taken on everything else:**
| Question | Decision |
|---|---|
| Q7 | Server-side invites and announcements |
| Q11 | On-device erase is Settings → Backup & export → *Permanently Erase All Data* |
| Q14 | No variable font: four static weights, with hover stepping between them, to keep the payload small |
| Q15 | ₹ in copy |
| Q16 | Port the capture parser (simplified) to TypeScript |
| Q17 | Shopping, expenses and wardrobe shown side by side, not as one flow |
| Q18 | Zen mode exists (Home chip, `setCleanHomescreenMode`); my earlier search was truncated. The Zen beat stays |
| Q21 | Disclose Google Fonts runtime fetching; hand-off recommends bundling and disabling it |
| Q23 | Vercel; previews need a staging Supabase project, or the site runs in "offline mode" with build-time fallbacks |
| Q24 | Persona order is mine |
| Q26 | Roadmap hidden until an admin adds an item |
