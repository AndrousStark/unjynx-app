import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:feature_profile/src/presentation/providers/profile_providers.dart';

void main() {
  group('UserStats', () {
    test('defaults to all zeros', () {
      const stats = UserStats();

      expect(stats.tasksCompleted, 0);
      expect(stats.currentStreak, 0);
      expect(stats.totalXp, 0);
    });

    test('accepts custom values', () {
      const stats = UserStats(
        tasksCompleted: 42,
        currentStreak: 7,
        totalXp: 1500,
      );

      expect(stats.tasksCompleted, 42);
      expect(stats.currentStreak, 7);
      expect(stats.totalXp, 1500);
    });
  });

  group('userStatsProvider', () {
    test('returns default zeros', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final stats = await container.read(userStatsProvider.future);

      expect(stats.tasksCompleted, 0);
      expect(stats.currentStreak, 0);
      expect(stats.totalXp, 0);
    });

    test('can be overridden with real data', () async {
      final container = ProviderContainer(
        overrides: [
          userStatsProvider.overrideWith(
            (ref) async => const UserStats(
              tasksCompleted: 10,
              currentStreak: 3,
              totalXp: 500,
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final stats = await container.read(userStatsProvider.future);

      expect(stats.tasksCompleted, 10);
      expect(stats.currentStreak, 3);
      expect(stats.totalXp, 500);
    });
  });

  group('timezoneProvider', () {
    test('defaults to Asia/Kolkata', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final tz = container.read(timezoneProvider);

      expect(tz, 'Asia/Kolkata');
    });

    test('can be updated', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(timezoneProvider.notifier).state = 'America/New_York';

      expect(container.read(timezoneProvider), 'America/New_York');
    });
  });
}
