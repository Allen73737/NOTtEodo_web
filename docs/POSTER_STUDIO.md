# Poster Studio

Code-generated editorial posters made from the app's real screenshots. Run `pnpm posters` (or `pnpm posters --only=og`).

- **How:** each poster is a self-contained HTML/CSS composition (`poster-studio/templates.ts`) using the app's own font files and the raw screenshots. Headless Chromium renders it at the exact pixel size, and sharp writes WebP (and PNG for Play/OG). Output: `public/posters/<series>/`. Manifest: `src/content/generated/posters.json`.
- **Deterministic:** no randomness (fixed noise seed, fixed bar widths). A poster re-renders only when its HTML hash changes (`poster-studio/.cache/*.sha`).
- **Rules:** the UI inside a screenshot is never altered. Duotone/halftone posters are labelled "Decorative treatment · not a UI view". Captions describe only what the screenshot shows. Screens that show test-data names (Home, Nodo, Journal, Quick add) are not used in posters until recaptured with demo data (OPEN_QUESTIONS D3/D4).

| Series | Sizes | Count |
|---|---|---|
| covers: magazine covers per module | 1080×1350 | 7 × 2 themes |
| typographic: Capture. Curate. Plan. Live. Remember. | 1080×1350 | 5 × 2 |
| swiss: Editorial view on a Swiss grid | 1080×1350 | 3 × 2 |
| duotone: oxblood × ivory duotone + halftone | 1080×1350 | 2 × 2 |
| diptych-themes: Ivory \| OLED | 1600×900 | 3 |
| diptych-views: Cards \| Editorial | 1600×900 | 1 × 2 |
| data-art: guilloché from real constants (guide sections × modules) | 1080×1350 | 1 × 2 |
| collage: deckled paper cut-outs | 1080×1350 | 1 × 2 |
| play: Play screenshots with honest captions + feature graphic | 1080×1920, 1024×500 | 8 + 2 |
| og: Open Graph per section | 1200×630 | 7 × 2 |
| social: story size | 1080×1920 | 1 × 2 |

**Not built:** R3F "device-in-scene" offscreen renders. The 3D phone lives in the homepage film; adding offscreen renders means a Playwright pass over a `/poster/3d/*` route (see RUNBOOKS → "Regenerate posters").
