import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Where the Flutter app lives. Sync scripts only ever read from it. */
export const APP_DIR = resolve(process.env.NOTTEODO_APP_DIR ?? "C:/My_Project/Notteodo");
export const ROOT = resolve(import.meta.dirname, "..", "..");
export const BACKEND_DIR = resolve(ROOT, "..", "backend");
export const CHECK = process.argv.includes("--check");

export function appFile(rel: string): string | null {
  const p = resolve(APP_DIR, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

/**
 * Writes a generated file, or in --check mode reports drift instead.
 * Returns false when the committed file differs from what the app would generate.
 */
export function emit(rel: string, raw: string): boolean {
  // Line endings are normalised so Windows checkouts and CI compare equal.
  const content = raw.replaceAll("\r\n", "\n");
  const target = rel.startsWith("supabase/") ? resolve(BACKEND_DIR, rel) : resolve(ROOT, rel);
  const current = existsSync(target) ? readFileSync(target, "utf8") : null;
  if (CHECK) {
    if (current !== content) {
      console.error(`✗ drift: ${rel} is out of date with the app. Run the sync script and commit.`);
      return false;
    }
    console.log(`✓ ${rel}`);
    return true;
  }
  mkdirSync(dirname(target), { recursive: true });
  if (current !== content) writeFileSync(target, content);
  console.log(`${current === content ? "=" : "↻"} ${rel}`);
  return true;
}

/** When the app repo is not on this machine (CI), the committed output is the source of truth. */
export function requireApp(name: string): boolean {
  if (existsSync(APP_DIR)) return true;
  console.warn(`! ${name}: app repo not found at ${APP_DIR}; keeping committed output.`);
  return false;
}

export const GENERATED_HEADER = "Generated from the NOTtEodo app. Do not edit by hand.";
