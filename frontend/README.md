# NOTtEodo Frontend

Next.js 16 (App Router) web application and interactive platform for **NOTtEodo**.

## Quick Start

```bash
# From repository root or frontend directory:
pnpm install
cp .env.example .env.local
pnpm dev
```

Runs on [http://localhost:3000](http://localhost:3000).

## Key Directories

- `src/app/(site)/`: Public marketing site, interactive film chapter, guides, and download center.
- `src/app/admin/`: 13-tab administrative portal protected by Supabase SSR auth and `is_app_admin()` RLS check.
- `src/app/api/`: Telemetry, health check, feedback collection, and on-demand ISR revalidation endpoints.
- `src/simulator/`: Full in-browser Android app simulator.
- `src/three/`: Three.js / React Three Fiber interactive scene, WebGL2 ink shader, and camera choreography.
- `src/motion/`: Ports of the Android app's spring motion tokens.
- `poster-studio/`: Programmatic poster generation pipeline.
- `scripts/`: Asset sync engine (tokens, typography, content, screenshots).
- `tests/`: Vitest unit tests, PGlite in-memory database tests, and Playwright E2E suites.

See the root [README.md](../README.md) for full monorepo architecture and scripts.
