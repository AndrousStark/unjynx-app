import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/widget_config_page.dart';

/// Widget configuration plugin for UNJYNX Plugin-Play architecture.
///
/// Provides:
///   /widgets -> Home screen widget configuration
class WidgetsPlugin implements UnjynxPlugin {
  @override
  String get id => 'widgets';

  @override
  String get name => 'Widgets';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed at this stage.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/widgets',
          builder: () => const WidgetConfigPage(),
          label: 'Widgets',
          icon: Icons.widgets_rounded,
          sortOrder: -1,
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
