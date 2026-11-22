/**
 * Copies the app's shared knowledge base (`app_guide.json`, the same file Nodo reads on
 * the device and on the server) and the app version into src/content/generated/.
 * Help, FAQ, feature copy and the in-browser "Ask Nodo" demo are built from it.
 */
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { APP_DIR, CHECK, GENERATED_HEADER, appFile, emit, requireApp } from "./lib/sync-util";

function main() {
  if (!requireApp("sync-content")) return;
  const guide = appFile("backend/supabase/functions/_shared/app_guide.json");
  const pubspec = appFile("frontend/pubspec.yaml");
  if (!guide || !pubspec) throw new Error("app_guide.json or pubspec.yaml not found");

  const parsed = JSON.parse(guide) as { version: number; sections: { id: string }[] };
  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) throw new Error("guide has no sections");

  const version = /^version:\s*([\d.]+)\+(\d+)/m.exec(pubspec);
  if (!version) throw new Error("version not found in pubspec.yaml");
  const app = {
    $comment: GENERATED_HEADER,
    packageName: "com.notteodo.notteodo",
    versionName: version[1],
    versionCode: Number(version[2]),
  };

  // The app's migrations, vendored so RLS tests run the real schema chain (supabase/tests).
  const migDir = "backend/supabase/migrations";
  const migrations = readdirSync(resolve(APP_DIR, migDir)).filter((f) => f.endsWith(".sql")).sort();
  const vendored = migrations.map((f) => emit(`supabase/tests/app-migrations/${f}`, appFile(`${migDir}/${f}`)!));

  const ok = [
    ...vendored,
    emit("src/content/generated/app_guide.json", JSON.stringify(parsed, null, 2) + "\n"),
    emit("src/content/generated/app.json", JSON.stringify(app, null, 2) + "\n"),
  ].every(Boolean);
  if (CHECK && !ok) process.exit(1);
}

main();
