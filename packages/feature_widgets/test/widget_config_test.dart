import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:feature_widgets/feature_widgets.dart';

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
    test('defaults to 3 enabled and 2 disabled', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final enabled = container.read(enabledWidgetsProvider);
      final enabledCount = enabled.values.where((v) => v).length;
      final disabledCount = enabled.values.where((v) => !v).length;

      expect(enabledCount, 3);
      expect(disabledCount, 2);
    });

    test('todayTasks is enabled by default', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final enabled = container.read(enabledWidgetsProvider);
      expect(enabled[HomeWidgetType.todayTasks], isTrue);
    });

    test('streakCounter is disabled by default', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final enabled = container.read(enabledWidgetsProvider);
      expect(enabled[HomeWidgetType.streakCounter], isFalse);
    });
  });
}
