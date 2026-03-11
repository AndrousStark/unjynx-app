import 'package:feature_home/src/presentation/pages/home_page.dart';
import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Home Hub plugin implementation for UNJYNX Plugin-Play architecture.
///
/// Provides the main command center of the app, displayed as the first
/// tab in navigation (sortOrder: -1).
class HomePlugin implements UnjynxPlugin {
  @override
  String get id => 'home';

  @override
  String get name => 'Hub';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {}

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/home',
          builder: () => const HomePage(),
          label: 'Hub',
          icon: Icons.home_rounded,
          sortOrder: -1, // First tab (before todos at 0)
        ),
      ];

  @override
  Future<void> dispose() async {}
}
