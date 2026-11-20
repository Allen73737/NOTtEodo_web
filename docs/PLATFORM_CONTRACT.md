# The App ↔ Web platform contract

One backend, one identity, one set of tokens, one content source. This document is the agreement between the Flutter app (`C:\My_Project\Notteodo`) and this website. Changing anything here means changing both clients. `APP_HANDOFF.md` lists the app-side work.

```
                         ┌───────────────────────────── Supabase (India region) ─────────────────────────────┐
                         │                                                                                    │
  Flutter app ──JWT──►   │  Auth (same users, email+password, Google, TOTP MFA)                               │   ◄──JWT/cookies── Website (Next.js, Vercel)
  (com.notteodo.notteodo)│                                                                                    │
                         │  App data (RLS: owner only)        Platform data (RLS: public read / admin write)  │
     LocalStore (AES-GCM)│   user_collections  user_keys        platform_config   app_releases   announcements│
     ── sync when signed │   nodo_memories/threads/turns        legal_documents   faq_overrides  testimonials │
        in ───────────►  │   user_feedback (+ reply columns) ◄──── both clients ────► roadmap_items           │
                         │   nodo_app_insights (admin review)   release_subscribers (server only)             │
                         │                                      admin_invites  admin_audit_log (trigger only) │
                         │  Edge functions: ai-assist · delete-account · cloudinary-sign · rag-embedder · ... │
                         │  Storage: apk-releases (public read, admin write)                                  │
                         │  Realtime: app_releases · announcements · platform_config                          │
                         └────────────────────────────────────────────────────────────────────────────────────┘
        │                                   │                                        │
        └── Cloudinary (India): media ──────┘        Groq (USA): opted-in AI only    └── Resend (USA): release emails (double opt-in)
```

## 1. One backend, one identity

- **Same Supabase project and the same `auth.users`.** The web offers the app's sign-in methods: email + password, Google OAuth, and TOTP two-step verification (the app's RLS requires an AAL2 session for accounts with a verified factor).
- **Password rules** are a 1:1 port of `password_policy.dart` (`src/lib/password-policy.ts`): minimum 10 characters, the same blocklist, sequence and repeat checks, no email local-part, the same entropy scoring and labels. The breach check sends **only the first 5 hex characters of the SHA-1** to `api.pwnedpasswords.com` with `Add-Padding: true`.
- **Redirect URLs:** add `https://[DOMAIN]/auth/callback` and `https://*-[VERCEL-TEAM].vercel.app/auth/callback` (previews) in Supabase → Authentication → URL Configuration. Keep `io.supabase.notteodo://login-callback` for the app.
- **Authorisation lives in RLS**, so it is identical on both clients. Admin status comes only from `public.is_app_admin()` (rows in `app_admins`). All admins have equal rights. The last admin cannot be removed.

## 2. One token source

`scripts/sync-tokens.ts` parses `app_colors.dart`, `app_dark_theme.dart`, `app_component_theme.dart` and the `core/motion` primitives, and emits:

| Output | Used by |
|---|---|
| `tokens/notteodo.tokens.json` | W3C Design Tokens (colour light/dark, duration, cubicBezier). Designed so the app could consume it later |
| `src/styles/tokens.css` | CSS variables (`--c-*`, `--d-*`, `--e-*`) for both themes |
| `src/content/generated/tokens.ts` | JS, posters, shaders, the forbidden-colour lint |

`pnpm check:drift` fails when the app changes and the committed tokens weren't regenerated.

## 3. Shared tables (migration `supabase/migrations/20261121000000_website_platform.sql`)

| Table | Read | Write | Notes |
|---|---|---|---|
| `platform_config (key, value jsonb)` | anon | admin | Keys: `play_live`, `nodo_cloud_opt_in`, `min_supported_version_code`, `latest_version_code`, `maintenance {on,message}`, `urls {privacy, terms, delete_account, support, help, play, website, status}`, `flags {release_emails, testimonials, roadmap}`, `hero {eyebrow, headline, sub}` |
| `app_releases` | anon (published) | admin | versionCode strictly increases; one `is_latest` per channel; publishing a stable latest updates `latest_version_code` |
| `download_events` | none | via `increment_download` only | salted, daily-rotated client hash; pruned after 2 days; never a raw IP |
| `announcements` | anon (active, in window) | admin | `target: web\|app\|both`; CTA URL allowlist: `https://…` or a site path (no `javascript:`, no `//host`) |
| `legal_documents` | anon | admin | `(doc, version)` unique; the app shows "Our privacy policy was updated" when the latest `privacy` version is newer than the one the user saw |
| `faq_overrides`, `roadmap_items` | anon (published) | admin | |
| `testimonials` | anon (published) | admin | cannot be published without `consent_at` |
| `release_subscribers` | admin | website server (service role) | double opt-in; tokens stored as SHA-256 only; pending rows deleted after 7 days |
| `admin_invites` | admin | `create_admin_invite` / `redeem_admin_invite` | 96-bit single-use codes, stored hashed, expire in 72 h |
| `admin_audit_log` | admin | trigger only | every admin write, with a field-level diff; secrets stripped |
| `user_feedback` (+`admin_reply`, `replied_at`, `replied_by`, `source`) | own + admin | insert own (no reply fields) / admin update | replies show in the app and on `/account` |

**RPCs:** `increment_download(release_id, client_hash)`, `public_status()`, `public_nodo_insights()`, `admin_table_counts()`, `admin_storage_usage()`, `admin_list_admins()`, `admin_revoke_admin(user_id)`, `create_admin_invite(note, hours)`, `redeem_admin_invite(code)`. Every SECURITY DEFINER function sets `search_path` and has explicit grants.

**Tests:** `tests/db/rls.test.ts` runs the app's real migration chain plus this one in PGlite (Postgres 17 in-process) and checks anon, user and admin access for each table (19 cases).

## 4. Realtime

Both clients subscribe to `app_releases`, `announcements` and `platform_config` on the `supabase_realtime` publication. The website reconnects with backoff (supabase-js) and falls back to ISR snapshots (`unstable_cache` with tags; admin writes call `revalidateTag`). **A publish in either admin portal goes live on both clients.**

## 5. One content source

- `app_guide.json` (27 sections) is synced into `src/content/generated/`. Help, FAQ, feature copy, the command palette and the in-browser "Ask Nodo" demo all come from it. Approved `nodo_app_insights` (via `public_nodo_insights()`) extend web help search.
- **The website hosts the legal documents.** The app reads their URLs from `platform_config.urls` and the version from `legal_documents`.

## 6. Deep links / App Links

- `/.well-known/assetlinks.json` declares `com.notteodo.notteodo` with `ANDROID_CERT_SHA256_APP_SIGNING` and `ANDROID_CERT_SHA256_UPLOAD` (env). Production refuses to serve an empty list.
- `/open/*` pages are server-rendered fallbacks. On Android with the app installed, the verified App Link opens the app before the page loads. Otherwise the page offers "Open in app" (`notteodo://shortcut/<target>`), then the download.

| Web URL | In the app today | After the hand-off |
|---|---|---|
| `/open/capture` | Quick Capture ✓ | ✓ |
| `/open/focus` | Focus Dial ✓ | ✓ |
| `/open/<module>` (notes, tasks, planner, expenses, …) | that module ✓ | ✓ |
| `/open/note/new`, `/open/task/new`, `/open/expense/new` | lands on Home ✗ (parser strips `/`) | new item editor |
| `/open/settings/account` | Home ✗ | Account & sync |
| `/open/feedback/<id>` | Home ✗ | that feedback thread |
| `/open/release/latest` | Home ✗ | Update sheet |

## 7. Shared flows

- **Feedback:** both clients write `user_feedback` (`source = app|web`); admin replies are visible in both.
- **Account deletion:** the web calls the existing `delete-account` edge function with the user's JWT and `{"confirm":"DELETE"}`. Same result as the app.
- **Updates:** the app compares its versionCode with `latest_version_code` / `min_supported_version_code` and shows "Update available/required", which opens the **Play listing** once `play_live` is on, or `/download` before. It never installs APKs itself.
- **Maintenance:** `platform_config.maintenance` drives the banner on both clients.
- **Nodo learning:** admins approve or reject `nodo_app_insights` from either portal.
- **Sub-admins:** invites are server-side (`admin_invites`); the app's local-only invite codes are retired by the hand-off.
