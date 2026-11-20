# NOTtEodo: the website

The official website, admin portal and platform backend for **NOTtEodo**, the Android app (`com.notteodo.notteodo`). Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, three.js/R3F, Supabase.

> The app is the source of truth. Colours, motion, fonts, help content, screenshots and even the RLS tests come from `C:\My_Project\Notteodo` through the sync scripts, never by hand.

## Quick start

```bash
pnpm install
cp .env.example .env.local      # fill in what you have; everything is optional for a local preview
pnpm dev                        # http://localhost:3000
```

Without Supabase env vars the site runs in **offline mode**: every page renders from build-time defaults, and signed-in areas say they are not connected.

## Scripts

| Script | What it does |
|---|---|
| `pnpm sync:all` | Tokens, help content, screenshots and the theme-script CSP hash from the app (runs before every build) |
| `pnpm check:drift` | Fails if the committed generated files no longer match the app |
| `pnpm posters` | Re-renders the Poster Studio (`public/posters`, `src/content/generated/posters.json`) |
| `pnpm lint` | ESLint + the brand colour lint (no colour outside the app's tokens) |
| `pnpm test` | Unit tests + **RLS tests** (the app's real migrations + ours, in PGlite) |
| `pnpm test:e2e` | Playwright: no-JS legal pages, admin gate, headers, theme persistence, reduced/lite paths, simulator keyboard, axe |
| `pnpm build` / `pnpm start` | Production build / server |
| `python scripts/build-fonts.py` | Re-subsets the app's fonts to woff2 (needs fonttools + brotli) |

## Map

```
src/app/(site)/        the public site: film (/), features, try, legal, help, download, account, auth …
src/app/admin/         the Admin Portal (13 tabs), gated by public.is_app_admin() on every request
src/app/api/           download redirect + counter, subscribe/confirm/unsubscribe (Resend), health, revalidate
src/components/        brand, site chrome, film chapters, legal, admin, download, auth
src/motion/            ports of the app's core/motion primitives + theme wash
src/three/             ink field (WebGL2), persistent canvas, procedural scenes
src/simulator/         the in-browser app simulator
src/lib/               supabase clients, platform data (cached, with fallbacks), APK parser, password policy, search
supabase/migrations/   20261121000000_website_platform.sql (apply after the app's migrations)
supabase/tests/        Supabase stub + vendored app migrations for the RLS tests
poster-studio/         poster templates and renderer
scripts/               sync scripts, colour lint, icon/font builders, dev helpers
docs/                  APP_AUDIT, CREATIVE_DIRECTION, PLATFORM_CONTRACT, MOTION_SYSTEM, POSTER_STUDIO, RUNBOOKS
app-handoff/           Dart/Kotlin/manifest changes for the app + a ready-to-paste prompt
```

## Docs
- `docs/APP_AUDIT.md`: what the app really does (tokens, motion, data flows, permissions, conflicts)
- `docs/CREATIVE_DIRECTION.md`: concept, storyboard, motion language
- `docs/PLATFORM_CONTRACT.md`: shared backend, tables, realtime, deep links, flows
- `docs/MOTION_SYSTEM.md`, `docs/POSTER_STUDIO.md`, `docs/RUNBOOKS.md`
- `PLAY_CONSOLE_CHECKLIST.md`, `APP_HANDOFF.md`, `OPEN_QUESTIONS.md`, `CHANGELOG.md`
