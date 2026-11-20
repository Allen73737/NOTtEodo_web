// Tests to add in frontend/test/platform_services_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:notteodo/core/platform/platform_services.dart';

void main() {
  group('PlatformConfig.fromRows', () {
    test('defaults when rows are empty', () {
      final c = PlatformConfig.fromRows(const []);
      expect(c.playLive, isFalse);
      expect(c.url('privacy'), contains('/privacy'));
    });
    test('reads flags, versions, maintenance and urls', () {
      final c = PlatformConfig.fromRows([
        {'key': 'play_live', 'value': true},
        {'key': 'min_supported_version_code', 'value': 3},
        {'key': 'latest_version_code', 'value': 5},
        {'key': 'maintenance', 'value': {'on': true, 'message': 'Back soon'}},
        {'key': 'urls', 'value': {'privacy': 'https://example.com/privacy'}},
        {'key': 'ai', 'value': {'cloud_enabled': false}},
      ]);
      expect(c.playLive, isTrue);
      expect(c.maintenanceOn, isTrue);
      expect(c.maintenanceMessage, 'Back soon');
      expect(c.url('privacy'), 'https://example.com/privacy');
      expect(c.url('terms'), contains('/terms'));
      expect(c.aiCloudEnabled, isFalse);
    });
  });

  group('ReleaseCheckService', () {
    final c = PlatformConfig.fromRows([
      {'key': 'min_supported_version_code', 'value': 3},
      {'key': 'latest_version_code', 'value': 5},
    ]);
    test('required below the minimum', () => expect(ReleaseCheckService.check(2, c), UpdateState.required));
    test('available below latest', () => expect(ReleaseCheckService.check(4, c), UpdateState.available));
    test('up to date at latest', () => expect(ReleaseCheckService.check(5, c), UpdateState.upToDate));
    test('opens /download before the Play launch', () => expect(ReleaseCheckService.updateUrl(c), endsWith('/download')));
  });
}
