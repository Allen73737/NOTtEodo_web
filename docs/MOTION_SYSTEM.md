# Motion system

All durations and curves come from `src/content/generated/tokens.ts` / `src/styles/tokens.css`, generated from the app's `core/motion` by `scripts/sync-tokens.ts`. Live demos: `/design` and `/craft`.

| App primitive (Flutter) | Web port | Where |
|---|---|---|
| `reveal` | `<Reveal>`: staggered rise on `silk`, 55 ms steps capped at 520 ms | `src/motion/primitives.tsx` |
| `kinetic_text` | `<KineticText>`: words on a perspective hinge, clearing from blur | headings everywhere |
| `ink_strike` | `<InkStrike struck | progress>`: clip-path reveal of a hand-drawn stroke | tasks, film VI/XV, simulator |
| `count_up` / `rolling_text` | `<CountUp>`, `<RollingText>`, keeping ₹ and Indian grouping | film IX, demos |
| `touch_sheen` + `edge_light` | `<Sheen>` + `.sheen` CSS (bloom under the pointer, hairline rim) | cards |
| `card_peek` | `useHoldToPeek()` + edge-light charge animation | demos |
| `pressable` | `.pressable` / `.btn:active` | buttons, cards |
| `theme_wash` | `washTo()`: View Transitions disc from the click point | theme toggle |
| `touch_aura` | ink rings at touch points | `Ambient.tsx` |
| `scroll_depth` / `scroll_fade` | CSS scroll-driven animations (`.scroll-depth`, `.scroll-fade`) | supported browsers |
| `offscreen_pause` | IntersectionObserver pauses (ink field, marquee) | `InkField`, `Marquee` |
| `transitions` | page entrances, drawer/palette descend and rise | `chrome.css` |

**Paths:** `full` (WebGL + smooth scroll), `lite` (posters and CSS motion), `reduced` (no pinning, scroll-jacking or parallax; gentle fades only). Chosen in `FilmProvider` from the OS setting, Save-Data, device memory, battery and self-hosted GPU benchmark data; forced with `?film=`.

**Deviations from the brief (honest list):**
- Scroll choreography uses CSS sticky + a single rAF progress loop instead of GSAP ScrollTrigger pinning (more robust with React and with reduced motion); GSAP is installed but not required.
- The homepage is one fixed 3D stage (`src/three/journey/`) behind pinned acts. Each act is `--len` screens tall; its copy and back layers are sticky. The scroll loop (`FilmProvider`) writes `--a`, `--lp` and `--x` per act, so all copy motion is a pure CSS function of scroll. The 3D timeline (`timeline.ts`) gives each act a `from` and a `to` pose and a list of `screens`. The phone travels between the poses while the act is pinned, and its screen steps through the list with an ink-bleed shader. The tour captions use the same index formula as the phone, so they change together.
- The opening title (`Intro.tsx`) plays on every page load, in the visitor's theme (with its own day/night switch). Its first part is pure CSS from first paint. It exits by diving through the ribbon N, using an SVG mask. It can be skipped with a button, Esc or Enter, and reduced motion gets a short still version.
- The logo is traced from the app's PNGs by `scripts/trace-logo.ts` and is always one colour (`currentColor`).
- No `@react-three/postprocessing` (bloom/DOF) and no Rapier physics: the card deal is CSS-driven by scroll progress.
- Shaders live as strings in TS modules (no raw-file loader).
- Lite mode uses posters and real screenshots as fallbacks, not pre-rendered video sequences.
