/** Fails the build if the service-role key name appears in any client bundle. */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "..", ".next", "static");
if (!existsSync(dir)) {
  console.error("Run `pnpm build` first.");
  process.exit(1);
}
const needles = ["SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "DOWNLOAD_HASH_SALT", "REVALIDATE_SECRET"];
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
let hits = 0;
function walk(d: string) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith(".js")) {
      const s = readFileSync(p, "utf8");
      for (const k of needles) if (s.includes(k)) (hits++, console.error(`✗ ${k} referenced in ${p}`));
      if (secret && s.includes(secret)) (hits++, console.error(`✗ service-role key value found in ${p}`));
    }
  }
}
walk(dir);
if (hits) process.exit(1);
console.log("✓ no server secrets in client bundles");
