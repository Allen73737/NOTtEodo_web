# NOTtEodo Backend

This directory contains the database platform, schema definitions, migrations, Row-Level Security (RLS) policies, and test fixtures for NOTtEodo.

## Structure
- `supabase/migrations/`: SQL migration scripts applied to the Supabase PostgreSQL cluster.
  - `20261121000000_website_platform.sql`: Initial web platform config, releases, and announcements schema.
  - `20261122000000_page_feedback.sql`: "Was this helpful?" page feedback collection and pruning job.
- `supabase/tests/`:
  - `app-migrations/`: Vendored migrations from the mobile app to verify schema parity.
  - `supabase-stub.sql`: Mock PostgreSQL environment for local in-memory PGlite tests.
