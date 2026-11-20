// Riverpod providers for the platform services. Drop next to platform_services.dart.
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'platform_services.dart';

final platformConfigProvider = StreamProvider<PlatformConfig>((ref) async* {
  final s = PlatformConfigService.instance;
  yield s.current;
  unawaitedStart(s.start);
  yield* s.changes;
});

final announcementsProvider = StreamProvider<List<Announcement>>((ref) {
  final s = AnnouncementService.instance;
  unawaitedStart(s.start);
  return s.changes;
});

/// Pass the build's versionCode (pubspec +N). Example: ref.watch(updateStateProvider(1)).
final updateStateProvider = Provider.family<UpdateState, int>((ref, versionCode) {
  final config = ref.watch(platformConfigProvider).valueOrNull ?? const PlatformConfig();
  return ReleaseCheckService.check(versionCode, config);
});

void unawaitedStart(Future<void> Function() f) {
  f().catchError((_) {});
}
