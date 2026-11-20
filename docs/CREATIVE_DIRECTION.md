# Creative direction: "The Atelier of an Ordered Life"

*Phase 1. Every claim on the site is checked against `docs/APP_AUDIT.md`. Anything marked ⟂ depends on an answer in `OPEN_QUESTIONS.md`.*

---

## 1. The idea in one paragraph

NOTtEodo is a private atelier. A watchmaker keeps time there, an editor keeps the words, and you keep your life. The website is **one continuous camera move through that room**: ivory paper on a work bench, a pool of oxblood ink, a stick of sealing wax, a watch movement under a loupe, and a phone lying among them. Each chapter is one object on the bench, and each object is a real thing the app does. The site never shouts. It stays quiet for long stretches and then lets one moment land.

**Three words:** precise, sensual, honest.
**One rule:** every flourish points at something real in the app. If a moment can't name the feature it stands for, it's cut.

---

## 2. Moodboard (in words: references only, nothing copied)

| Reference territory | What we take | What we leave |
|---|---|---|
| Maison campaign sites (couture houses' seasonal microsites) | Full-bleed silence, a single object lit like a product, type set enormous and then left alone | Autoplay video with sound, logo walls |
| Haute-horlogerie microsites (movement explainers) | Exploded views that assemble on scroll, macro lighting on bevels, the "time, well kept" restraint | Gold, blue steel, champagne gradients (off-palette) |
| Independent print magazines (Kinfolk-era, Swiss-grid annuals) | Editorial view's flush type, rules instead of boxes, numbered chapters, generous margins, captions as a design element | Fake issue numbers that imply a real publication: our "issues" are clearly posters |
| Museum exhibition sites | Wall-label captions, one artefact per room, calm wayfinding (the chapter numerals I–XVII) | Dense collection grids |
| Japanese craft: suminagashi marbling, kintsugi, washi | Ink-on-water motion, the beauty of the repaired seam, deckled edges, paper grain | Gold lacquer (our seams are oxblood) |
| Letterpress and wax seals | The bite of type into paper, the slow press of a seal: physical, tactile, ceremonial | Faux-antique "olde" ornament |
| Award-winning WebGL portfolios | One persistent canvas, a camera on a spline, DOM and GL in lockstep, honest fallbacks | Chromatic aberration, RGB-split, neon bloom, rainbow noise |

**Material palette.** Ivory mode: cotton paper (grain, a faint laid-line watermark), oxblood ink, oxblood wax, raw brass *read as warm grey-brown* (never gold), obsidian glass, linen. OLED mode: black velvet, black glass, oxblood rim light, linen highlights. Bloom only on oxblood. No grey haze.

**Light.** Ivory: a daylight atelier with a large soft window key from upper left, warm bounce from the paper, long soft contact shadows. OLED: a void with a single oxblood rim from behind-right, a narrow linen key, and no ambient light at all.

---

## 3. Motion language

The site moves the way the app moves. Every duration and curve comes from `tokens/motion.ts`, generated from the app (see APP_AUDIT §5).

| Principle | In practice |
|---|---|
| **Silk, then settle** | Things arrive on `silk` (0.16, 1, 0.3, 1) over 620 ms. Things that *land* (cards, seals, badges) use `settle` (0.34, 1.36, 0.64, 1), which has a whisper of overshoot and is never springy. |
| **Nothing tilts** | The app deliberately removed 3D tilt (`scroll_depth`, `touch_sheen`: "Nothing moves or tilts"). The site's DOM never tilts on hover. Depth comes from light, scale and blur. Only the WebGL camera moves in 3D. |
| **Light, not wobble** | Hover = `touch_sheen` bloom plus an `edge_light` hairline. Press = `pressable` sink (90 ms) and release (420 ms easeOutBack). |
| **Ink is the transition** | Theme changes are a `theme_wash` disc from the click point (460 ms). Strikes are `ink_strike` (460 ms, 0.45 0 0.2 1). Route curtains are oxblood ink, not a coloured slab. |
| **Stagger like a dealer** | 55 ms steps, capped at 520 ms, so a long list never takes longer than half a second to arrive. |
| **Exit fast** | Exits are 220–300 ms on `exitCurve`. Leaving should never block arriving. |
| **Silence is a beat** | Every pinned chapter holds still for ~20% of its scroll length with nothing moving, so the type can be read. |
| **Scroll is the clock** | Scrubbed scenes map to scroll progress, never to time, so nothing plays while the reader isn't moving (except ≤5 s ambient loops, which pause off-screen per `offscreen_pause` and have a global pause control). |

**Three rendering paths, designed together:**
- **Full:** WebGL world, fluid, postprocessing.
- **Lite:** pre-rendered AVIF/video sequences of the same frames, scrubbed by scroll; CSS motion only.
- **Reduced / no-JS:** the same chapters as a calm editorial article. Each chapter becomes a static poster plus text, with crossfades only, and no pinning or scroll-jacking.

The storyboard below states all three for each chapter.

---

## 4. The camera and the bench

One R3F canvas, one CatmullRom spline over the bench, authored in Theatre.js. Seventeen keyframe stations. The "bench" is laid out left to right in the order of the app's cycle: **Capture → Curate → Plan → Live → Remember**, then Nodo, Privacy, Free, Try and the Finale. The camera moves forward through time.

```
 [ink pool]──[phone]──[card deck]──[share sheet]──[notebook constellation]──[planner sheets]
      I        II         III            IV                    V                     VI
 ──[wax & paper]──[watch movement]──[ledger & type case]──[wardrobe/passport]──[journal]
         VII              VIII                IX                      X                XI
 ──[Nodo glyph]──[widget wall]──[vault]──[strike board]──[simulator]──[landing velvet]
        XII           XIII          XIV        XV              XVI            XVII
```

---

## 5. Storyboard: the homepage film

Format per chapter: **Beat** (what happens), **Copy** (draft headline, Bodoni italic), **Truth** (the app fact it rests on), **Lite / Reduced** (the fallbacks).

### 0. Preloader
- **Beat:** on bare canvas, the ribbon N draws itself with two pens in parallel (the app's own monogram geometry, west and east halves). The wordmark NOT*t**e*odo writes beneath it. The ink then loosens into the fluid field of chapter I. A cire-perdue bar (a sprue filling with molten oxblood) is the real asset-load progress. At most 2.2 s, skippable, once per session.
- **Truth:** `notteodo_monogram.dart` draw window.
- **Lite / Reduced:** static monogram plus wordmark, a 200 ms fade. No preloader at all if assets are cached.

### I. Hero: Ink in water
- **Beat:** a suminagashi field fills the viewport. Oxblood rings spread on ivory water (linen on black in OLED). The cursor or finger drags the ink. "*Curate your everyday.*" rises word by word on the `kinetic_text` hinge, clearing from blur. The phone surfaces through the ink with the real **Home, Cards view** screenshot in the current theme. Three glass cards (Notes, Tasks, Money) drift with `scroll_depth`.
- **CTAs:** Get it on Google Play ⟂(Q1) · Download APK (live version, size, date) · Open in app (Android, App Links only).
- **Trust strip:** Free forever · No ads · No trackers · Works offline · Encrypted on your phone.
- **Truth:** no ad/analytics SDKs in `pubspec.yaml`; `LocalStore` AES-256-GCM; offline-first per `app_guide.overview`. ("Free forever" is a promise only you can make: ⟂Q2.)
- **LCP:** the headline is HTML text painted before any WebGL.
- **Lite:** a 4-second AVIF ink loop poster plus a static phone. **Reduced:** a static ink still.

### II. The Aa moment
- **Beat:** the camera squares up to the phone. A drag handle splits the screen. Left is Cards view, right is Editorial view (the same screen, real screenshots). Release past halfway and **the whole site** switches view with it: cards lose their boxes, rules appear, the Bodoni grows. Then the sun/moon key: an ink-wash disc floods from the click point and the bench re-lights between window daylight and the black void.
- **Copy:** "*Two ways to see the same day.*"
- **Truth:** `views` guide section; `theme_wash.dart`.
- **Lite:** two crossfading images plus the same global switch. **Reduced:** side-by-side diptych, switch without the wash.

### III. One app, every part of life
- **Beat:** a deck of module cards slides from the phone and deals out like a croupier's hand (`card_peek` lift, `settle` landing), fans in 3D, then drops with light physics into a masonry board. Hovering a card shows its poster. Clicking zooms through it to `/features/[slug]` (`zoom_through`).
- **Copy:** "*Notes. Tasks. Life.*" then a module ribbon marquee whose speed follows scroll velocity.
- **Modules shown:** Notes, Tasks, Planner, Habits, Focus Dial, Expenses, Wardrobe, Travel, Journal, Moodboard, Shopping, Vault, Widgets, Nodo.
- **Lite:** a CSS stagger deal. **Reduced:** a static grid.

### IV. Capture
- **Beat:** one typed line ("Dinner with Asha Friday 8pm ₹1,200") splits into tokens that fly along hand-drawn ink paths to their tiles: an event, an expense. Around it are the real entry points, drawn as hairline line art: the Capture chip, the app-icon long-press shortcuts (Quick Capture, Voice Memo, Focus Timer), the Quick Settings tiles, and the Android share sheet.
- **Copy:** "*Say it once. It finds its place.*"
- **Truth:** `capture` guide section; manifest tiles and shortcuts; the NLP date parser. The parse shown is computed live by a small port of the same rules, or is a fixed, real example ⟂Q16.

### V. Curate
- **Beat:** the Notes graph (*Map of notes*) assembles as a 3D constellation in oxblood thread. "Ask your notes" types a question, and the answer comes back with citation chips that light the source nodes.
- **Copy:** "*Your thoughts, connected.*"
- **Truth:** `notes_graph_view.dart`, `notes_rag_modal.dart` (on-device retrieval with citations).

### VI. Plan
- **Beat:** three real tasks. Each one is struck with the exact `ink_strike` stroke as the reader scrolls. The planner morphs Day → Week → Month as stacked paper sheets. Real Editorial screenshots stack like cards.
- **Copy:** "*Time, well kept.*" is reserved for VIII; here it's "*Cross it off. Feel it.*"
- **Truth:** tasks completion with ink strike; planner views.

### VII. Rhythm: the seal
- **Beat:** the hero object of the film. A stick of oxblood wax softens, a pool spreads on cotton paper, and the seal presses down as the reader scrolls (pressure follows scroll). It lifts to reveal the **N** in relief. The streak calendar fills day by day. A milestone ceremony plays once.
- **Copy:** "*A small ritual, every day.*"
- **Truth:** the Home Check-in really is "Press and hold the seal" with `WaxMeltCompressionRitual(monogramLetter: 'N')`; the streak calendar; badges and levels.

### VIII. The movement → Focus Dial
- **Beat:** the camera dives through the phone glass into a watch movement: gear train, escapement, balance wheel, and a tourbillon cage turning at a speed set by scroll velocity. The parts slide outward and then back together. The movement flattens into a Breguet-hand dial, which becomes the real `07_focus_dial` screenshot.
- **Copy:** "*Time, well kept.*"
- **Truth:** Focus Dial durations 15–90 min plus custom; Breguet hands on Home and the dial; the Focus Sanctuary tile. (The tourbillon is the site's decoration, not a feature claim.)

### IX. Money
- **Beat:** the budget figure counts up (`count_up`, ₹ grouping kept). Ledger lines are set as letterpress type: lead sorts slide into a composing stick and print. A single shared element (a shopping item) becomes an expense and then a wardrobe piece in one continuous move.
- **Copy:** "*Every rupee, accounted for.*" ⟂Q15 (currency on the site)
- **Truth:** budget, per-day allowance, category limits, splitting, CSV. (The shopping → expense → wardrobe path must exist in the app ⟂Q17.)

### X. Wardrobe and travel
- **Beat:** an outfit assembles piece by piece on a linen board with fabric and weather tags. Then a passport page, where a stamp bites in antique bronze ink.
- **Copy:** "*Dressed for the day. Packed for the trip.*"
- **Truth:** wardrobe outfits (fabric, weather); travel trips and packing; the bronze travel accent.

### XI. Remember
- **Beat:** journal pages turn in 3D with a deckled edge. A voice memo waveform is drawn in ink as it plays (a silent visual only). A horizontal moodboard strip runs inside the vertical scroll with an image trail. Then *Your week*, the weekly recap card. Finally a **Zen moment**: a button collapses the page to essentials for a breath, then restores it.
- **Copy:** "*Keep what mattered.*"
- **Truth:** journal plus voice memos, moodboard, weekly recap. **Zen mode ⟂Q18**: not found in the code under that name, so this beat is held until it's confirmed.

### XII. Nodo
- **Beat:** the editorial AI glyph opens like an aperture. Beside it is the real `08_bento_nodo_ai` screenshot. Below it is a live box: "Ask Nodo about NOTtEodo". It answers *entirely in the browser* from `app_guide.json` (the same scoring as the app's on-device guide), with no network.
- **Copy:** "*A companion that knows your day, and forgets on request.*"
- **Explainer (three columns):** *On the device*: search over your own items, no network, no model. *In the cloud, if you sign in*: your question and the matching items go to our server and an AI provider; this is on by default and you can turn it off in Settings → Nodo assistant. *Memory you can see*: review and delete each memory, or all of them.
- **Truth:** APP_AUDIT §8. The default-on cloud setting is stated plainly.

### XIII. Home-screen widgets
- **Beat:** a phone home screen rotates slowly. Widget styles snap onto the grid one by one: sticky memo, daily checklist, Polaroid pin, outfit of the day, budget meter, voice memo, boarding pass, focus clock.
- **Copy:** "*Your day, before you open the app.*"
- **Truth:** the `widgets` guide section. These are recreated illustrations, labelled as such, until real captures exist ⟂Q3.

### XIV. Privacy by design
- **Beat:** the camera enters a vault door. A data cube is wrapped in a shower of oxblood glyphs (ciphertext), sealed with wax and set into the phone. Three giant promises follow.
- **Promises:** "*Encrypted on your phone.*" · "*Yours to delete, everywhere.*" · "*No ads. No trackers. Ever.*"
- **Fine print (on the page, not hidden):** synced data is readable by our database only if you haven't set an encryption passphrase. Set one and we can't read it.
- **Links:** `/privacy`, `/security`.
- **Truth:** `LocalStore`, `user_keys`/E2EE trigger, `delete-account`, no SDKs.

### XV. Free, forever
- **Beat:** "Subscriptions. Ads. Trackers. Paywalls." in huge Bodoni, struck through one by one by `ink_strike` as the reader scrolls. Then, after a held beat, "*None. Ever.*"
- **Truth:** no billing or ad SDKs ⟂Q2 (whether you commit to it).

### XVI. Try it
- **Beat:** the phone tilts toward the reader and the simulator wakes inside it. "*Don't take our word for it. Touch it.*" Three tappable demos: Capture, strike a task, set the Focus Dial. "Open the full simulator" goes to `/try`.

### XVII. Finale
- **Beat:** the phone spins once and lands face-up on ivory paper (black velvet in OLED). Around it: the Play badge, Download APK, a QR code to `/open/release/latest`, and the live version number.
- **Copy:** "*Your life, curated.*" then **Download NOTtEodo.**

### Persistent elements
- **Download pill:** Play on Android, a QR popover on desktop, APK as secondary. It hides during pinned spectacle and returns at chapter ends.
- **"Why people switch":** an honest objection handler before the finale covering privacy, free, offline, battery, export and deletion. Each answer links to the code-backed page.
- **"Start where you are":** Student · Creative · Professional · Traveller. It re-orders chapters III–XI and the posters. It's stored in `localStorage` and never sent anywhere.
- **Chapter rail:** Bodoni numerals I–XVII in the margin, plus a crown-dial scroll indicator.

---

## 6. Poster Studio direction (summary; full spec in `docs/POSTER_STUDIO.md`, Phase 7)

- **Masthead covers:** "NOT*t**e*odo" masthead; cover lines such as "*The Planner Issue*: Time, well kept". An "issue number" is the module index and is labelled as a poster series, not a magazine.
- **Typographic posters:** Capture. Curate. Plan. Live. Remember. with the screenshot clipped into the letterforms.
- **Diptychs:** Ivory | OLED split by an ink line; Cards | Editorial.
- **Rules:** the UI inside a screenshot is never altered. Empty-state screenshots are only used where the empty state *is* the message ("A clear day."). Test-data names are cropped or the screenshots retaken ⟂Q4.

---

## 7. Copy voice: sample lines

- Short, declarative, Bodoni italic for the line, DM Sans for one supporting sentence. No exclamation marks, no "revolutionary", no superlatives we can't prove.
- Chapter lines (drafts): *Curate your everyday.* · *Two ways to see the same day.* · *Say it once. It finds its place.* · *Your thoughts, connected.* · *Cross it off. Feel it.* · *A small ritual, every day.* · *Time, well kept.* · *Every rupee, accounted for.* · *Dressed for the day. Packed for the trip.* · *Keep what mattered.* · *A companion that knows your day, and forgets on request.* · *Your day, before you open the app.* · *Nothing leaves without your word.* (used only if cloud AI defaults to off ⟂Q6; otherwise the line is *Encrypted on your phone.*) · *None. Ever.* · *Your life, curated.*

---

## 8. What I'm deliberately not doing
- No testimonials, ratings, download counts or press until real ones exist (the table stays empty and the section stays hidden).
- No claim that the luxury-lab widgets, the "Sovereign" systems or an on-device LLM exist for users.
- No gold, blue, green or teal anywhere, including shader noise and postprocessing.
- No DOM tilt, no scroll-jacking in reduced motion, no autoplay sound.
