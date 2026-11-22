"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { AdminError, requireAdmin } from "@/lib/admin";
import { emailHtml, releaseEmail, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { randomToken, sha256Hex } from "@/lib/hash";
import { TAGS } from "@/lib/platform";
import { supabaseService } from "@/lib/supabase/server";

/**
 * Admin server actions. Each one: re-checks admin status (requireAdmin), validates input
 * with Zod, writes as the admin (RLS + audit trigger), and revalidates the affected cache tag.
 * Next.js server actions reject cross-origin posts (Origin must match Host), which covers CSRF.
 */
export type Result = { ok: boolean; message?: string; data?: unknown };

async function run(fn: () => Promise<Result | void>): Promise<Result> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (e) {
    if (e instanceof AdminError) return { ok: false, message: e.message };
    const msg = (e as { message?: string })?.message ?? "Something went wrong.";
    console.error(JSON.stringify({ level: "error", msg: "admin action failed", err: msg }));
    return { ok: false, message: msg };
  }
}
const fail = (message: string): Result => ({ ok: false, message });
const RECENT = 15;

/* ------------------------------------------------------------------ config */

const configSchemas: Record<string, z.ZodType> = {
  play_live: z.boolean(),
  nodo_cloud_opt_in: z.boolean(),
  groq_zdr: z.boolean(),
  min_supported_version_code: z.number().int().min(1),
  latest_version_code: z.number().int().min(1),
  maintenance: z.object({ on: z.boolean(), message: z.string().max(300) }),
  urls: z.record(z.enum(["privacy", "terms", "delete_account", "support", "help", "play", "website", "status"]), z.url()),
  flags: z.object({ release_emails: z.boolean(), testimonials: z.boolean(), roadmap: z.boolean() }),
  hero: z.object({ eyebrow: z.string().max(60), headline: z.string().min(2).max(80), sub: z.string().max(200) }),
  ai: z.object({ cloud_enabled: z.boolean(), note: z.string().max(300) }),
  posters: z.record(z.string(), z.string()),
  identity: z.object({
    developer: z.string().min(1).max(100),
    supportEmail: z.string().email(),
    privacyEmail: z.string().email(),
    grievanceOfficer: z.string().min(1).max(100),
    grievanceEmail: z.string().email(),
    address: z.string().min(1).max(250),
    country: z.string().min(1).max(100),
    domain: z.string().min(1).max(100),
    securityContact: z.string().email(),
  }),
};

export async function saveStoreAndPlaceholders(data: {
  playStoreUrl: string;
  playLive: boolean;
  minSupportedVersionCode: number;
  developer: string;
  supportEmail: string;
  privacyEmail: string;
  grievanceOfficer: string;
  grievanceEmail: string;
  address: string;
  country: string;
  domain: string;
  securityContact: string;
}): Promise<Result> {
  return run(async () => {
    const { sb } = await requireAdmin();

    const { data: curUrls } = await sb.from("platform_config").select("value").eq("key", "urls").maybeSingle();
    const urls = { ...((curUrls?.value as Record<string, string>) ?? {}) };
    if (data.playStoreUrl) urls.play = data.playStoreUrl;
    if (data.domain) {
      urls.website = data.domain.startsWith("http") ? data.domain : `https://${data.domain}`;
    }
    if (data.supportEmail) urls.support = `mailto:${data.supportEmail}`;

    await sb.from("platform_config").upsert({ key: "urls", value: urls });
    await sb.from("platform_config").upsert({ key: "play_live", value: data.playLive });
    await sb.from("platform_config").upsert({ key: "min_supported_version_code", value: data.minSupportedVersionCode });

    const identity = {
      developer: data.developer,
      supportEmail: data.supportEmail,
      privacyEmail: data.privacyEmail,
      grievanceOfficer: data.grievanceOfficer,
      grievanceEmail: data.grievanceEmail,
      address: data.address,
      country: data.country,
      domain: data.domain,
      securityContact: data.securityContact,
    };
    await sb.from("platform_config").upsert({ key: "identity", value: identity });

    revalidateTag(TAGS.config, "max");
    revalidatePath("/admin/config");
    revalidatePath("/download");
    revalidatePath("/privacy");
    revalidatePath("/terms");
    return { ok: true, message: "Store links, app version & legal placeholders updated successfully!" };
  });
}

export async function saveConfig(key: string, json: string): Promise<Result> {
  return run(async () => {
    const schema = configSchemas[key];
    if (!schema) return fail(`Unknown key ${key}.`);
    let value: unknown;
    try {
      value = JSON.parse(json);
    } catch {
      return fail("That isn't valid JSON.");
    }
    const parsed = schema.safeParse(value);
    if (!parsed.success) return fail(parsed.error.issues.map((i) => `${i.path.join(".") || key}: ${i.message}`).join("; "));
    const { sb } = await requireAdmin(key === "maintenance" || key === "urls" ? { recentAuthMinutes: RECENT } : {});
    const { error } = await sb.from("platform_config").upsert({ key, value: parsed.data });
    if (error) return fail(error.message);
    revalidateTag(TAGS.config, "max");
    revalidatePath("/admin/config");
  });
}

/* ------------------------------------------------------------- announcements */

const announcementSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1).max(120),
  body_md: z.string().max(2000).default(""),
  severity: z.enum(["info", "notice", "warning", "critical"]),
  target: z.enum(["web", "app", "both"]),
  audience: z.enum(["all", "signed_in"]),
  starts_at: z.string().optional().transform((v) => (v ? new Date(v).toISOString() : null)),
  ends_at: z.string().optional().transform((v) => (v ? new Date(v).toISOString() : null)),
  cta_label: z.string().max(40).optional().transform((v) => v || null),
  cta_url: z
    .string()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || /^(https:\/\/[A-Za-z0-9.-]+(\/\S*)?|\/(?!\/)\S*)$/.test(v), "Use an https:// link or a site path"),
  is_active: z.coerce.boolean().default(true),
});

export async function saveAnnouncement(fd: FormData): Promise<Result> {
  return run(async () => {
    const parsed = announcementSchema.safeParse({ ...Object.fromEntries(fd), is_active: fd.get("is_active") === "on" });
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
    const { sb } = await requireAdmin();
    const { id, ...row } = parsed.data;
    const { error } = id ? await sb.from("announcements").update(row).eq("id", id) : await sb.from("announcements").insert(row);
    if (error) return fail(error.message);
    revalidateTag(TAGS.announcements, "max");
    revalidatePath("/admin/alerts");
  });
}

export async function deleteAnnouncement(id: string): Promise<Result> {
  return run(async () => {
    const { sb } = await requireAdmin();
    const { error } = await sb.from("announcements").delete().eq("id", z.uuid().parse(id));
    if (error) return fail(error.message);
    revalidateTag(TAGS.announcements, "max");
    revalidatePath("/admin/alerts");
  });
}

/* ---------------------------------------------------------------- releases */

const releaseSchema = z.object({
  version_name: z.string().regex(/^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$/),
  version_code: z.number().int().positive(),
  channel: z.enum(["stable", "beta"]),
  file_path: z.string().regex(/^NOTtEodo-[0-9A-Za-z.+-]+\.apk$/),
  file_size_bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  signing_cert_sha256: z.string().regex(/^[0-9A-F:]{95}$/).nullable(),
  min_sdk: z.number().int().nullable(),
  release_notes_md: z.string().max(20000),
  poster_key: z.string().max(120).nullable(),
});

export async function createRelease(input: z.input<typeof releaseSchema>): Promise<Result> {
  return run(async () => {
    const parsed = releaseSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid release.");
    const { sb } = await requireAdmin();
    const { data, error } = await sb.from("app_releases").insert(parsed.data).select("id").single();
    if (error) return fail(error.message);
    revalidatePath("/admin/releases");
    return { ok: true, data };
  });
}

export async function updateRelease(id: string, patch: { is_published?: boolean; is_latest?: boolean; release_notes_md?: string }): Promise<Result> {
  return run(async () => {
    const destructive = patch.is_published === false;
    const { sb } = await requireAdmin(destructive ? { recentAuthMinutes: RECENT } : {});
    const clean = z
      .object({ is_published: z.boolean().optional(), is_latest: z.boolean().optional(), release_notes_md: z.string().max(20000).optional() })
      .parse(patch);
    if (clean.is_published === false) clean.is_latest = false;
    const { error } = await sb.from("app_releases").update(clean).eq("id", z.uuid().parse(id));
    if (error) return fail(error.message);
    revalidateTag(TAGS.releases, "max");
    revalidateTag(TAGS.config, "max");
    revalidatePath("/admin/releases");
  });
}

export async function deleteRelease(id: string, filePath: string): Promise<Result> {
  return run(async () => {
    const { sb } = await requireAdmin({ recentAuthMinutes: RECENT });
    await sb.storage.from("apk-releases").remove([z.string().regex(/^NOTtEodo-[0-9A-Za-z.+-]+\.apk$/).parse(filePath)]);
    const { error } = await sb.from("app_releases").delete().eq("id", z.uuid().parse(id));
    if (error) return fail(error.message);
    revalidateTag(TAGS.releases, "max");
    revalidatePath("/admin/releases");
  });
}

/** Emails confirmed subscribers about a release (or the Play launch). Needs RESEND_API_KEY. */
export async function emailSubscribers(topic: "play_launch" | "releases", releaseId?: string): Promise<Result> {
  return run(async () => {
    const { sb } = await requireAdmin({ recentAuthMinutes: RECENT });
    const service = supabaseService();
    if (!service) return fail("Set SUPABASE_SERVICE_ROLE_KEY and RESEND_API_KEY to send email.");
    const { data: rel } = releaseId ? await sb.from("app_releases").select("version_name,release_notes_md").eq("id", releaseId).single() : { data: null };
    const { data: subs } = await sb.from("release_subscribers").select("id,email").eq("topic", topic).eq("status", "confirmed");
    let sent = 0;
    for (const s of subs ?? []) {
      // A fresh unsubscribe token per send; only its hash is stored.
      const token = randomToken();
      await service.from("release_subscribers").update({ unsubscribe_token_hash: await sha256Hex(token) }).eq("id", s.id);
      const mail = releaseEmail({
        version: rel?.version_name ?? "",
        notes: rel?.release_notes_md ?? "NOTtEodo is now on Google Play.",
        url: topic === "play_launch" ? `${siteUrl}/download` : `${siteUrl}/download`,
        unsubscribeUrl: `${siteUrl}/api/unsubscribe?token=${token}`,
        playLive: topic === "play_launch",
      });
      if (await sendEmail({ to: s.email as string, ...mail, unsubscribeUrl: `${siteUrl}/api/unsubscribe?token=${token}` })) sent++;
    }
    return { ok: true, message: `Sent ${sent} of ${(subs ?? []).length}.` };
  });
}

/* ---------------------------------------------------------------- feedback */

export async function updateFeedback(fd: FormData): Promise<Result> {
  return run(async () => {
    const p = z
      .object({
        id: z.uuid(),
        status: z.enum(["pending", "reviewed", "planned", "resolved"]),
        admin_reply: z.string().max(5000).optional(),
        admin_notes: z.string().max(5000).optional(),
      })
      .safeParse(Object.fromEntries(fd));
    if (!p.success) return fail("Check the form.");
    const { sb, user } = await requireAdmin();
    const reply = p.data.admin_reply?.trim();
    const { error } = await sb
      .from("user_feedback")
      .update({
        status: p.data.status,
        admin_notes: p.data.admin_notes?.trim() || null,
        ...(reply ? { admin_reply: reply, replied_at: new Date().toISOString(), replied_by: user.id } : {}),
      })
      .eq("id", p.data.id);
    if (error) return fail(error.message);
    revalidatePath("/admin/feedback");
  });
}

export async function deleteFeedback(id: string): Promise<Result> {
  return run(async () => {
    const { sb } = await requireAdmin({ recentAuthMinutes: RECENT });
    const { error } = await sb.from("user_feedback").delete().eq("id", z.uuid().parse(id));
    if (error) return fail(error.message);
    revalidatePath("/admin/feedback");
  });
}

/* ------------------------------------------------------------ nodo insights */

export async function reviewInsight(fd: FormData): Promise<Result> {
  return run(async () => {
    const p = z
      .object({ topic: z.string().regex(/^[a-z0-9_]{2,48}$/), status: z.enum(["approved", "rejected", "candidate"]), answer: z.string().max(1200).optional() })
      .safeParse(Object.fromEntries(fd));
    if (!p.success) return fail("Check the form.");
    const { sb } = await requireAdmin();
    const { error } = await sb
      .from("nodo_app_insights")
      .update({ status: p.data.status, reviewed_by_admin: true, ...(p.data.answer ? { answer: p.data.answer } : {}), updated_at: new Date().toISOString() })
      .eq("topic", p.data.topic);
    if (error) return fail(error.message);
    revalidateTag(TAGS.content, "max");
    revalidatePath("/admin/nodo");
  });
}

/* -------------------------------------------------------------------- legal */

export async function publishLegal(fd: FormData): Promise<Result> {
  return run(async () => {
    const p = z
      .object({
        doc: z.enum(["privacy", "terms", "child-safety", "cookies", "data-safety", "accessibility"]),
        version: z.string().regex(/^\d+\.\d+$/),
        effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        summary_of_changes: z.string().min(3).max(2000),
      })
      .safeParse(Object.fromEntries(fd));
    if (!p.success) return fail(p.error.issues[0]?.message ?? "Check the form.");
    const { sb } = await requireAdmin({ recentAuthMinutes: RECENT });
    // Hash the page text as published, so the app can tell exactly which text a user saw.
    const url = `${siteUrl}/${p.data.doc}`;
    let text = `${p.data.doc}@${p.data.version}:${p.data.summary_of_changes}`;
    try {
      const html = await (await fetch(url, { cache: "no-store" })).text();
      text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    } catch {
      /* fall back to hashing the summary */
    }
    const { error } = await sb.from("legal_documents").insert({ ...p.data, url, content_sha256: await sha256Hex(text) });
    if (error) return fail(error.message);
    revalidateTag(TAGS.legal, "max");
    revalidatePath("/admin/legal");
  });
}

/* ---------------------------------------------------------------------- CMS */

const cmsTables = {
  faq_overrides: z.object({ question: z.string().min(3).max(300), answer_md: z.string().min(3).max(4000), section: z.string().max(40).optional(), sort: z.coerce.number().int().default(100), is_published: z.boolean() }),
  roadmap_items: z.object({ title: z.string().min(2).max(120), body: z.string().max(1000).default(""), status: z.enum(["exploring", "planned", "building", "shipped"]), sort: z.coerce.number().int().default(100), is_published: z.boolean() }),
  testimonials: z.object({
    quote: z.string().min(10).max(600),
    name: z.string().min(1).max(80),
    handle: z.string().max(80).optional(),
    source: z.string().min(2).max(200),
    consent_at: z.string().optional().transform((v) => (v ? new Date(v).toISOString() : null)),
    consent_note: z.string().max(500).optional(),
    is_published: z.boolean(),
  }),
} as const;

export async function saveCmsRow(table: keyof typeof cmsTables, fd: FormData): Promise<Result> {
  return run(async () => {
    const schema = cmsTables[table];
    if (!schema) return fail("Unknown table.");
    const raw = Object.fromEntries(fd) as Record<string, unknown>;
    const id = raw.id ? z.uuid().parse(raw.id) : null;
    delete raw.id;
    const parsed = schema.safeParse({ ...raw, is_published: fd.get("is_published") === "on" });
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
    if (table === "testimonials" && (parsed.data as { is_published: boolean; consent_at: string | null }).is_published && !(parsed.data as { consent_at: string | null }).consent_at) {
      return fail("Record when the person consented before publishing their words.");
    }
    const { sb } = await requireAdmin();
    const row = parsed.data as Record<string, unknown>;
    const { error } = id ? await sb.from(table).update(row).eq("id", id) : await sb.from(table).insert(row);
    if (error) return fail(error.message);
    revalidateTag(TAGS.content, "max");
    revalidatePath("/admin/cms");
  });
}

export async function deleteCmsRow(table: keyof typeof cmsTables, id: string): Promise<Result> {
  return run(async () => {
    const { sb } = await requireAdmin();
    const { error } = await sb.from(table).delete().eq("id", z.uuid().parse(id));
    if (error) return fail(error.message);
    revalidateTag(TAGS.content, "max");
    revalidatePath("/admin/cms");
  });
}

/* -------------------------------------------------------------- admins */

export async function createInvite(fd: FormData): Promise<Result> {
  return run(async () => {
    const note = z.string().max(200).optional().parse(fd.get("note") || undefined);
    const hours = z.coerce.number().int().min(1).max(336).parse(fd.get("hours") ?? 72);
    const { sb } = await requireAdmin({ recentAuthMinutes: RECENT });
    const { data, error } = await sb.rpc("create_admin_invite", { p_note: note ?? null, p_hours: hours });
    if (error) return fail(error.message);
    revalidatePath("/admin/users");
    return { ok: true, data: { code: data as string, link: `${siteUrl}/admin-invite?code=${encodeURIComponent(data as string)}` } };
  });
}

export async function revokeInvite(id: string): Promise<Result> {
  return run(async () => {
    const { sb } = await requireAdmin();
    const { error } = await sb.from("admin_invites").update({ revoked_at: new Date().toISOString() }).eq("id", z.uuid().parse(id));
    if (error) return fail(error.message);
    revalidatePath("/admin/users");
  });
}

export async function removeAdmin(userId: string): Promise<Result> {
  return run(async () => {
    const { sb } = await requireAdmin({ recentAuthMinutes: RECENT });
    const { error } = await sb.rpc("admin_revoke_admin", { p_user_id: z.uuid().parse(userId) });
    if (error) return fail(error.message);
    revalidatePath("/admin/users");
  });
}

/** Any signed-in user can redeem a valid invite (the RPC checks it). */
export async function redeemInvite(code: string): Promise<Result> {
  return run(async () => {
    const { getViewer } = await import("@/lib/supabase/server");
    const { sb, user } = await getViewer();
    if (!sb || !user) return fail("Sign in first.");
    const { data, error } = await sb.rpc("redeem_admin_invite", { p_code: z.string().min(10).max(64).parse(code) });
    if (error) return fail(error.message);
    return data ? { ok: true } : fail("That invite is invalid, used, revoked or expired.");
  });
}

/** Test email to the signed-in admin, to check Resend configuration. */
export async function testEmail(): Promise<Result> {
  return run(async () => {
    const { user } = await requireAdmin();
    const ok = await sendEmail({
      to: user.email!,
      subject: "NOTtEodo admin: test email",
      text: "Resend is configured correctly.",
      html: emailHtml("Email works.", "<p>Resend is configured correctly for NOTtEodo.</p>"),
    });
    return ok ? { ok: true, message: "Sent." } : fail("Not sent. Check RESEND_API_KEY and RESEND_FROM.");
  });
}
