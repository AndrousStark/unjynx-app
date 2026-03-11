import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../widgets/widget_preview_card.dart';

/// Provider tracking which widgets are enabled.
final enabledWidgetsProvider =
    StateProvider<Map<HomeWidgetType, bool>>((_) => {
          HomeWidgetType.todayTasks: true,
          HomeWidgetType.dailyProgress: true,
          HomeWidgetType.quickAdd: true,
          HomeWidgetType.streakCounter: false,
          HomeWidgetType.upcomingDeadlines: false,
        });

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
    final enabledWidgets = ref.watch(enabledWidgetsProvider);

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
                  final updated = Map<HomeWidgetType, bool>.from(
                    ref.read(enabledWidgetsProvider),
                  );
                  updated[type] = value;
                  ref.read(enabledWidgetsProvider.notifier).state = updated;
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
