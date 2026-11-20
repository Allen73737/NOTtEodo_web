import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { emailHtml, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { randomToken, sha256Hex } from "@/lib/hash";
import { getConfig } from "@/lib/platform";
import { supabaseService } from "@/lib/supabase/server";

const CONSENT_VERSION = "2026-11-21";
const schema = z.object({
  email: z.email().max(320),
  topic: z.enum(["play_launch", "releases"]),
  // Honeypot (must stay empty) and time-on-form (bots submit instantly).
  website: z.string().max(0).optional().default(""),
  t: z.number().int().optional(),
});

/**
 * POST /api/subscribe: double opt-in. Stores the address as "pending" with hashed tokens and
 * sends a confirmation link. Nothing else is ever sent until it is confirmed.
 */
export async function POST(req: NextRequest) {
  const cfg = await getConfig();
  if (!cfg.flags.release_emails) return NextResponse.json({ error: "Email updates are switched off." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const { email, topic, website, t } = parsed.data;
  if (website || (t && Date.now() - t < 1500)) return NextResponse.json({ ok: true }); // quietly drop bots

  const sb = supabaseService();
  if (!sb) return NextResponse.json({ error: "Email updates are not available yet." }, { status: 503 });

  const confirm = randomToken();
  const unsub = randomToken();
  const { error } = await sb.from("release_subscribers").upsert(
    {
      email: email.toLowerCase(),
      topic,
      status: "pending",
      confirm_token_hash: await sha256Hex(confirm),
      unsubscribe_token_hash: await sha256Hex(unsub),
      consent_text_version: CONSENT_VERSION,
    },
    { onConflict: "email,topic" },
  );
  if (error) return NextResponse.json({ error: "Could not save that. Please try again later." }, { status: 500 });

  const url = `${siteUrl}/api/subscribe/confirm?token=${confirm}`;
  const what = topic === "play_launch" ? "when NOTtEodo arrives on Google Play" : "when a new version of NOTtEodo is released";
  await sendEmail({
    to: email,
    subject: "Confirm: NOTtEodo updates",
    text: `Confirm that you would like an email ${what}: ${url}\n\nIf you did not ask for this, ignore this email and nothing more will be sent.`,
    html: emailHtml(
      "One click to confirm.",
      `<p>You asked to hear ${what}. Confirm and we will write only then.</p><p>If you did not ask for this, ignore this email. Nothing more will be sent, and the address is deleted after 7 days.</p>`,
      { label: "Confirm", url },
      `Sent by NOTtEodo because this address was entered on ${siteUrl}.`,
    ),
  });
  return NextResponse.json({ ok: true });
}
