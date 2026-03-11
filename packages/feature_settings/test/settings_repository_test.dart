import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:feature_settings/src/domain/entities/app_settings.dart';
import 'package:feature_settings/src/data/repositories/shared_pref_settings_repository.dart';

void main() {
  late SharedPrefSettingsRepository repository;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    repository = SharedPrefSettingsRepository(prefs);
  });

  group('SharedPrefSettingsRepository', () {
    group('load', () {
      test('returns defaults when no saved settings', () {
        final settings = repository.load();

        expect(settings.defaultPriority, 'none');
        expect(settings.defaultProjectId, isNull);
        expect(settings.startOfWeek, 1);
        expect(settings.notificationsEnabled, isTrue);
        expect(settings.quietHoursStart, isNull);
        expect(settings.quietHoursEnd, isNull);
        expect(settings.defaultReminderMinutes, 15);
        expect(settings.autoArchiveDays, 7);
      });

      test('returns defaults when data is corrupted', () async {
        // Manually write invalid JSON
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('unjynx_app_settings', 'not-json{');

        final settings = repository.load();

        expect(settings, equals(const AppSettings()));
      });
    });

    group('save + load roundtrip', () {
      test('persists and loads settings correctly', () async {
        const custom = AppSettings(
          defaultPriority: 'high',
          startOfWeek: 7,
          notificationsEnabled: false,
          quietHoursStart: 22,
          quietHoursEnd: 8,
          defaultReminderMinutes: 30,
          autoArchiveDays: 14,
        );

        await repository.save(custom);
        final loaded = repository.load();

        expect(loaded.defaultPriority, 'high');
        expect(loaded.startOfWeek, 7);
        expect(loaded.notificationsEnabled, isFalse);
        expect(loaded.quietHoursStart, 22);
        expect(loaded.quietHoursEnd, 8);
        expect(loaded.defaultReminderMinutes, 30);
        expect(loaded.autoArchiveDays, 14);
      });

      test('persists defaultProjectId', () async {
        const settings = AppSettings(defaultProjectId: 'proj-123');

        await repository.save(settings);
        final loaded = repository.load();

        expect(loaded.defaultProjectId, 'proj-123');
      });
    });

    group('reset', () {
      test('clears settings back to defaults', () async {
        const custom = AppSettings(
          defaultPriority: 'urgent',
          autoArchiveDays: 30,
        );

        await repository.save(custom);
        await repository.reset();
        final loaded = repository.load();

        expect(loaded.defaultPriority, 'none');
        expect(loaded.autoArchiveDays, 7);
      });
    });

    group('AppSettings immutability', () {
      test('copyWith creates a new instance', () {
        const original = AppSettings();
        final modified = original.copyWith(defaultPriority: 'high');

        expect(original.defaultPriority, 'none');
        expect(modified.defaultPriority, 'high');
      });

      test('equality works', () {
        const a = AppSettings(defaultPriority: 'high');
        const b = AppSettings(defaultPriority: 'high');
        const c = AppSettings(defaultPriority: 'low');

        expect(a, equals(b));
        expect(a, isNot(equals(c)));
      });

      test('fromJson/toJson roundtrip', () {
        const settings = AppSettings(
          defaultPriority: 'medium',
          startOfWeek: 6,
          notificationsEnabled: false,
        );

        final json = settings.toJson();
        final restored = AppSettings.fromJson(json);

        expect(restored, equals(settings));
      });
    });
  });
}
