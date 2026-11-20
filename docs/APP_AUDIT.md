# NOTtEodo app audit

*Phase 1 of the website build. Read-only audit of `C:\My_Project\Notteodo` at commit `b2e2c67` (21 Nov 2026).*

Where the code and this document disagree, the code is right. Where the docs (`DESIGN.md`, `README.md`, `PRIVACY_POLICY.md`) and the code disagree, §14 lists the conflict and which side the website follows.

---

## 1. Identity

| Item | Value | Source |
|---|---|---|
| Package / applicationId | `com.notteodo.notteodo` | `android/app/build.gradle*` |
| Version | `1.0.0+1` (versionName 1.0.0, versionCode **1**) | `frontend/pubspec.yaml` |
| min/target/compile SDK | Flutter defaults (`flutter.minSdkVersion` etc.), not pinned | `build.gradle` |
| Release signing | `key.properties` if present, else debug signing when allowed | `build.gradle` lines 39–61 |
| Repo | `https://github.com/Allen73737/NOTtEodo` | `git remote` |
| Description | "A free, private, all-in-one daily organizer for notes, tasks, habits, expenses, and focus." | `pubspec.yaml` |
| Licence | MIT (`LICENSE`) | root |

---

## 2. Colour tokens (authoritative)

### 2.1 Light (Ivory)
From `app_colors.dart`, `app_theme.dart` and `app_component_theme.dart` (`dark: false`).

| Role | Hex | Token in app |
|---|---|---|
| Canvas / scaffold | `#F7F3EE` | `AppColors.background` |
| Surface container (card fill) | `#EFE8E1` | `surfaceContainer` |
| Surface high | `#E8DFD6` | `surfaceContainerHigh` |
| Surface dim | `#E2DDD7` | `surfaceDim` |
| Surface lowest / dialogs, sheets, menus | `#FFFFFF` | `surfaceLowest`, component `surface` |
| Field / chip / outlined button fill | `#F4EFE9` | component `field` |
| Tinted surface | `#F3EEE8` | `goldSurfaceLight` |
| Hairline (cards) | `#E2D8CF` | `goldBorderLight` |
| Divider hairline | `#EDE6DF` | component `hairline` |
| Outline / outline variant | `#727879` / `#C2C7C9` | `outline`, `outlineVariant` |
| Switch/slider track | `#EADFD9` | component `track` |
| Ink (primary) | `#1A1614` Obsidian | `primary`; component `ink` |
| Primary container | `#292524` | `primaryContainer` |
| Tertiary | `#262621` | `tertiary` |
| Text primary | `#1D1C15` | `onSurface` |
| Text secondary | `#424849` | `onSurfaceVariant` |
| Muted (components) | `#6B605A` | component `muted` |
| **Accent / mark** | **`#7A1F2B` Deep Oxblood** | `secondary`; component `mark` and `fill` |
| On accent | `#FFFFFF` | `onSecondary` |
| Rosewood | `#B5505E` | `secondaryContainer`, `themeJournal` |
| Clay | `#9B3B47` | `goldMuted`, `themeExpenses` |
| Noir | `#5A1620` | `goldDark` |
| Oxblood fill (both modes) | `#8E2433` | `goldPrimary` |
| Travel bronze | `#9E7B56` | `themeTravel` |
| Wardrobe linen | `#E9E4D9` | `themeWardrobe` |
| Error | `#BA1A1A` | `error` |
| Snackbar / tooltip | `#1A1614` bg, `#F6F3ED` text, action `#D0485A` | component theme |
| Focus overlay | `#8E2433` @ 18% | `app_motion_theme.dart` |
| Ripple / hover / highlight | `#1C1917` @ 8% / 4% / 4% | `app_motion_theme.dart` |
| Scrollbar thumb | ink @ 28%, 4px (7px hovered), radius 8 | `app_motion_theme.dart` |

### 2.2 Dark (OLED)
From `app_colors.dart` (`dark*`, `gold*`), `app_dark_theme.dart` and `app_component_theme.dart` (`dark: true`).

| Role | Hex | Token in app |
|---|---|---|
| Canvas / surface / card | `#000000` | `darkBackground`, `darkSurface`, `darkCard` |
| Surface high (dialogs, chips, inputs in base theme) | `#0A0A0A` | `darkSurfaceHigh` |
| Sheets, dialogs, menus (component layer wins) | `#0F0D0D` | component `surface` |
| Field / chip fill | `#161313` | component `field` |
| Tinted surface | `#1A0E10` | `goldSurfaceDark` |
| Chip / track container | `#2A0E12` | `AppDarkColors.secondaryContainer` |
| Switch/slider track | `#2A1F21` | component `track` |
| Hairline | `#1E1E1E` | `darkBorder`, `outlineVariant` |
| Oxblood hairline | `#2E1A1D` | `goldBorderDark` |
| Divider | `#221C1D` | component `hairline` |
| Text primary | `#F6F3ED` linen (component layer; base theme says `#FFFFFF`) | `darkTextPrimary` |
| Text secondary | `#A89C9C` (component) / `#B3B3B3` (base theme) | `darkTextSecondary` |
| **Accent text / mark** | **`#D0485A` Oxblood Blush** | `goldLight`, `accentText` |
| Accent fill (buttons, bars) | `#8E2433` | `AppDarkColors.secondary` |
| On fill | `#F6F3ED` | `onSecondary` |
| Snackbar | `#1A1616` | component theme |
| Tooltip | `#2A2424` | component theme |
| Focus overlay | `#D0485A` @ 18% | motion theme |
| Ripple / hover / highlight | `#FFFFFF` @ 10% / 6% / 5% | motion theme |
| Popup shadow | black @ 60% (the only shadow in dark mode) | component theme |

**Website mapping decision:** the component layer (`app_component_theme.dart`) is applied *after* the base theme in both modes, so it wins where they overlap. Text primary is `#F6F3ED` and text secondary `#A89C9C`. `#FFFFFF` / `#B3B3B3` appear only where a base-theme `TextTheme` style is used without an override.

### 2.3 Admin dashboard palette (separate, in `admin_dashboard_screen.dart`)
| Role | Dark | Light |
|---|---|---|
| bg | `#000000` | `#F7F3EE` |
| card (Cards view) | `#0F0D0D` | `#FFFFFF` |
| card (Editorial view) | = bg | = bg |
| border (Cards / Editorial) | `#222222` / `#26211C` | `#E8E2D8` / `#E6E0D5` |
| primary text | `#F5F5F7` | `#1C1917` |
| sub text | `#A1A1A6` | `#78716C` |
| accent | `#D0485A` | `#7A1F2B` |
| alert | `#EF4444` | `#DC2626` |
| "success" | `#D0485A` | `#8E2433` (deliberately not green) |

These are close to, but not exactly, the app tokens. §14 C7 covers how the web admin handles them.

### 2.4 Contrast (WCAG 2.x, computed)
| Pair | Ratio | Result |
|---|---|---|
| `#1D1C15` on `#F7F3EE` | 15.47 | AA |
| `#424849` on `#F7F3EE` / `#EFE8E1` | 8.43 / 7.67 | AA |
| `#6B605A` on `#F7F3EE` / `#EFE8E1` | 5.52 / 5.02 | AA |
| `#727879` on `#F7F3EE` | 4.06 | large text only, so never body text |
| `#7A1F2B` on `#F7F3EE` / `#EFE8E1` | 9.24 / 8.40 | AA |
| `#FFFFFF` on `#7A1F2B` | 10.20 | AA |
| `#B5505E` Rosewood on Ivory | 4.45 | **large only**: use for decoration and ≥24px type |
| `#9E7B56` Bronze on Ivory | 3.51 | **large only**: travel accent text uses `#7A1F2B`, bronze stays decorative |
| `#9B3B47` Clay on Ivory | 6.11 | AA |
| `#F6F3ED` on `#000000` | 18.96 | AA |
| `#A89C9C` on `#000000` / `#1A0E10` | 7.90 / 7.09 | AA |
| `#D0485A` on `#000000` | 4.76 | AA |
| `#D0485A` on `#0A0A0A` / `#1A0E10` | 4.48 / 4.27 | **large only**: accent text on tinted dark surfaces uses `#F6F3ED`, or sits on pure black |
| `#F6F3ED` on `#8E2433` | 7.74 | AA |
| `#8E2433` on `#000000` | 2.45 | **fails**: fills only, never text or an icon on black |
| `#BA1A1A` on `#000000` | 3.25 | large only: errors in dark mode use `#D0485A` text with an icon |

---

## 3. Typography

Bundled in `frontend/assets/google_fonts/` (TTF; the website converts them to woff2 subsets):

| Family | Weights bundled | Italic |
|---|---|---|
| Bodoni Moda | 400, 500, 600, 700 | 400 italic only |
| DM Sans | 400, 500, 600, 700 | 400 italic only |
| Space Grotesk | 400, 500, 600, 700 | none |

**No variable fonts are bundled.** The "variable-weight hover on Bodoni" from the brief has to step between the four static weights, or the site has to ship the Bodoni Moda variable font (OFL, also an optical-size axis). See OPEN_QUESTIONS Q14.

App text styles (`app_typography.dart`, dark overrides in `app_dark_theme.dart`):

| Style | Family | Size / weight / line height / tracking |
|---|---|---|
| displayLg | Bodoni Moda | 44 / 700 / 1.1 / -0.8 (dark: 38 / 700) |
| headlineLg | Bodoni Moda | 28 / 600 / 1.2 (dark: 700) |
| titleLarge (dark) | Bodoni Moda | 22 / 700 |
| app bar title | Bodoni Moda | 20 / 700 |
| dialog title | Bodoni Moda | 24 / 700 / 1.15 |
| titleMedium (dark) | DM Sans | 16.5 / 700 |
| bodyLg | DM Sans | 18 / 400 / 1.6 / +0.2 (dark: 16) |
| bodyMd | DM Sans | 15 / 400 / 1.5 / +0.1 (dark: 14.5) |
| labelMd | DM Sans | 14 / 600 / 1.2 / +0.4 |
| labelSm (eyebrows) | DM Sans | 12.5 / 700 / 1.1 / **+1.2px** (≈0.096em) |
| buttons | DM Sans | 14 / 600 |
| tooltips | DM Sans | 12.5 / 600 |

Space Grotesk is used in the admin dashboard (uppercase headers) and for figures. Users can also pick other fonts at runtime (Inter, Playfair, Courier Prime, Plus Jakarta Sans, Outfit, Lora), which load through Google Fonts runtime fetching (§8).

---

## 4. Shape and spacing

- **Radii in use, most to least common:** 12, 10, 14, 8, 16, 18, 6, 20, 2, 22, 24, 4. Components: inputs, segmented controls, list tiles and snackbars 14; checkboxes 6; tooltips 8; menus 16; time picker 20; dialogs 26; bottom sheets 28 (top corners). Buttons and chips are stadium shapes.
- **Padding in use:** 12, 14, 8, 18, 16, 10, 6, 24. Buttons pad 20×14 (filled) and 18×13 (outlined); inputs 16×14.
- **Elevation:** buttons and dialogs 0 in both modes. Light mode depth comes from fills and warm hairlines. Dark mode has no shadows except the popup menu.

Website scale: `--radius-{xs:6, sm:8, md:12, lg:14, xl:18, 2xl:24, sheet:28, dialog:26, pill:9999}`; spacing on a 2px base, with 6/8/10/12/14/16/18/24 as named stops.

---

## 5. Motion (port targets for `src/motion/tokens/motion.ts`)

### 5.1 Shared vocabulary (`core/motion/reveal.dart`, class `Motion`)
| Token | Value |
|---|---|
| `quick` | 160 ms |
| `standard` | 320 ms |
| `entrance` | 620 ms |
| `exit` | 220 ms |
| `silk` (default ease-out, long tail) | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `settle` (lands with a whisper of overshoot) | `cubic-bezier(0.34, 1.36, 0.64, 1)` |
| `exitCurve` | `cubic-bezier(0.4, 0, 1, 1)` |
| `staggerStep` / `staggerCap` | 55 ms / 520 ms |
| entry delay (first reveal) | 300 ms |
| Reduced motion | `MediaQuery.disableAnimations` OR the in-app "Reduce motion" setting turns durations to zero |

Flutter curves the site needs as CSS: `easeOut` = `cubic-bezier(0,0,0.58,1)`, `easeIn` = `(0.42,0,1,1)`, `easeOutCubic` = `(0.215,0.61,0.355,1)`, `easeInCubic` = `(0.55,0.055,0.675,0.19)`, `easeInOutCubic` = `(0.645,0.045,0.355,1)`, `easeInOutSine` = `(0.445,0.05,0.55,0.95)`, `easeOutBack` = `(0.175,0.885,0.32,1.275)`.

### 5.2 Primitives
| Primitive | What it does | Timing |
|---|---|---|
| `touch_sheen` | Cards view: soft bloom under the finger follows it, rim brightens to a hairline, light drains on release. No tilt. | in 260 ms easeOutCubic; out 720 ms easeInOutSine |
| `edge_light` | Light fills the card's rounded edge from top-centre down both sides as a hold charges (0→1) | driven by hold progress, easeOut |
| `card_peek` | Hold to preview: card picture lifts, grows toward the centre, background blurs and dims | 380 ms `cubic-bezier(0.34,1.3,0.64,1)`; back 300 ms easeInCubic |
| `ink_strike` | Hand-drawn ink line crosses each text line left→right, rising slightly | 460 ms `cubic-bezier(0.45,0,0.2,1)`; lift-out 260 ms |
| `zoom_through` | Opens a screen by zooming out of the card that was touched (rect remembered for ≤900 ms); the page below grows toward the card and dims | uses the page route timing (520 / 300 ms) |
| `scroll_depth` | Cards rise slightly entering from the bottom, sink, shrink and fade leaving past the top ("under glass"). No tilt. | scroll-linked, easeOut in / easeIn out |
| `scroll_fade` | The screen's opening element trails the scroll (parallax) and softens | scroll-linked |
| `count_up` | Counts from 0 on first view, then odometer-rolls on change; keeps ₹, words, decimals and grouping | delay 120 ms, 1250 ms |
| `rolling_text` | Digits roll like an odometer; non-digits crossfade | 520 ms, out easeIn |
| `kinetic_text` | Headline words flip up on a perspective hinge one after another, clearing from blur; plays once | 1100 ms total |
| `reveal` | `rise` (up + slight scale) for content blocks, `fall` for headers/toolbars, staggered cascades | `entrance` 620 ms `silk`, stagger 55 ms (cap 520) |
| `theme_wash` | A disc of the destination canvas colour blooms from the last touch point, the theme flips at the peak, then the wash dissolves; a thin hairline meniscus edges it | 460 ms; grow easeInOutCubic (0–50%), dissolve easeOutCubic (50–100%) |
| `touch_aura` | Every press emits a fine ink ring and a few sparks; at most 6 rings | 520 ms life, easeOutCubic grow, easeIn fade |
| `pressable` | Press sinks the element (scale), release springs back with a soft overshoot; hover lifts a couple of px on pointer devices | down 90 ms easeOut; up 420 ms easeOutBack |
| `transitions` | Shared-axis module switch: incoming slides `travel = clamp(6% width, 18, 64)px` with `silk`, scale 0.985→1, fade from 15%; outgoing drifts 60% back, scale →0.98. **Dimensional** (Cards view) variant: old cards slip away one by one, then new cards arrive from the tab side. Plus overlay entrances: zoom-settle (dialogs), rise (studios/sheets), descend (command palette/search), fade. | 460 ms / out 260 ms; dimensional 760 / 760; page route 520 / 300; overlays 420 ms |
| `offscreen_pause` | Mutes ambient tickers while scrolled out of view; samples visibility ≤4×/s | 250 ms sample interval |
| `motion_column` | List children grow and slide in when added; leaving ones fade, drift and collapse their space; masonry mode | 460 ms in / 320 ms out |

Other motion: editorial kit 900–1300 ms headline reveals; ceremonies (rewards) have their own timelines (§6.3).

---

## 6. Brand assets and luxury/ceremony widgets

### 6.1 Brand (`core/brand`, `assets/images`)
- **Ribbon N monogram** (`notteodo_monogram.dart`): a vector N traced from `notteodo_logo.png`, in a 100×100 box, rotationally symmetric 180°: one continuous loop split into west and east halves so two pens draw it in parallel, plus two short diagonal tails. It has a draw window `[start, end]`, which is exactly what the preloader's stroke-draw needs. Port as SVG paths.
- **App icon** (`notteodo_app_icon.dart`): renders the icon PNG in a squircle on OLED black with a hairline border and an optional ambient pulse.
- **Editorial AI glyph** (`editorial_ai_glyph.dart`): a diamond star inside a concentric aperture ring, drawn in hairlines. Port to SVG.
- PNGs: `notteodo_logo.png`, `notteodo_logo_horizontal.png`, `notteodo_emblem.png`, `notteodo_n_emblem.png`, `notteodo_n_logo.png`.
- Animated SVGs in `assets/animations/` (`gold_divider`, `hero_crest_banner`, `palette_harmony_ribbon`, …) are named after the old gold palette and will be re-rendered in tokens.

### 6.2 Luxury widgets: where they actually appear
| Widget | Reachable by normal users? | Where |
|---|---|---|
| `wax_melt_compression_ritual` | **Yes** | Home **Check-in** ("Press and hold the seal…", monogram N), and Tasks' "celebrate today's completed tasks" stamp |
| `breguet_hands_tracker` | **Yes** | Home Focus card (52px dial) and the Focus Dial |
| `deckled_paper_tear` | **Yes** | Notes: tearing a note away on delete/archive |
| all other 19 (`suminagashi_ink_canvas`, `tourbillon_cage_fabrique`, `cire_perdue_progress_bar`, `letterpress_type_sorter`, `kintsugi_gold_seam`, `guilloche_subdial_gauge`, `cotes_de_geneve_backing`, `clous_de_paris_toggle`, `skeleton_escapement_ticker`, `astronomical_moonphase_disc`, `torricelli_barometer_gauge`, `champleve_metric_gauge`, `cloisonne_enamel_badge`, `grand_feu_enamel_card`, `lapis_lazuli_shimmer_card`, `amber_tortoiseshell_container`, `gilded_edge_sweep`, `parchment_watermark_view`, `signet_intaglio_engraver`) | **No** | Only in `GrandMasterLuxurySuiteScreen`, opened from the **admin** dashboard (and an enterprise shortcut in `main.dart`) |

**Consequence for honesty:** the website may use the suminagashi, tourbillon, letterpress, cire-perdue and kintsugi *ideas* as its own decoration, but `/craft` and feature copy must not say users see them in the app. Several of these also use off-brand colours (lapis = ultramarine blue, moonphase = midnight-blue enamel with gold stars, gilded/cloisonné = gold, grand feu = orange-gold; hexes such as `#C0C5CF`, `#B0B7C3`, `#D81B60`, `#C41E3A`, `#8B0000`). The website re-renders every one of them in Ivory/Oxblood tokens.

### 6.3 Rewards and ceremonies (`core/rewards`) — all user-facing
- **Rewards host:** on the first open of each day it plays the streak screen (the very first open doubles as the welcome); badges as they're earned; the daily goal when met. Ceremonies queue one at a time.
- **Two ceremony styles:** *Cards* (dark blurred stage, drifting embers, breathing glow, medal finishes by tier 0–3, confetti plus a big haptic) and *Editorial* (type rising from blur, rolling numbers, a hairline circle drawn with a bead, an engraved seal of concentric hairlines and ticks).
- **Streak calendar:** a month grid; filled = opened, outlined with a snowflake = covered by a streak freeze/repair, today ringed; weekly recap from the corner.
- **Weekly recap:** the last 7 days vs the 7 before, plus badges earned.
- **Milestone share:** a PNG with only the badge, its title and the app name, and **nothing personal**.
- **Levels:** 10 XP per hands-on action plus a tier-weighted badge bonus; each level needs 100 more than the last. Assistant actions don't earn rewards (`RewardBus.quietly`).

---

## 7. Feature inventory (verified in `frontend/lib/features` and `app_guide.json`)

Navigation: an indexed shell in `main.dart` (`home 0, notes 1, tasks 2, planner 3, wardrobe 4, expenses 5, travel 6, journal 7, moodboard 8, habits 9, shopping 10, settings 11`). The bottom dock flips between a **Workspace** set (Home, Notes, Tasks, Planner, + Wardrobe on wide screens) and a **Life** set (Expenses, Travel, Journal, Moodboard, Habits, + Vault on wide screens). There's a drawer menu, a Universal Spotlight search, and the **Aa** pill (Cards ↔ Editorial) plus a sun/moon toggle in the top bar.

| Module | Cards / Editorial views | Notable verified features |
|---|---|---|
| Home | ✓ / ✓ | Greeting, daily brief, Capture chip, **Check-in** (wax seal), **Your week**, Focus card (Breguet dial), Nodo pulse card (*Inspire Me*, *Roast My Focus*), timeline, weekly digest, "Arrange this page" |
| Notes | ✓ / ✓ | Notebook, pinned, **Ask your notes** (on-device RAG with citations, `notes_rag_modal`), **Map of notes** (graph view), Briefing, paper-tear delete |
| Tasks | ✓ / ✓ | Today / Upcoming / Anytime / Done, natural-language entry ("call mom tomorrow 5pm"), "Close the day", ink strike on complete, celebrate stamp |
| Planner | ✓ / ✓ | Day strip, events, tasks with dates, ICS import/export |
| Habits | ✓ / ✓ | Heatmap, streaks, habit rewards sheet |
| Focus Dial | modal | 15/25/45/60/90 min or custom, ambient audio (e.g. "rain"), Quick Settings "Focus Sanctuary" tile, launcher shortcut |
| Expenses | ✓ / ✓ | Monthly budget, per-day allowance, subscriptions, category limits (envelopes), **Split a bill / Track who owes whom**, CSV import/export, recurring roll-over, "A note from Nodo" |
| Wardrobe | ✓ / ✓ | Outfits (fabric, weather tags), outfit of the day widget; on-device classifier |
| Travel | ✓ / ✓ | Trips, packing, "Plan with Nodo"; bronze accent |
| Journal | ✓ / ✓ | Entries with mood ("Reflective"), voice memos (native recorder), encrypted vault view |
| Moodboard | ✓ / ✓ | Pins from uploaded photos or image links, flip cards |
| Shopping | ✓ / ✓ | Lists |
| Vault | – | PIN / biometric-locked private notes, encrypted on device |
| Bin | ✓ / ✓ | Soft-deleted items |
| Profile | – | **Curator Passport** |
| Widgets | – | Widget Studio: sticky memo, daily checklist, Polaroid pin, outfit of the day, budget meter, voice memo, boarding pass, focus clock; shows level/badge progress |
| Capture | – | One line → task / note / expense / event; entry points: Home chip, dock +, launcher shortcuts (Quick Capture, Voice Memo, Focus Timer), Quick Settings tiles (Quick Capture, Quick Voice Memo, Focus Sanctuary), Android share sheet (text, image, multiple images) |
| Nodo | floating orb, editorial "Ask" | Chat, tool actions (adds tasks/notes/expenses), personas (witty, scholarly, stoic, energetic), memory, thumbs rating |
| Rewards | – | §6.3 |
| Notifications | – | Reminders, daily nudges, quiet hours, exact alarms, boot re-arm |
| Sync & backup | – | Optional account; encrypted backup file; CSV/ICS export; erase local data |
| Admin | ✓ / ✓ | §10 |

**Present in the code but not exposed to normal users:** `core/systems/*` (nostr relay sync, steganography vault, sovereign mesh sync, time-lock cryo vault, isochronic generator, ZKP expense audit, Monte Carlo runway, etc.) are referenced only from the admin-only Grand Master Luxury Suite or the enterprise diagnostics. **The website will not market any of them.**

---

## 8. Data-flow inventory

| Flow | What leaves the device | To | When | Evidence |
|---|---|---|---|---|
| Local storage | nothing | – | always | `LocalStore`: every value AES-256-GCM with a random 256-bit data key; slot name as AAD; the key is wrapped by Android Keystore (and optionally by PBKDF2-HMAC-SHA256(PIN, 600k)) |
| Android backup | nothing | – | – | `allowBackup="false"`, `fullBackupContent="false"`, `usesCleartextTraffic="false"` |
| Account auth | email, password (to Supabase Auth), Google OAuth | Supabase | sign-in | `signInWithPassword`, `signUp`, `signInWithOAuth(google)`; MFA dialogs; **RLS requires AAL2** for users with a verified factor |
| Password breach check | **first 5 hex chars of SHA-1** only, padded responses | api.pwnedpasswords.com | sign-up / password set | `password_policy.dart` (min 10 chars, NIST-style blocklist, entropy score, no email local-part) |
| Cloud sync | each module as one JSON row in `user_collections` (≤5 MB). **Plaintext JSON unless the E2E passphrase is on**; with it, an `{"v":1,"ct":…}` envelope, and the server refuses plaintext once a key exists | Supabase (Postgres) | signed in | `20261101…`, `20261102…` (`user_keys`: PBKDF2-HMAC-SHA256 600k, AES-256-GCM wrapped key) |
| Media | photos, voice notes → `users/<uid>/<category>` with EXIF/GPS stripped (`fl_strip_profile`) via signed upload | Cloudinary | signed in, after sync | `cloudinary-sign`, `MediaBackupService` |
| Nodo cloud | query (≤6000 chars), **context digest of matching user items** (≤10000), **profile digest of live app state**, persona, recent history; Groq receives `user: <supabase user id>` | Supabase edge `ai-assist` → **Groq** (`api.groq.com/openai/v1`), models `llama-3.3-70b-versatile` → `openai/gpt-oss-120b` → `llama-3.1-8b-instant` (env-overridable) | **signed in AND `cloudAi` setting not false. Defaults to ON.** | `groq_ai_service.dart`, `nodo_llm.ts` |
| Nodo memory | LLM-extracted facts/preferences/goals/style/person/routine (≤300 chars each, ≤150 per account); rolling summary (≤2000 chars); de-personalised Q/A turns (30-day prune); shared de-personalised app insights | Supabase tables `nodo_memories`, `nodo_threads`, `nodo_turns`, `nodo_app_insights` | after each cloud chat | `20261119…`, `nodo_memory.ts`. User can view/delete memories (Settings → Nodo assistant). **All cascade-delete with the account** except `nodo_app_insights` (no user id) |
| Voice transcription | **raw audio (≤~3 MB base64)** | `ai-assist` → Groq Whisper (`whisper-large-v3-turbo`) | when cloud transcription is used | `ai-assist/index.ts` `task:"transcribe"` |
| Document RAG | document text chunks (500/50) | Supabase `document_chunks` | signed in, Spaces docs | `rag-embedder` |
| Vault audit | an "accessed" event only (no PIN/key) | `security_audit_logs` | vault unlock when signed in | `vault-gatekeeper` |
| Feedback | title, description, type, impact, category, device info, email, display name | `user_feedback` | user sends feedback (signed in) | `feedback_service.dart`; RLS own + admin |
| Moodboard image links | the user's URL is fetched directly | the third-party host | viewing a pin | `Image.network` (11 call sites) |
| **Google Fonts runtime fetching** | font requests (IP, UA) | fonts.gstatic.com | when a non-bundled font is chosen (Inter, Playfair, …) or a bundled weight is missing | `main.dart:143` `allowRuntimeFetching = true` |
| Calendar | **no calendar permission**; the app fires `INSERT/EDIT` event intents to the calendar app, and ICS import/export goes through the file picker | – | user action | manifest `<queries>` |
| Widgets | data cached on device for the launcher widget | – | – | `home_widget`, `NotteodoWidgetProvider` |
| Analytics / ads / crash SDKs | **none** | – | – | `pubspec.yaml` deps: no firebase, analytics, sentry, admob |

**Retention known from code:** rate-limit records 1 day; `ai_usage` 35 days; `security_audit_logs` 365 days; `nodo_turns` 30 days; everything else until the user deletes it or deletes the account. AI quota: 200 requests per user per day (`AI_DAILY_REQUESTS`). Rate limits: `ai-assist` 30/min, `delete-account` 3/h, vault 5/min, feedback 20/day.

**Account deletion (`delete-account`):** requires `{"confirm":"DELETE"}`. It deletes `user_feedback` rows explicitly (they would otherwise keep the email, since `ON DELETE SET NULL`), deletes Cloudinary images and videos under `users/<uid>/` (best effort), then `auth.admin.deleteUser`. That cascades to `user_collections`, `user_keys`, `ai_usage`, `security_audit_logs`, `nodo_memories`, `nodo_threads`, `nodo_turns` and every legacy table keyed on `auth.users`. **Not deleted:** `nodo_app_insights` (holds no user id); Supabase/Vercel/Groq operational logs per those providers' retention. **No partial deletion endpoint exists** (but Nodo memory can be cleared on its own with `task:"forget"`).

---

## 9. Permissions (Android manifest)

| Permission | Purpose (manifest comment) | Play policy status |
|---|---|---|
| `INTERNET` | sync, Google Fonts, moodboard images | normal |
| `USE_BIOMETRIC`, `USE_FINGERPRINT` | biometric unlock | normal |
| `RECORD_AUDIO` | voice capture and dictation | runtime; must be disclosed |
| `POST_NOTIFICATIONS` | reminders | runtime |
| `VIBRATE` | haptics | normal |
| `SCHEDULE_EXACT_ALARM` | exact reminders | special access; OK with a runtime flow |
| **`USE_EXACT_ALARM`** | exact reminders | **⚠ restricted to alarm-clock/calendar-core apps; Play is likely to reject it.** Recommend removing it and keeping `SCHEDULE_EXACT_ALARM` |
| `RECEIVE_BOOT_COMPLETED` | re-arm reminders | normal |
| **`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`** | OEM alarm delivery | **⚠ restricted; requires an acceptable use-case declaration.** Recommend removing it and deep-linking to battery settings instead |

Other surfaces: share targets (text/plain, image/*, multiple images), launcher shortcuts (`notteodo://shortcut/capture|voice|focus`), 3 Quick Settings tiles, 1 app widget provider, `NotificationReceiver` (not exported), `SystemEventsReceiver` (boot/package replaced/time/timezone). `FLAG_SECURE` is toggled from Dart (privacy screen).

---

## 10. Deep links (as implemented)

- Schemes: `io.supabase.notteodo://login-callback` (OAuth) and `notteodo://shortcut/<target>`. The widget also sends `notteodo://module/<name>` (no intent filter needed, since it's an explicit intent). **No `https` App Links today.**
- `MainActivity.kt` builds the target as `host + path` (or just one of them) and forwards it to Dart (`onDeepLink`) after 400 ms. Tiles send the `route` extra.
- Dart `_handleDeepLink` (`main.dart` ≈790–846) lower-cases the target, strips everything up to `shortcut/`, **removes every `/`**, then matches:
  - `recap|week` → Weekly recap · `focus|dial` → Focus Dial · `voice|voicememo|record` → Voice Studio · `capture|quickcapture|omnicapture` → Quick Capture
  - module names and aliases → that module (`home/today, notes/note, tasks/task, planner/calendar, wardrobe/ootd, expenses/treasury/budget/money, travel/trip, journal/memoir/voice-notes, moodboard/pin/pins, habits/habit, shopping, settings`)
  - anything else → Home
- **Consequence:** of the website's planned `/open/*` routes, only `capture`, `focus` and the module landings work today. `note/new`, `task/new` and `expense/new` would collapse to `notenew`/`tasknew`/`expensenew` and land on Home. `settings/account` lands on Home, and `feedback/<id>` and `release/latest` aren't supported. All of these go into `APP_HANDOFF.md`.

---

## 11. Admin dashboard (to replicate)

`admin_dashboard_screen.dart` (4845 lines). Access: `is_app_admin()` RPC checked after sign-in. Tabs, in order:
1. **Overview**: "SYSTEM HEALTH & TELEMETRY", "SYSTEM STATUS", "CLOUD SYNC" (CONNECTED / LOCAL READY), "TOTAL RECORDS" (**counts the admin's own local notes/tasks, not server totals**), "ENCRYPTED SLOTS", "AUDIT LEDGER", "ACTIVE AI MODEL", "OUTBOX MUTATIONS", "USER VOICE & IDEAS", "SYSTEM DIAGNOSTIC SUITE", "ADVANCED SUITES & LABS"
2. **Users & Sub-Admins**: "USER MANAGEMENT & SUB-ADMIN DELEGATION", "SUB-ADMIN INVITATION LINKS", "USER DIRECTORY & DELEGATION", "LOCKDOWN"
3. **Cloud & Network**: "CLOUD & NETWORK HEALTH MONITOR", "CLOUDINARY MEDIA ASSETS"
4. **Database & Vault**: "DATABASE & LOCAL VAULT", "VAULT OPERATIONS & BACKUPS"
5. **AI Engine**: "AI ENGINE & MODEL COMMAND"
6. **Alerts & Logs**: "IN-APP ANNOUNCEMENT BANNER", "SCHEDULED & INSTANT NOTIFICATION TESTER", "HAPTICS & VIBRATION BENCHMARK"
7. **User Voice / Feedback**: "USER VOICE & FEATURE SUGGESTIONS", "TOTAL IDEAS", "PENDING TRIAGE", "ROADMAP PLANNED", "COMPLETED / RESOLVED"
8. **Screen Inspector & Flows**: launches screens for audit (Look & Feel, Display, Notifications, Audio, Security, Sync, Backup, AI, Finance, Privacy charter, Diagnostics, About)

Plus the **Nodo Architect** sheet (`admin_ai_assistant_sheet.dart`, `ai-assist` `mode:"admin"`, server-gated).

**⚠ Sub-admin invites are client-side only.** `createSubAdminInviteCode()` generates `NT-SUB-<time36>-<4 digits>` and stores it in the admin's **local app settings**; redeeming adds an email to a local `subAdminEmails` list. None of this touches `app_admins`, so a "sub-admin" gets no server rights, and the codes are guessable. The announcement banner is likewise stored in local settings, not on the server. **The web portal can't "replicate" these honestly.** It will implement server-side equivalents (an `admin_invites` table + RPC, and `announcements`) and the hand-off moves the app onto them. See OPEN_QUESTIONS Q7.

---

## 12. Backend inventory (Supabase)

- **Project:** one hosted project (its URL is compiled into `app_config.dart`; it's public, but I won't repeat it in the website repo, which reads it from env).
- **Tables:** `profiles, spaces, notes, documents, document_chunks, tasks, events, habits, habit_logs, wardrobe_outfits, expenses, settlements, trips, packing_items, shopping_items, memoirs, moodboard_pins, encrypted_vault, security_audit_logs` (legacy per-module schema; the current app syncs through `user_collections`), `rate_limit_records, user_collections, user_keys, ai_usage, user_feedback, app_admins, nodo_memories, nodo_threads, nodo_turns, nodo_app_insights`.
- **RLS:** enabled on all of them. `FORCE` on `user_collections, user_keys, user_feedback, app_admins, nodo_*`. A restrictive MFA policy on `user_collections` and `user_keys`.
- **Functions:** `is_app_admin()` (SECURITY DEFINER, `search_path` set, authenticated only), `check_rate_limit`, `log_security_event`, `consume_ai_quota`, `match_documents`, `search_sanctuary_universal`, `enforce_e2ee_collections`, `mfa_satisfied`, `limit_feedback_rate`, `nodo_trim_memories`, `nodo_note_question`, `nodo_rate_insight`, `handle_new_user`, `set_updated_at`.
- **pg_cron jobs:** `nt_prune_rate_limits`, `nt_prune_ai_usage`, `nt_prune_audit_logs`, `nt_prune_nodo_turns`.
- **Edge functions:** `ai-assist` (ask / feedback / memories / forget / insights / insight_review / group_names / transcribe), `scoped-ai`, `rag-embedder`, `cloudinary-sign`, `delete-account`, `vault-gatekeeper`.
- **`user_feedback`:** statuses `pending|reviewed|planned|resolved`; types `feature_suggestion|general_feedback|bug_report|ui_enhancement`; `admin_notes` exists but there are **no reply columns** (`admin_reply`, `replied_at`, `replied_by`), so the website migration adds them.
- **Help knowledge base:** `backend/supabase/functions/_shared/app_guide.json` (27 sections; mirrored in the app at `assets/nodo/app_guide.json`, kept identical by a test). Sections: overview, navigation, views, home, capture, notes, tasks, planner, habits, focus, expenses, wardrobe, travel, journal, moodboard, shopping, vault, bin, profile, widgets, badges, notifications, settings, backup, privacy, nodo, feedback.

---

## 13. Screenshot audit (all 30 opened)

All are 1084×2412 RGBA. **Every Editorial-view file matches its name. Most Cards-view (`bento`) files do not.**

| File | Expected | Actually shows | OK? |
|---|---|---|---|
| `01_bento_home_{dark,light}` | Home, Cards | **Expenses**, Cards | ✗ |
| `01_home_{dark,light}` | Home, Editorial | Home, Editorial ("Good evening, Football." / "Still up, Football.") | ✓ |
| `02_bento_notes_{dark,light}` | Notes, Cards | **Travel** (empty: "No trips yet"), Cards | ✗ |
| `02_notes_{dark,light}` | Notes, Editorial | Notebook, Editorial | ✓ |
| `03_bento_tasks_{dark,light}` | Tasks, Cards | **Journal**, Cards | ✗ |
| `03_tasks_{dark,light}` | Tasks, Editorial | Tasks, Editorial (empty: "A clear day.") | ✓ |
| `04_bento_planner_{dark,light}` | Planner, Cards | **Moodboard** (empty: "Your board is empty"), Cards | ✗ |
| `04_plan_{dark,light}` | Planner, Editorial | Today/planner, Editorial (empty: "An open day.") | ✓ |
| `05_bento_habits_{dark,light}` | Habits, Cards | **Expenses** again (different Nodo note), Cards | ✗ |
| `05_habits_{dark,light}` | Habits, Editorial | Habits, Editorial (empty: "Begin with one.") | ✓ |
| `06_bento_expenses_{dark,light}` | Expenses, Cards | **Home**, Cards ("Good afternoon, Football Freak.") | ✗ |
| `06_expenses_{dark,light}` | Expenses, Editorial | Money/November, Editorial | ✓ |
| `07_bento_dial_{dark,light}` | Focus Dial, Cards | **Home with the Quick add sheet open**, Cards | ✗ |
| `07_focus_dial_{dark,light}` | Focus Dial, Editorial | Watchmaker focus dial modal over Money | ✓ |
| `08_bento_nodo_ai_{dark,light}` | Nodo, Cards | Nodo chat sheet over Home, Cards | ✓ |

Theme (light/dark) matches the filename in all 30.

**What this means:**
- Cards view **exists** for Home (`06_bento_expenses_*`), Expenses (`01_bento_home_*`, `05_bento_habits_*`), Travel, Journal, Moodboard, Quick add (`07_bento_dial_*`) and Nodo.
- Cards view is **missing** for Notes, Tasks, Planner, Habits and Focus Dial.
- The sync script will classify by a hand-verified manifest (`scripts/screenshot-map.json`), not by filename, until the files are renamed.
- Content: test data shows the display name "Football Freak" and journal text "hi I am gopd". Several screens are empty states. See OPEN_QUESTIONS Q3 and Q4.

---

## 14. Conflicts between docs and code

| # | Conflict | Website follows |
|---|---|---|
| C1 | `DESIGN.md` uses the old teal/terracotta palette; `app_motion_theme.dart`'s comment still says "terracotta" | `app_colors.dart` (Ivory & Oxblood) |
| C2 | Dark text primary: base theme `#FFFFFF` vs component theme `#F6F3ED`; secondary `#B3B3B3` vs `#A89C9C` | component theme (it's applied last): `#F6F3ED` / `#A89C9C` |
| C3 | Light focus colour: motion theme `#8E2433`@18% vs input focus border `#7A1F2B` | ring = `#7A1F2B` 2px solid (meets 3:1 non-text contrast); hover/focus fill = `#8E2433`@18% |
| C4 | `PRIVACY_POLICY.md` says Settings → **Assistant**; the code says Settings → **Nodo assistant** | code |
| C5 | `PRIVACY_POLICY.md` says erase is under Settings → **Privacy & data**; `app_guide` says **Backup & export**; settings has "Permanently Erase All Data" in the Backup/Data Portability area | will verify on device; see OPEN_QUESTIONS Q11 |
| C6 | `PRIVACY_POLICY.md` omits Nodo memory/threads/turns/insights, voice transcription via Groq, the user id sent to Groq, HIBP, Google Fonts runtime fetching, image-link fetching, the plaintext cloud copy without the passphrase, retention periods, legal bases and rights | rewrite in Phase 6 |
| C7 | Admin dashboard uses its own near-token greys (`#F5F5F7`, `#A1A1A6`, `#78716C`) and Tailwind reds (`#EF4444`, `#DC2626`) | web admin uses the nearest app tokens; alerts use `#BA1A1A` (light) / `#D0485A` + icon (dark). Recorded so the forbidden-colour lint passes |
| C8 | Luxury widgets carry blue/gold/orange hexes | re-rendered in tokens on the web; never shown as "in the app" |
| C9 | `README.md` markets "Sovereign" systems (nostr mesh, steganography, ZKP…) that only exist behind the admin lab | not marketed |
| C10 | Sub-admin invites and the announcement banner look server-backed in the UI but are local-only | web implements them server-side; hand-off migrates the app |
| C11 | Screenshot filenames vs contents (§13) | hand-verified manifest |
| C12 | Old policy: "not used to train models" (Groq) | will cite Groq's current terms in Phase 6 instead of asserting |

---

## 14a. Tooling available on this machine
Node v22.16.0, pnpm 10.34.9, git 2.50.0, Python with Pillow 12.3.0. The Next.js/React/three versions get pinned and recorded here at install time (Phase 2).
