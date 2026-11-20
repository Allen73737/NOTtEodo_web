# Final report (21 Nov 2026)

## What was built
All 16 phases, committed one by one (`git log`): audit and creative direction, scaffold and sync scripts, design system, motion library, Supabase platform migration with RLS tests, the Play compliance pack, Poster Studio, the download and release pipeline, auth/account/support, the Admin Portal (13 tabs), the homepage film with WebGL and 3D, the App Simulator, every content page, tests and docs, and the app hand-off. 93 statically generated pages plus the dynamic routes.

## Placeholders to fill
| Placeholder | Where |
|---|---|
| `[DEVELOPER NAME]`, `[SUPPORT EMAIL]`, `[POSTAL ADDRESS]`, `[GRIEVANCE OFFICER NAME/EMAIL]`, `[DOMAIN]` | `src/content/identity.ts`, `src/app/layout.tsx` (author), `.env.example`, migration seed `urls` |
| `[CITY]` | Terms → "Law and disputes" |
| `ANDROID_CERT_SHA256_APP_SIGNING` / `_UPLOAD` | Vercel env (assetlinks.json; production build refuses to serve without it) |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `DOWNLOAD_HASH_SALT`, `REVALIDATE_SECRET` | Vercel env |
| Play URL | `NEXT_PUBLIC_PLAY_STORE_URL` (default is the expected listing URL) |

## Migrations to apply (in order)
1. The app's existing migrations (already applied in production).
2. `supabase/migrations/20261121000000_website_platform.sql`: staging first, then production. It's idempotent and tested against the real app chain (19 RLS tests).

Supabase dashboard settings are in `docs/RUNBOOKS.md` → "Before launch".

## Your to-dos
- Groq console: turn on Zero Data Retention, then set `groq_zdr = true` in Admin → Platform Config.
- Signing: check whether the current release APK's certificate (`7F:32:98:6B:…:96:E2`) is your release key or the debug key (APP_HANDOFF §1).
- Recapture screenshots with the demo dataset: `scripts/demo-data/CAPTURE_CHECKLIST.md`.
- Run the app-side hand-off: paste `app-handoff/PROMPT.md` into a Claude Code session in the app repo. §1, §2, §3 and §5 are Play launch blockers.
- Make yourself the first admin (SQL in RUNBOOKS → "Add an admin").

## Open compliance risks
- Until the app ships the cloud-Nodo opt-in, the privacy policy (correctly) says cloud Nodo is on by default when signed in. Indian law (DPDP) expects consent.
- `USE_EXACT_ALARM` and `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` are still in the app manifest.
- Google Fonts runtime fetching is still on in the app (disclosed).
- Children: accounts need 18+ or guardian consent; the app has no age gate yet (website sign-up has it).

## Measurements (local machine, production build; indicative only)
| Page | Initial JS (gzip est.) | After 4 s |
|---|---|---|
| `/` reduced | 203 KB | 300 KB |
| `/` lite | 203 KB | 319 KB |
| `/` full (3D) | 203 KB | 578 KB |
| `/try` | 193 KB | 319 KB |

- **Not measured:** Lighthouse scores and 60 fps on a mid-range Android. The machine was under heavy load, and headless Chromium uses software WebGL (SwiftShader), which can't represent a phone GPU. `lighthouserc.json` and the CI job are set up to measure on every PR.
- **Tests:** 19 RLS tests, 19 unit tests (APK parser against the real 100 MB release APK, password policy and breach check, capture parser, guide search, assetlinks, poster determinism) and 22 Playwright scenarios per device. The functional ones pass. The axe checks pass on desktop when run serially; mobile axe timed out once under parallel load, so re-run it on CI.

## Deviations from the brief (honest list)
- Scroll choreography uses CSS sticky plus one progress loop, not GSAP ScrollTrigger pinning. The 3D world uses drei Views on one persistent canvas, not a Theatre.js camera spline. There's no postprocessing (bloom/DOF) and no Rapier physics.
- Lite mode uses posters and real screenshots, not pre-rendered video sequences. Posters use HTML/CSS compositions, not R3F offscreen renders.
- Legal pages and guides are authored in TSX, not MDX. No i18n library yet (all copy is English and RTL-safe CSS isn't audited). No size-limit, knip, Husky or Renovate configs.
- A strict nonce CSP covers the signed-in areas only. Static pages use a CSP without inline-script nonces, because nonces force every page dynamic.
- Space Grotesk is used where the brief asked, but the app's own label style is DM Sans; the site follows the app for body labels.
- Screenshots in the site still show test data until recaptured (the owner allowed this).
