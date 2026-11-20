import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { uuid_ossp } from "@electric-sql/pglite/contrib/uuid_ossp";

const ROOT = join(import.meta.dirname, "..", "..");

/**
 * PGlite does not ship pgvector. The RAG embedding column and its index are irrelevant to the
 * website's RLS, so in tests only: vector(n) becomes real[], and the ivfflat index, the
 * similarity operator and the extension line are neutralised. Production runs the files untouched.
 */
function withoutPgvector(sql: string) {
  return sql
    .replace(/CREATE EXTENSION IF NOT EXISTS "vector";/g, "")
    .replace(/\bvector\(\d+\)/gi, "real[]")
    .replace(/CREATE INDEX[^;]*USING ivfflat[^;]*;/gi, "")
    .replace(/(\w+\.)?(embedding|query_embedding)\s*<=>\s*(\w+(\.\w+)?)/g, "0::float8");
}

/**
 * A fresh Postgres (PGlite, in-process) with: the Supabase stub, the app's real migrations
 * (vendored by sync-content) and then this repo's migrations, in order.
 */
export async function freshDb() {
  const db = await PGlite.create({ extensions: { citext, pgcrypto, uuid_ossp } });
  await db.exec(readFileSync(join(ROOT, "supabase/tests/supabase-stub.sql"), "utf8"));
  // Supabase installs extensions into the "extensions" schema and keeps it on the search path.
  await db.exec(`CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
                 CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;
                 CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
                 SET search_path = public, extensions;`);
  for (const dir of ["supabase/tests/app-migrations", "supabase/migrations"]) {
    for (const f of readdirSync(join(ROOT, dir)).filter((x) => x.endsWith(".sql")).sort()) {
      try {
        await db.exec(withoutPgvector(readFileSync(join(ROOT, dir, f), "utf8")));
      } catch (e) {
        throw new Error(`${dir}/${f}: ${(e as Error).message}`);
      }
    }
  }
  return db;
}

export type Db = Awaited<ReturnType<typeof freshDb>>;

/** Runs `fn` as a Supabase role/user inside a transaction that is always rolled back. */
export async function as<T>(
  db: Db,
  who: { role: "anon" | "authenticated" | "service_role"; sub?: string },
  fn: (q: Db) => Promise<T>,
): Promise<T> {
  await db.exec("BEGIN");
  try {
    await db.exec(`SET LOCAL ROLE ${who.role}`);
    await db.query(
      `SELECT set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.role', $2, true),
              set_config('request.jwt.claims', $3, true)`,
      [who.sub ?? "", who.role, JSON.stringify({ sub: who.sub, role: who.role, aal: "aal1" })],
    );
    return await fn(db);
  } finally {
    await db.exec("ROLLBACK");
  }
}
