"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getViewer } from "@/lib/supabase/server";

export type FeedbackState = { ok: boolean; error?: string };

const schema = z.object({
  type: z.enum(["feature_suggestion", "general_feedback", "bug_report", "ui_enhancement"]),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  impact: z.enum(["nice_to_have", "important", "critical"]),
  website: z.string().max(0),
  t: z.coerce.number(),
});

/** Writes the same user_feedback row the app writes (RLS: own rows, pending, no reply fields). */
export async function sendFeedback(_prev: FeedbackState, fd: FormData): Promise<FeedbackState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fill in a title and some details." };
  if (Date.now() - parsed.data.t < 2000) return { ok: true }; // bots submit instantly; drop quietly
  const { sb, user } = await getViewer();
  if (!sb || !user) return { ok: false, error: "Please sign in again." };
  const ua = (await headers()).get("user-agent")?.slice(0, 200) ?? "";
  const { error } = await sb.from("user_feedback").insert({
    user_id: user.id,
    user_identifier: (user.user_metadata?.display_name as string | undefined)?.slice(0, 120) ?? "Curator",
    user_email: user.email,
    type: parsed.data.type,
    title: parsed.data.title,
    description: parsed.data.description,
    impact: parsed.data.impact,
    category: "Web",
    device_info: `Web · ${ua}`,
    source: "web",
  });
  if (error) {
    return { ok: false, error: error.message.includes("Too much") ? "That's a lot of feedback for one day. Try again tomorrow." : "Could not send. Please try again." };
  }
  return { ok: true };
}
