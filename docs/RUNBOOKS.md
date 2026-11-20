# Runbooks

## Before launch (one time)
1. **Fill the placeholders**: search the repo for `[DEVELOPER NAME]`, `[SUPPORT EMAIL]`, `[DOMAIN]`, `[POSTAL ADDRESS]`, `[GRIEVANCE OFFICER`, `[CITY]` (mostly in `src/content/identity.ts`, the terms page and the migration seed URLs).
2. **Apply the migration** (staging first, then production), *after* the app's migrations:
   ```bash
   supabase link --project-ref <ref>
   supabase db push          # applies supabase/migrations/20261121000000_website_platform.sql
   ```
   Or paste the file into the SQL editor. It is idempotent.
3. **Supabase dashboard**
   - Authentication → URL configuration: Site URL `https://[DOMAIN]`; redirect URLs `https://[DOMAIN]/auth/callback`, `https://*.vercel.app/auth/callback` (previews) and the existing `io.supabase.notteodo://login-callback`.
   - Authentication → Providers → Google: add the website origin to the Google OAuth client.
   - Authentication → SMTP: optionally set Resend SMTP (`smtp.resend.com:465`, user `resend`, password = API key) so sign-up emails come from your domain.
   - Database → Webhooks (optional): POST to `https://[DOMAIN]/api/revalidate` with header `Authorization: Bearer <REVALIDATE_SECRET>` and body `{"table":"<table>"}` on `app_releases`, `announcements`, `platform_config`, `legal_documents`, so changes made from the **app's** admin dashboard refresh the website instantly.
4. **Vercel env vars**: see `.env.example`. `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DOWNLOAD_HASH_SALT` (any long random string), `REVALIDATE_SECRET` are server-only. `ANDROID_CERT_SHA256_APP_SIGNING` is required in production.
5. **Groq**: console → Settings → Data Controls → enable Zero Data Retention, then set `groq_zdr = true` in Admin → Platform Config.
6. **Resend**: verify your domain, set `RESEND_FROM`, then Admin → Alerts & Logs → *Send test email*.

## Publish an APK
1. Build a release APK signed with the app signing key (never debug-signed).
2. Admin → **Releases & APK** → drop the APK. The browser checks package, versionCode (must be higher) and signing certificate (warns on change), and computes the SHA-256.
3. Add release notes and an optional poster → **Upload** (resumable; pause/resume) → the release is saved as a draft.
4. **Publish as latest**. The website updates live; `latest_version_code` updates for the app's update check.
5. Optional: **Email subscribers**.

## Roll back a release
Admin → Releases → on the previous version, **Make latest**. To withdraw a bad build entirely, **Unpublish** it (needs a sign-in within 15 minutes). The download link for an unpublished release redirects to the latest one.

## Publish a legal update
1. Edit the page text in `src/app/(site)/(legal)/<doc>/page.tsx`, add a line to `LEGAL_META` in `src/components/legal/LegalPage.tsx`, deploy.
2. Admin → **Legal Versions** → publish the new version with the effective date and a summary. The hash of the live page is recorded; the app (after the hand-off) shows "Our privacy policy was updated".

## Toggle maintenance
Admin → Platform Config → **Start maintenance**. A banner appears on the website and in the app. End it the same way.

## Launch on Google Play
1. Admin → Platform Config → **Mark live on Play** (`play_live = true`): every Play button becomes a link.
2. Admin → Releases → **Email Play-launch subscribers**.

## Add an admin
Admin → **Users & Sub-Admins** → Generate invite link → send it privately. The person signs in and redeems it at `/admin-invite`. First admin ever: in the SQL editor
`INSERT INTO public.app_admins (user_id, note) SELECT id, 'owner' FROM auth.users WHERE email = '<you>';`

## Rotate keys
- **Supabase anon/service keys**: rotate in Supabase → API, update Vercel env, redeploy, update the app's build config.
- **Resend / Groq**: rotate in their consoles; update Vercel env (Resend) or Supabase function secrets (Groq: `supabase secrets set GROQ_API_KEY=…`).
- **DOWNLOAD_HASH_SALT / REVALIDATE_SECRET**: change in Vercel and in the database webhook header.

## Regenerate posters
`pnpm sync:screenshots && pnpm posters`, then commit `public/posters` and `src/content/generated/posters.json`. After recapturing screenshots, update `scripts/screenshot-map.json` (what each file really shows) first.

## Survive a Supabase outage
The website keeps serving: every platform read falls back to the last cached snapshot or built-in defaults, and /status shows what is down. Signed-in pages say they can't connect. The app keeps working offline.

## Housekeeping
- Feedback older than 3 years should be deleted (privacy policy commitment): Admin → User Voice, or SQL `DELETE FROM user_feedback WHERE created_at < now() - interval '3 years';`.
- Unconfirmed subscribers are pruned by pg_cron (`nt_prune_subscribers`).
