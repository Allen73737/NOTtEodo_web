# NOTtEodo Backend

This package houses the database platform, schema definitions, PostgreSQL migrations, Row-Level Security (RLS) policies, and test fixtures for NOTtEodo.

## Structure

- `supabase/migrations/`: SQL migration scripts applied to the Supabase PostgreSQL database:
  - `20261121000000_website_platform.sql`: Platform configuration, binary APK releases, announcements, admin roles, and `public.is_app_admin()` RLS function.
  - `20261122000000_page_feedback.sql`: Page feedback collection table, rate limiting, and automated 90-day pruning routine.
- `supabase/tests/`:
  - `app-migrations/`: Vendored migrations from the mobile app repository to ensure cross-platform schema parity.
  - `supabase-stub.sql`: Mock PostgreSQL environment utilized for local in-memory PGlite tests.

## Running Database & RLS Tests

Database migrations and RLS policies are validated without requiring external Docker or network connections by running:

```bash
# Run from repository root or frontend/:
pnpm test
```

This boots an in-memory `@electric-sql/pglite` PostgreSQL instance, applies both the app's migrations and the web platform's migrations, and asserts all RLS access rules.

See the root [README.md](../README.md) for full monorepo architecture and scripts.
