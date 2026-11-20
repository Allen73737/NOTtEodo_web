import "server-only";
import { z } from "zod";

const schema = z.object({
  SUPPORT_EMAIL: z.string().default("[SUPPORT EMAIL]"),
  REVALIDATE_SECRET: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DOWNLOAD_HASH_SALT: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default("NOTtEodo <hello@example.invalid>"),
  ANDROID_CERT_SHA256_APP_SIGNING: z.string().optional(),
  ANDROID_CERT_SHA256_UPLOAD: z.string().optional(),
});

/** Server-only secrets. Importing this from a Client Component fails the build (server-only). */
export const serverEnv = schema.parse(process.env);
