# App hand-off: changes for `C:\My_Project\Notteodo`

The website never edits the app repo. Everything the app needs is below, in priority order. Code to copy lives in `app-handoff/`. A ready-to-paste prompt for a Claude Code session in the app repo is in `app-handoff/PROMPT.md`.

**Launch blockers (Play):** §1, §2, §3 and §5. The privacy policy on the website already describes the behaviour *after* §3 once `nodo_cloud_opt_in` is switched on.

---

## 1. Release signing: one key, no debug fallback
- Create the long-lived **app signing key** now; sign every APK published on the website with it. Upload the same key in Play App Signing ("Use a different key → export and upload from Java keystore"), with a separate upload key (OPEN_QUESTIONS D19).
- `frontend/android/app/build.gradle(.kts)`: refuse to build `release` without `key.properties`:
  ```kotlin
  // in buildTypes.release, replacing the debug fallback
  signingConfig = if (keystorePropertiesFile.exists()) signingConfigs.getByName("release")
      else throw GradleException("Release builds need key.properties (never debug-signed)")
  ```
- ⚠ The current `build/app/outputs/flutter-apk/app-release.apk` is signed with certificate SHA-256 `7F:32:98:6B:15:AF:8F:08:20:DC:37:7D:5A:25:56:EE:CD:B2:71:EB:EA:62:62:52:90:04:B4:19:EC:EC:96:E2` (read by the website's APK inspector). Check whether that is your release key or the **debug** key (`keytool -list -v -keystore ~/.android/debug.keystore`). Don't publish it if it's the debug key.

## 2. Permissions (Play policy)
`frontend/android/app/src/main/AndroidManifest.xml`:
```diff
-    <uses-permission android:name="android.permission.USE_EXACT_ALARM"/>
-    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"/>
```
- **Exact reminders still work:** keep `SCHEDULE_EXACT_ALARM`. Before scheduling, check `AlarmManager.canScheduleExactAlarms()`; if false, show a one-tap sheet "Allow exact reminders" that opens `Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM` with `package:` data. Fall back to inexact `setAndAllowWhileIdle` until granted.
- **Battery reliability still works:** in `MainActivity.kt` → `"requestIgnoreBatteryOptimizations"`, open the list instead of the direct dialog:
  ```kotlin
  "requestIgnoreBatteryOptimizations" -> {
      try {
          startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
          result.success(true)
      } catch (e: Exception) { result.success(false) }
  }
  ```
  Rename the UI button to "Keep reminders reliable", with a line explaining: "Find NOTtEodo and choose Don't optimise."
- Alternative if you insist on `USE_EXACT_ALARM`: keep it, and in the Play declaration argue the planner/calendar core function. Rejection risk remains.

## 3. Cloud Nodo: ask first (DPDP consent)
- `core/state/app_settings.dart`: change the default `cloudAi = true` → **`cloudAi = false`**, and add `cloudAiAsked = false`.
- The first time a signed-in user would send a cloud request (`GroqAiService.ask`, transcription, AI morning notification), show a one-time sheet:
  > **Use Nodo in the cloud?** To answer, Nodo sends your question, the notes and tasks that match it, a short summary of your day and your recent chat to our server and to Groq, Inc. (USA), which may not use them to train models. Nodo remembers useful facts, and you can see and erase them in Settings → Nodo assistant.
  > [Use cloud Nodo] [Keep it on this phone]
  Both buttons have equal weight. Store the answer (`cloudAi`, `cloudAiAsked = true`). Transcription asks the same way.
- Honour `platform_config.ai.cloud_enabled == false` (kill switch) via `PlatformConfigService`: treat it as cloud off.
- After shipping, set `nodo_cloud_opt_in = true` in Admin → Platform Config.

**Server (`backend/supabase/functions/_shared/nodo_llm.ts`):** send a pseudonym, not the account ID:
```ts
const salt = Deno.env.get("AI_USER_SALT") ?? "";
async function pseudonym(id: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(id)));
  return [...mac.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
// in chat(): user: await pseudonym(opts.userId),
```
Set the secret: `supabase secrets set AI_USER_SALT=<long random string>`.

## 4. Platform services (config, updates, announcements, legal)
Copy `app-handoff/lib/core/platform/` into `frontend/lib/core/platform/` and `app-handoff/test/platform_services_test.dart` into `frontend/test/`.
- In `main.dart` after `SanctuarySupabaseService().initialize(...)`: `unawaited(PlatformConfigService.instance.start()); unawaited(AnnouncementService.instance.start());`
- **Update sheet:** on launch, `ReleaseCheckService.check(versionCode, config)`: `required` → blocking sheet; `available` → dismissible banner. Both open `ReleaseCheckService.updateUrl(config)` (Play once `play_live`, else the website's `/download`). **Never** download or install an APK from inside the app.
- **Maintenance:** show `config.maintenanceMessage` as a slim banner when `maintenanceOn`.
- **Announcements:** render active ones as the existing announcement banner. Replace the admin dashboard's local banner (`IN-APP ANNOUNCEMENT BANNER`) with inserts into `announcements` (target app/both).
- **Legal:** on launch, `LegalVersionService.unseenPrivacyVersion()`; if non-null show "Our privacy policy was updated" with a link to `config.url('privacy')`, then `markSeen`.
- **Links:** every legal/help/status/"manage on the web" link reads `config.url(...)`: Settings → Privacy & Data Safety, Terms & Conditions, Help & Support, About, and the delete-account screen ("You can also delete on the web").

## 5. Age gate on sign-up (DPDP s.9)
`features/auth/presentation/signin_screen.dart`, sign-up mode: two radio options (unselected by default): "I am 18 or older" / "I am under 18 and my parent or guardian has agreed". Block sign-up until one is chosen; pass it as user metadata `{age_confirmed_at, age_basis}` exactly like the website does. Without an account, no change.

## 6. Google Fonts runtime fetching
`main.dart:143` `GoogleFonts.config.allowRuntimeFetching = true;` → bundle the optional fonts you keep (or drop Inter, Playfair, Courier Prime, Plus Jakarta Sans, Outfit, Lora from `availableFonts`) and set it to **false**. Then remove the Google Fonts row from the website's privacy policy (`src/app/(site)/(legal)/privacy/page.tsx`).

## 7. Deep links + App Links
Manifest, inside the `MainActivity` `<activity>`:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="[DOMAIN]" android:pathPrefix="/open/" />
</intent-filter>
```
`MainActivity.kt` already forwards `host + path`; for `https://[DOMAIN]/open/task/new` that's `[DOMAIN]/open/task/new`. In `main.dart` `_handleDeepLink`, **before** stripping slashes:
```dart
var clean = target.toLowerCase().trim();
final open = RegExp(r'/open/(.+)$').firstMatch(clean);
if (open != null) clean = open.group(1)!;            // web App Links
else if (clean.contains('shortcut/')) clean = clean.split('shortcut/').last;
// … then, before the existing `clean.replaceAll('/', '')`:
switch (clean) {
  case 'note/new': return _openNewItem('note');
  case 'task/new': return _openNewItem('task');
  case 'expense/new': return _openNewItem('expense');
  case 'settings/account': return _openSettings('account');
  case 'release/latest': return _showUpdateSheet();
}
final fb = RegExp(r'^feedback/([0-9a-f-]{36})$').firstMatch(clean);
if (fb != null) return _openFeedbackThread(fb.group(1)!);
```
(`_openNewItem` opens the existing dedicated creation sheets; `_openSettings('account')` pushes Account & sync.)

## 8. Admin dashboard parity
- **Sub-admin invites:** remove `createSubAdminInviteCode/redeemSubAdminInviteCode/subAdminEmails` (local only, guessable). Call RPCs `create_admin_invite(p_note, p_hours)` → show the code once; `redeem_admin_invite(p_code)`; list via `admin_list_admins()`; revoke via `admin_revoke_admin(p_user_id)`.
- **TOTAL RECORDS / telemetry:** use `rpc('admin_table_counts')` (server totals) instead of the admin's local notes/tasks.
- **Feedback replies:** write `admin_reply` (+ `replied_at`, `replied_by`) and show replies to the author in Feedback & Ideas.
- **Releases / config / legal / CMS:** link to the web portal (`config.url('website') + '/admin'`) rather than re-implementing.

## 9. Optional: shared design tokens
The website emits `tokens/notteodo.tokens.json` (W3C format) from the app's own Dart files. If the app later wants a single source, generate `app_colors.dart` from that JSON instead; until then the website's drift check keeps them in step.

## 10. Tests to add
`frontend/test/platform_services_test.dart` (config parsing, update states, update URL), a widget test that the cloud-Nodo sheet appears once and both choices persist, and a test for the `/open/*` deep-link parser cases above.
