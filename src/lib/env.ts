import { z } from "zod";

/** Public config, safe for the browser. Every value has a sane default so the site builds offline. */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional().or(z.literal("").transform(() => undefined)),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_PLAY_STORE_URL: z
    .url()
    .default("https://play.google.com/store/apps/details?id=com.notteodo.notteodo"),
});

export const env = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_PLAY_STORE_URL: process.env.NEXT_PUBLIC_PLAY_STORE_URL || undefined,
});

/** True when the site is wired to Supabase. Without it, pages render from build-time fallbacks. */
export const hasSupabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
