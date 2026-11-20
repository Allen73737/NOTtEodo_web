import { NextResponse } from "next/server";
import { assetLinks } from "@/lib/assetlinks";
import { serverEnv } from "@/lib/env.server";

export const dynamic = "force-static";

/** Digital Asset Links for App Links (https://[DOMAIN]/open/* opens the app when installed). */
export function GET() {
  const fingerprints = [serverEnv.ANDROID_CERT_SHA256_APP_SIGNING, serverEnv.ANDROID_CERT_SHA256_UPLOAD]
    .filter((f): f is string => Boolean(f))
    .map((f) => f.trim().toUpperCase());
  if (fingerprints.length === 0 && process.env.VERCEL_ENV === "production") {
    throw new Error("assetlinks.json: set ANDROID_CERT_SHA256_APP_SIGNING before deploying to production");
  }
  return NextResponse.json(assetLinks(fingerprints), { headers: { "Cache-Control": "public, max-age=3600" } });
}
