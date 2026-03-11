import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/settings_page.dart';

/// Settings plugin for UNJYNX Plugin-Play architecture.
class SettingsPlugin implements UnjynxPlugin {
  @override
  String get id => 'settings';

  @override
  String get name => 'Settings';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed for settings.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/settings',
          builder: () => const SettingsPage(),
          label: 'Settings',
          icon: Icons.settings_outlined,
          sortOrder: 10, // Last in nav bar
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
