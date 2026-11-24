# NOTtEodo: Web Platform & Backend

The official website, interactive 3D product showcase, in-browser simulator, admin portal, and backend service infrastructure for **NOTtEodo**, the mindful Android productivity & reflection app (`com.notteodo.notteodo`).

Built with **Next.js 16 (App Router & Turbopack)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Three.js / React Three Fiber**, and **Supabase (PostgreSQL with RLS)** in a structured **pnpm monorepo**.

> **Single Source of Truth**: The mobile app (`com.notteodo.notteodo`) dictates the design language, motion physics, brand color tokens, typography, screenshots, and help content. Automated sync engines pull and verify these assets from the app repository to ensure zero drift.

---

## Architecture Overview

The repository is organized as a pnpm workspace split cleanly into frontend application logic and backend database assets:

```
NOTtEodo_Web/
├── frontend/                        # Next.js 16 App Router web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (site)/              # Public experience: interactive film (/), features,
│   │   │   │                        # simulator (try), legal, guides, help, download, brand...
│   │   │   ├── admin/               # 13-tab gated Admin Portal (is_app_admin() RLS enforced)
│   │   │   ├── api/                 # Endpoints: download telemetry, feedback, health, revalidation
│   │   │   └── .well-known/         # AssetLinks and Android app verification
│   │   ├── components/              # Editorial layouts, site chrome, film chapters, UI primitives
│   │   ├── motion/                  # Motion tokens ported from the mobile app's spring physics
│   │   ├── three/                   # 3D canvas: interactive journey, ink field (WebGL2), shaders
│   │   ├── simulator/               # Complete in-browser interactive Android app simulator
│   │   ├── lib/                     # Supabase SSR clients, cached platform data, search indexer
│   │   └── styles/                  # Tailwind CSS v4 & custom editorial typography stylesheets
│   ├── poster-studio/               # Headless poster renderer generating SVG & high-res posters
│   ├── scripts/                     # Drift verification, token syncer, screenshot optimizer, font builder
│   └── tests/                       # Unit tests, Playwright E2E suites, and PGlite RLS database tests
├── backend/                         # Database platform & Supabase migrations
│   ├── supabase/
│   │   ├── migrations/              # Production PostgreSQL migration scripts
│   │   └── tests/                   # In-memory PGlite test fixtures & mobile app schema parity
│   └── README.md                    # Backend & database documentation
├── docs/                            # Deep architecture, creative direction, audit, and runbook docs
├── app-handoff/                     # Dart / Kotlin / manifest integration patches for the mobile app
└── package.json                     # Root workspace orchestration scripts
```

---

## Core Features & Subsystems

### 1. Interactive 3D Journey & WebGL2 Ink Field
- **Procedural Canvas**: Persistent WebGL2 Three.js canvas featuring custom GLSL ink shaders, particle fields, and procedural lighting.
- **Timeline-Synchronized Storyboard**: Camera choreography and 3D asset states orchestrated in tandem with viewport scroll position using Lenis smooth scrolling.
- **Adaptive Performance**: Automatic GPU tier detection (`detect-gpu`) with graceful degradation for low-powered or battery-saving devices.

### 2. In-Browser App Simulator (`/try`)
- Interactive, zero-install preview of the mobile app experience right within the desktop or mobile browser.
- High-fidelity recreation of the app's touch gestures, reflection loops, typography, and card transitions.

### 3. Gated Admin Portal (`/admin`)
- Comprehensive administrative cockpit containing 13 operational modules:
  - **Releases**: Manage APK artifacts, checksum verification (SHA-256), rollout staging, and changelogs.
  - **Feedback**: Moderation and analysis of in-app and website "Was this helpful?" reader feedback.
  - **CMS & Legal**: Live management of platform announcements, guides, FAQs, and privacy policies.
  - **Database & Cloud**: Supabase telemetry, edge functions status, storage bucket metrics, and active alerts.
  - **Users & AI**: Role management, audit logs, and AI moderation configurations.
- **Security**: Strictly gated on every server request via Supabase SSR authentication and the PostgreSQL `public.is_app_admin()` database security function.

### 4. Continuous Asset Synchronization & Drift Prevention
- Scripts in `frontend/scripts/` extract color tokens, typography, markdown help docs, and screenshots directly from the local Android app repository.
- `pnpm check:drift` runs in continuous integration to prevent visual or schema regressions between the mobile app and website.
- `pnpm lint:colors` guarantees no hardcoded hex/RGB values violate the brand's validated color tokens.

### 5. Resilient Offline-First Architecture
- Full **Offline Mode**: If Supabase credentials are not provided in the environment, the website automatically falls back to build-time mock data, cached fallbacks, and descriptive offline states without throwing uncaught exceptions.

---

## Quick Start

### Prerequisites
- **Node.js**: `>= 22.0.0`
- **pnpm**: `>= 10.0.0`
- **Python 3** *(optional, for rebuilding font subsets)*: `fonttools` + `brotli`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Allen73737/NOTtEodo_web.git
cd NOTtEodo_web
pnpm install
```

### 2. Configure Environment Variables
Copy the sample environment file into `frontend/.env.local`:
```bash
cp frontend/.env.example frontend/.env.local
```

Fill in your configuration as needed. For local previewing without a live Supabase backend, you can leave variables empty — the site will gracefully run in **Offline Preview Mode**.

### 3. Start Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables Reference

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical URL of the website (e.g. `https://notteodo.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project API gateway endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous public client key |
| `NEXT_PUBLIC_PLAY_STORE_URL` | Public | Google Play Store listing URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase elevated admin key (used for server-side operations) |
| `SUPPORT_EMAIL` | Server | Inbound support email routing address |
| `REVALIDATE_SECRET` | Server | Secret bearer token for on-demand ISR cache revalidation |
| `DOWNLOAD_HASH_SALT` | Server | Cryptographic salt used for secure APK download telemetry links |
| `RESEND_API_KEY` | Server | Resend email API key for transactional newsletters & verification |
| `RESEND_FROM` | Server | Verified sender address for outbound emails |
| `ANDROID_CERT_SHA256_APP_SIGNING` | Server | App signing certificate SHA-256 for Android AssetLinks |
| `ANDROID_CERT_SHA256_UPLOAD` | Server | Upload key certificate SHA-256 for Android AssetLinks |

---

## Workspace Scripts

All workspace scripts can be run from the root directory or inside `frontend/`:

| Script | Command | Purpose |
|---|---|---|
| `pnpm dev` | `next dev` | Start development server with Turbopack |
| `pnpm build` | `next build` | Compile optimized production build (runs `pnpm sync:all` first) |
| `pnpm start` | `next start` | Start production HTTP server |
| `pnpm typecheck` | `tsc --noEmit` | Strict TypeScript typecheck across all modules |
| `pnpm lint` | `eslint . && lint:colors` | Run ESLint and check for non-token brand colors |
| `pnpm test` | `vitest run` | Run unit tests and in-memory PGlite RLS database tests |
| `pnpm test:e2e` | `playwright test` | Run Playwright end-to-end accessibility, admin, and browser suites |
| `pnpm sync:all` | `tsx scripts/...` | Synchronize tokens, content, screenshots, and theme CSP hashes |
| `pnpm check:drift` | `tsx scripts/... --check` | Verify that committed generated assets match the mobile app |
| `pnpm posters` | `tsx poster-studio/...` | Generate SVG and raster marketing poster templates |
| `pnpm check:server-only` | `tsx scripts/...` | Ensure server-only secrets are never imported into client components |

---

## Database & Supabase Platform

The backend database lives in `backend/supabase/`:

- **`migrations/20261121000000_website_platform.sql`**:
  - `platform_config`: Dynamic key-value site flags, maintenance modes, and minimum client versions.
  - `releases`: Binary APK releases, release notes, architecture tags, and download statistics.
  - `announcements`: Broadcast notifications and dismissible banner alerts.
  - `admin_users` & `public.is_app_admin()`: Role-based access control and RLS policy verification.
- **`migrations/20261122000000_page_feedback.sql`**:
  - `page_feedback`: Feedback telemetry ("Was this helpful?", ratings, comments, metadata).
  - Automated pruning routines with scheduled cleanup jobs.
- **In-Memory Testing Harness (`frontend/tests/db/`)**:
  - Leverages `@electric-sql/pglite` to execute true PostgreSQL migrations and RLS assertions directly inside Vitest without needing a live network connection or local Docker daemon.

To apply migrations to your live Supabase project:
```bash
# Using Supabase CLI:
supabase db push
# Or apply directly via Supabase SQL Editor / Migration pipeline
```

---

## Testing & Quality Assurance

1. **Type Checking & Linting**:
   ```bash
   pnpm typecheck
   pnpm lint
   ```
2. **Database & Unit Tests**:
   ```bash
   pnpm test
   ```
3. **End-to-End & Accessibility Tests**:
   ```bash
   pnpm test:e2e
   ```
   Validates no-JavaScript fallbacks, screen reader compatibility (`@axe-core/playwright`), keyboard navigation in the simulator, admin route gating, and theme persistence.

---

## Documentation Index

- [APP_AUDIT.md](file:///C:/My_Project/NOTtEodo_Web/docs/APP_AUDIT.md) — Comprehensive mobile app audit: design tokens, motion curves, data flows, and constraints.
- [CREATIVE_DIRECTION.md](file:///C:/My_Project/NOTtEodo_Web/docs/CREATIVE_DIRECTION.md) — Visual narrative, film chapter storyboard, and aesthetic pillars.
- [PLATFORM_CONTRACT.md](file:///C:/My_Project/NOTtEodo_Web/docs/PLATFORM_CONTRACT.md) — Shared API specifications, database schemas, and deep-link schemes.
- [MOTION_SYSTEM.md](file:///C:/My_Project/NOTtEodo_Web/docs/MOTION_SYSTEM.md) — Spring physics parameters, transition timing, and gesture mechanics.
- [POSTER_STUDIO.md](file:///C:/My_Project/NOTtEodo_Web/docs/POSTER_STUDIO.md) — Programmatic poster generation pipeline.
- [RUNBOOKS.md](file:///C:/My_Project/NOTtEodo_Web/docs/RUNBOOKS.md) — Production operations, incident response, release publishing, and database maintenance.

---

## License

All rights reserved. Proprietary software of NOTtEodo.
