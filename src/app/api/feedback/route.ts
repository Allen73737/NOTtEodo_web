import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";

const schema = z.object({
  path: z
    .string()
    .max(200)
    .regex(/^\/(help|guides|faq)(\/[a-z0-9_-]+)*$/),
  helpful: z.boolean(),
  note: z.string().trim().max(1000).optional(),
  // Honeypot (must stay empty) and time on page (bots answer instantly).
  website: z.string().max(0).optional().default(""),
  t: z.number().int().optional(),
});

/**
 * POST /api/feedback: one anonymous "Was this helpful?" answer from a help, guide or FAQ page.
 * Stores the page, the answer and an optional note; no account, IP address or cookie.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "That answer could not be read." }, { status: 400 });
  const { path, helpful, note, website, t } = parsed.data;
  if (website || (t && Date.now() - t < 1500)) return NextResponse.json({ ok: true }); // quietly drop bots

  const sb = supabaseService();
  if (!sb) return NextResponse.json({ ok: true }); // not configured (local/preview): thank and drop
  const { error } = await sb.from("page_feedback").insert({ path, helpful, note: note || null });
  if (error) return NextResponse.json({ error: "Could not save that. Please try again later." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
