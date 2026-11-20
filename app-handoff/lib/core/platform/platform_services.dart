// NOTtEodo app ↔ website platform contract (docs/PLATFORM_CONTRACT.md in the website repo).
// Drop into frontend/lib/core/platform/. Reads the shared Supabase tables the website
// manages, caches every value in LocalStore so it works offline, and listens on Realtime
// so a publish in either admin portal reaches the app immediately.

import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../services/local_store.dart';
import '../services/sanctuary_supabase_service.dart';

/// platform_config as the app needs it. Defaults keep the app fully usable offline.
class PlatformConfig {
  final bool playLive;
  final bool nodoCloudOptIn;
  final bool aiCloudEnabled;
  final int minSupportedVersionCode;
  final int latestVersionCode;
  final bool maintenanceOn;
  final String maintenanceMessage;
  final Map<String, String> urls;

  const PlatformConfig({
    this.playLive = false,
    this.nodoCloudOptIn = false,
    this.aiCloudEnabled = true,
    this.minSupportedVersionCode = 1,
    this.latestVersionCode = 1,
    this.maintenanceOn = false,
    this.maintenanceMessage = '',
    this.urls = const {
      'privacy': 'https://[DOMAIN]/privacy',
      'terms': 'https://[DOMAIN]/terms',
      'delete_account': 'https://[DOMAIN]/delete-account',
      'support': 'https://[DOMAIN]/support',
      'help': 'https://[DOMAIN]/help',
      'play': 'https://play.google.com/store/apps/details?id=com.notteodo.notteodo',
      'website': 'https://[DOMAIN]',
      'status': 'https://[DOMAIN]/status',
    },
  });

  /// rows: [{key, value}] from platform_config.
  factory PlatformConfig.fromRows(List<Map<String, dynamic>> rows) {
    final m = {for (final r in rows) r['key'] as String: r['value']};
    final maintenance = (m['maintenance'] as Map?)?.cast<String, dynamic>() ?? const {};
    final ai = (m['ai'] as Map?)?.cast<String, dynamic>() ?? const {};
    final urls = (m['urls'] as Map?)?.map((k, v) => MapEntry(k.toString(), v.toString()));
    const d = PlatformConfig();
    return PlatformConfig(
      playLive: m['play_live'] == true,
      nodoCloudOptIn: m['nodo_cloud_opt_in'] == true,
      aiCloudEnabled: ai['cloud_enabled'] != false,
      minSupportedVersionCode: (m['min_supported_version_code'] as num?)?.toInt() ?? 1,
      latestVersionCode: (m['latest_version_code'] as num?)?.toInt() ?? 1,
      maintenanceOn: maintenance['on'] == true,
      maintenanceMessage: (maintenance['message'] ?? '').toString(),
      urls: {...d.urls, ...?urls},
    );
  }

  String url(String key) => urls[key] ?? const PlatformConfig().urls[key]!;
}

class Announcement {
  final String id, title, body, severity;
  final String? ctaLabel, ctaUrl;
  const Announcement({required this.id, required this.title, required this.body, required this.severity, this.ctaLabel, this.ctaUrl});
  factory Announcement.fromRow(Map<String, dynamic> r) => Announcement(
        id: r['id'] as String,
        title: r['title'] as String,
        body: (r['body_md'] ?? '') as String,
        severity: (r['severity'] ?? 'info') as String,
        ctaLabel: r['cta_label'] as String?,
        ctaUrl: r['cta_url'] as String?,
      );
}

enum UpdateState { upToDate, available, required }

/// Fetches + caches platform_config and listens for changes.
class PlatformConfigService {
  PlatformConfigService._();
  static final instance = PlatformConfigService._();
  static const _cacheKey = 'platform_config_cache';

  final _controller = StreamController<PlatformConfig>.broadcast();
  RealtimeChannel? _channel;
  PlatformConfig _current = const PlatformConfig();

  PlatformConfig get current => _current;
  Stream<PlatformConfig> get changes => _controller.stream;

  Future<void> start() async {
    final cached = LocalStore().readMap(_cacheKey);
    if (cached != null && cached['rows'] is List) {
      _current = PlatformConfig.fromRows((cached['rows'] as List).cast<Map<String, dynamic>>());
      _controller.add(_current);
    }
    await refresh();
    final client = SanctuarySupabaseService().client;
    _channel ??= client
        ?.channel('app-platform-config')
        .onPostgresChanges(event: PostgresChangeEvent.all, schema: 'public', table: 'platform_config', callback: (_) => refresh())
        .subscribe();
  }

  Future<void> refresh() async {
    final client = SanctuarySupabaseService().client;
    if (client == null) return;
    try {
      final rows = (await client.from('platform_config').select('key,value') as List).cast<Map<String, dynamic>>();
      LocalStore().writeMap(_cacheKey, {'rows': rows, 'at': DateTime.now().toIso8601String()});
      _current = PlatformConfig.fromRows(rows);
      _controller.add(_current);
    } catch (_) {
      // Offline: keep the cached config.
    }
  }
}

/// Compares this build's versionCode with the shared config. Never installs anything:
/// it opens the Play listing (or the website's /download before the Play launch).
class ReleaseCheckService {
  /// Pass the app's own versionCode (pubspec `+N`, e.g. from package_info_plus).
  static UpdateState check(int versionCode, PlatformConfig c) {
    if (versionCode < c.minSupportedVersionCode) return UpdateState.required;
    if (versionCode < c.latestVersionCode) return UpdateState.available;
    return UpdateState.upToDate;
  }

  static String updateUrl(PlatformConfig c) => c.playLive ? c.url('play') : '${c.url('website')}/download';
}

/// Active announcements targeted at the app ("app" or "both"), cached and live.
class AnnouncementService {
  AnnouncementService._();
  static final instance = AnnouncementService._();
  static const _cacheKey = 'announcements_cache';
  static const _dismissedKey = 'announcements_dismissed';

  final _controller = StreamController<List<Announcement>>.broadcast();
  RealtimeChannel? _channel;
  Stream<List<Announcement>> get changes => _controller.stream;

  Future<void> start() async {
    final cached = LocalStore().readMap(_cacheKey);
    if (cached?['rows'] is List) _emit((cached!['rows'] as List).cast<Map<String, dynamic>>());
    await refresh();
    _channel ??= SanctuarySupabaseService()
        .client
        ?.channel('app-announcements')
        .onPostgresChanges(event: PostgresChangeEvent.all, schema: 'public', table: 'announcements', callback: (_) => refresh())
        .subscribe();
  }

  Future<void> refresh() async {
    final client = SanctuarySupabaseService().client;
    if (client == null) return;
    try {
      final rows = (await client.from('announcements').select().eq('is_active', true).inFilter('target', ['app', 'both']).order('created_at', ascending: false) as List)
          .cast<Map<String, dynamic>>();
      LocalStore().writeMap(_cacheKey, {'rows': rows});
      _emit(rows);
    } catch (_) {}
  }

  void dismiss(String id) {
    final d = (LocalStore().readMap(_dismissedKey)?['ids'] as List?)?.cast<String>() ?? <String>[];
    LocalStore().writeMap(_dismissedKey, {'ids': [...d, id]});
    refresh();
  }

  void _emit(List<Map<String, dynamic>> rows) {
    final dismissed = (LocalStore().readMap(_dismissedKey)?['ids'] as List?)?.cast<String>() ?? const <String>[];
    final now = DateTime.now();
    _controller.add(rows
        .where((r) => !dismissed.contains(r['id']))
        .where((r) => r['starts_at'] == null || DateTime.parse(r['starts_at'] as String).isBefore(now))
        .where((r) => r['ends_at'] == null || DateTime.parse(r['ends_at'] as String).isAfter(now))
        .map(Announcement.fromRow)
        .toList());
  }
}

/// Shows "Our privacy policy was updated" once when the latest published privacy version changes.
class LegalVersionService {
  static const _seenKey = 'legal_privacy_seen_version';

  /// Returns the new version string if the user hasn't seen it yet, else null.
  static Future<String?> unseenPrivacyVersion() async {
    final client = SanctuarySupabaseService().client;
    if (client == null) return null;
    try {
      final row = await client.from('legal_documents').select('version').eq('doc', 'privacy').order('published_at', ascending: false).limit(1).maybeSingle();
      final v = row?['version'] as String?;
      if (v == null) return null;
      final seen = LocalStore().readString(_seenKey);
      if (seen == null) {
        // First run after install: record silently, nothing to announce.
        LocalStore().writeString(_seenKey, v);
        return null;
      }
      return seen == v ? null : v;
    } catch (_) {
      return null;
    }
  }

  static void markSeen(String version) => LocalStore().writeString(_seenKey, version);
}
