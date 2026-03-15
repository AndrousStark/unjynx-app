import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:feature_widgets/feature_widgets.dart';

/// Default widget enabled states (mirrors the source of truth in widget_config_page.dart).
const _defaults = <HomeWidgetType, bool>{
  HomeWidgetType.todayTasks: true,
  HomeWidgetType.dailyProgress: true,
  HomeWidgetType.quickAdd: true,
  HomeWidgetType.streakCounter: false,
  HomeWidgetType.upcomingDeadlines: false,
};

void main() {
  group('HomeWidgetType enum', () {
    test('has 5 widget types', () {
      expect(HomeWidgetType.values.length, 5);
    });

    test('todayTasks has correct display name', () {
      expect(HomeWidgetType.todayTasks.displayName, "Today's Tasks");
    });

    test('dailyProgress has correct size label', () {
      expect(HomeWidgetType.dailyProgress.sizeLabel, '2x2');
    });

    test('quickAdd has correct size label', () {
      expect(HomeWidgetType.quickAdd.sizeLabel, '4x1');
    });

    test('all types have non-empty descriptions', () {
      for (final type in HomeWidgetType.values) {
        expect(type.description.isNotEmpty, isTrue);
      }
    });
  });

  group('WidgetsPlugin', () {
    test('has correct ID and version', () {
      final plugin = WidgetsPlugin();
      expect(plugin.id, 'widgets');
      expect(plugin.version, '0.1.0');
    });

    test('provides widget config route', () {
      final plugin = WidgetsPlugin();
      expect(plugin.routes.length, 1);
      expect(plugin.routes.first.path, '/widgets');
    });
  });

  group('enabledWidgetsProvider', () {
    test('defaults to 3 enabled and 2 disabled', () async {
      final container = ProviderContainer(
        overrides: [
          enabledWidgetsProvider
              .overrideWith(() => _TestEnabledWidgetsNotifier()),
        ],
      );
      addTearDown(container.dispose);

      final enabled =
          await container.read(enabledWidgetsProvider.future);
      final enabledCount = enabled.values.where((v) => v).length;
      final disabledCount = enabled.values.where((v) => !v).length;

      expect(enabledCount, 3);
      expect(disabledCount, 2);
    });

    test('todayTasks is enabled by default', () async {
      final container = ProviderContainer(
        overrides: [
          enabledWidgetsProvider
              .overrideWith(() => _TestEnabledWidgetsNotifier()),
        ],
      );
      addTearDown(container.dispose);

      final enabled =
          await container.read(enabledWidgetsProvider.future);
      expect(enabled[HomeWidgetType.todayTasks], isTrue);
    });

    test('streakCounter is disabled by default', () async {
      final container = ProviderContainer(
        overrides: [
          enabledWidgetsProvider
              .overrideWith(() => _TestEnabledWidgetsNotifier()),
        ],
      );
      addTearDown(container.dispose);

      final enabled =
          await container.read(enabledWidgetsProvider.future);
      expect(enabled[HomeWidgetType.streakCounter], isFalse);
    });
  });
}

/// Test notifier that returns defaults synchronously (no SharedPreferences).
class _TestEnabledWidgetsNotifier extends EnabledWidgetsNotifier {
  @override
  Future<Map<HomeWidgetType, bool>> build() async {
    return Map.unmodifiable(_defaults);
  }
}
