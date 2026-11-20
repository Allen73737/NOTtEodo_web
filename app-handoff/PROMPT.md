# Ready-to-paste prompt for a Claude Code session in `C:\My_Project\Notteodo`

Copy everything inside the box into a new Claude Code session opened in the app repo.

```
You are working in the NOTtEodo Flutter app repo. The companion website lives in
C:\My_Project\NOTtEodo_Web (read-only for this task). Implement the app side of the
website's platform contract. Read these first:
  - C:\My_Project\NOTtEodo_Web\APP_HANDOFF.md        (the full list, in priority order)
  - C:\My_Project\NOTtEodo_Web\docs\PLATFORM_CONTRACT.md
  - C:\My_Project\NOTtEodo_Web\app-handoff\          (Dart files and tests to copy)
  - C:\My_Project\NOTtEodo_Web\supabase\migrations\20261121000000_website_platform.sql (tables/RPCs you'll call)

Do, in this order, committing after each numbered section with conventional commits:
 1. Release signing: make release builds fail without key.properties (no debug fallback).
 2. Permissions: remove USE_EXACT_ALARM and REQUEST_IGNORE_BATTERY_OPTIMIZATIONS; keep exact
    reminders via SCHEDULE_EXACT_ALARM + an "Allow exact reminders" sheet
    (ACTION_REQUEST_SCHEDULE_EXACT_ALARM); battery button opens ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS.
 3. Cloud Nodo opt-in: cloudAi defaults to false; one-time consent sheet (equal-weight buttons,
    wording in APP_HANDOFF §3) before the first cloud request and before cloud transcription;
    honour platform_config.ai.cloud_enabled. In backend/supabase/functions/_shared/nodo_llm.ts
    send an HMAC-SHA256 pseudonym (secret AI_USER_SALT) instead of the user id.
 4. Copy app-handoff/lib/core/platform/* and the test; start PlatformConfigService and
    AnnouncementService after Supabase init; add the update banner/sheet (opens Play when
    play_live, else https://[DOMAIN]/download; never install APKs in-app), maintenance banner,
    announcements banner, "privacy policy updated" notice; repoint every legal/help/status link
    to platform_config urls.
 5. Age gate on sign-up (18+ or guardian consent), stored as user metadata
    {age_confirmed_at, age_basis}, matching the website.
 6. Set GoogleFonts.config.allowRuntimeFetching = false and bundle or remove the optional fonts.
 7. App Links: autoVerify intent-filter for https://[DOMAIN]/open/*, and extend _handleDeepLink
    for note/new, task/new, expense/new, settings/account, release/latest and feedback/<uuid>
    (see APP_HANDOFF §7). Keep notteodo://shortcut/* working.
 8. Admin dashboard: replace local sub-admin invites with the server RPCs, use
    admin_table_counts() for telemetry, write feedback replies to admin_reply, send
    announcements to the announcements table, link to the web Admin Portal for the rest.
 9. Add the tests listed in APP_HANDOFF §10. Run `flutter analyze` and `flutter test`; fix
    everything.

Rules: keep the Ivory & Oxblood design system and existing motion; no new colours; no new
analytics or tracking; don't touch production data; ask before anything destructive. Finish
with a short report: what changed, test results, and anything you couldn't do.
```
