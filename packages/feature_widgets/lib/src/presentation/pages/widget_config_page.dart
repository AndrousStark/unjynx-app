import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/core.dart';

import '../widgets/widget_preview_card.dart';

/// SharedPreferences key for persisted widget states.
const _prefsKey = 'unjynx_enabled_widgets';

/// Default widget enabled states.
const _defaults = <HomeWidgetType, bool>{
  HomeWidgetType.todayTasks: true,
  HomeWidgetType.dailyProgress: true,
  HomeWidgetType.quickAdd: true,
  HomeWidgetType.streakCounter: false,
  HomeWidgetType.upcomingDeadlines: false,
};

/// Notifier that persists widget toggle states via SharedPreferences.
class EnabledWidgetsNotifier extends AsyncNotifier<Map<HomeWidgetType, bool>> {
  @override
  Future<Map<HomeWidgetType, bool>> build() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList(_prefsKey);
    if (saved == null) return Map.unmodifiable(_defaults);

    final result = Map<HomeWidgetType, bool>.from(_defaults);
    for (final entry in saved) {
      final parts = entry.split(':');
      if (parts.length != 2) continue;
      final type = HomeWidgetType.values.where(
        (t) => t.name == parts[0],
      );
      if (type.isNotEmpty) {
        result[type.first] = parts[1] == '1';
      }
    }
    return Map.unmodifiable(result);
  }

  /// Toggle a widget type and persist immediately.
  Future<void> toggle(HomeWidgetType type, {required bool enabled}) async {
    final current = Map<HomeWidgetType, bool>.from(
      state.value ?? _defaults,
    );
    current[type] = enabled;
    state = AsyncData(Map.unmodifiable(current));

    final prefs = await SharedPreferences.getInstance();
    final encoded = current.entries
        .map((e) => '${e.key.name}:${e.value ? '1' : '0'}')
        .toList();
    await prefs.setStringList(_prefsKey, encoded);
  }
}

/// Provider tracking which widgets are enabled (persisted).
final enabledWidgetsProvider =
    AsyncNotifierProvider<EnabledWidgetsNotifier, Map<HomeWidgetType, bool>>(
  EnabledWidgetsNotifier.new,
);

/// Widget Configuration page.
///
/// Lists all 5 widget types (W1-W5) with preview cards,
/// toggle controls, and size information. Pro-only widgets
/// are marked and gated behind the subscription check.
class WidgetConfigPage extends ConsumerWidget {
  const WidgetConfigPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final enabledWidgetsAsync = ref.watch(enabledWidgetsProvider);
    final enabledWidgets = enabledWidgetsAsync.value ?? _defaults;

    return Scaffold(
      appBar: AppBar(title: const Text('Home Screen Widgets')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Info banner
          Card(
            elevation: 0,
            color: ux.infoWash,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: isLight
                  ? BorderSide(color: ux.info.withValues(alpha: 0.2))
                  : BorderSide.none,
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.widgets_rounded, size: 20, color: ux.info),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Add widgets from your home screen: '
                      'Long press home screen -> Widgets -> UNJYNX',
                      style: TextStyle(
                        fontSize: 13,
                        color: colorScheme.onSurface,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Widget list
          ...HomeWidgetType.values.map((type) {
            final isEnabled = enabledWidgets[type] ?? false;
            final isProOnly = type == HomeWidgetType.streakCounter ||
                type == HomeWidgetType.upcomingDeadlines;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: WidgetPreviewCard(
                widgetType: type,
                isEnabled: isEnabled,
                isProOnly: isProOnly,
                onToggle: (value) {
                  HapticFeedback.selectionClick();
                  ref.read(enabledWidgetsProvider.notifier).toggle(
                        type,
                        enabled: value,
                      );
                },
              ),
            );
          }),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
