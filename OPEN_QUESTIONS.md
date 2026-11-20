# Open questions

These are things I can't verify from the code, or decisions only you can make. Each has a default I'll use if you don't answer. **★ = blocks Phase 6 (Play compliance) or affects what's legally true.**

## Identity and placeholders
| # | Question | Default if unanswered |
|---|---|---|
| Q1 ★ | Is NOTtEodo **live on Google Play** yet (or in closed testing)? If not, should the primary CTA be the APK until it is? | Play badge shown as "Coming to Google Play" (not a link) with APK primary, switched by `platform_config.play_live` |
| Q2 ★ | Do you commit publicly to **"Free forever / no ads / no paywalls"**? It's a promise, not a code fact. | Use "Free. No ads. No trackers." without "forever"/"ever" until you confirm |
| Q5 ★ | `[DEVELOPER NAME]`, `[SUPPORT EMAIL]`, `[DOMAIN]`, postal address (required for some jurisdictions and for a Play developer account with monetisation), your country of residence (decides GDPR rep / DPDP / imprint). | Placeholders, listed in the final report |
| Q19 ★ | Play App Signing: is it enabled? I need the **upload key** and **app signing key** SHA-256 fingerprints for `assetlinks.json` (config only, never committed as secrets). Will the website APK be the Play-signed universal APK, or signed with your upload key? (The APK must match the Play build's signature, or sideload users can't update from Play.) | Fingerprints come from env vars; the build fails loudly if they're empty in production |

## Screenshots
| # | Question | Default |
|---|---|---|
| Q3 | 14 of the 16 `bento` (Cards view) screenshots show a different screen from their filename (see APP_AUDIT §13). Please **recapture Cards view for Home, Notes, Tasks, Planner, Habits, Expenses and Focus Dial** with the same naming. Also wanted, both themes and both views: Wardrobe, Travel (with a trip), Journal, Moodboard (with pins), Shopping, Vault (locked screen), Bin, Profile / Curator Passport, Widget Studio, a home screen with widgets, the Check-in seal, the streak calendar, a ceremony, Notes → Map of notes, Ask your notes, the Quick Settings tiles, the share sheet, Settings → Nodo assistant (memories). | I use a hand-verified mapping; Cards-view gaps are filled with HTML recreations labelled "Illustration" |
| Q4 | The screenshots contain test data ("Football Freak", "hi I am gopd", "ration kada"). OK to publish, or should I crop/blur names? Better: recapture with a clean demo dataset (I can write one as a JSON backup you restore). | Crop the greeting/name area on posters; never alter the UI otherwise |

## Privacy and policy facts
| # | Question | Default |
|---|---|---|
| Q6 ★ | **Cloud Nodo is on by default** for signed-in users (`cloudAi != false`), so item context goes to Groq unless the user turns it off. Keep this default (the policy will say so plainly), or switch to opt-in in the hand-off? | Disclose as-is; recommend opt-in in APP_HANDOFF |
| Q8 ★ | Groq receives `user: <Supabase user id>` with every request. OK to disclose as "a pseudonymous account ID", or remove it in the hand-off? | Disclose; recommend sending a salted hash instead |
| Q9 ★ | Is Groq's **zero data retention** enabled on your Groq org? (Their default may retain for abuse monitoring.) I'll cite their published terms either way. | Policy says "retained per Groq's terms, not used for training (as stated in their terms)" with a link; no stronger claim |
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
| Q25 | Do you want an `/imprint` page (needed if you're based in Germany/Austria or run it commercially there)? | No |
| Q26 | Roadmap: what's genuinely planned/"exploring"? | Empty roadmap page with an admin-managed list; hidden until it has one item |
