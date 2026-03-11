import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/accountability_page.dart';
import 'presentation/pages/game_mode_page.dart';
import 'presentation/pages/progress_dashboard_page.dart';

/// Gamification plugin for UNJYNX Plugin-Play architecture.
///
/// Provides the gamification flow:
///   /gamification/dashboard     -> I2: Progress Dashboard (charts)
///   /gamification/accountability -> I3: Accountability partners
///   /gamification/game-mode     -> I4: XP, achievements, leaderboard
class GamificationPlugin implements UnjynxPlugin {
  @override
  String get id => 'gamification';

  @override
  String get name => 'Gamification';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed at this stage.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/gamification/dashboard',
          builder: () => const ProgressDashboardPage(),
          label: 'Dashboard',
          icon: Icons.bar_chart_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/gamification/accountability',
          builder: () => const AccountabilityPage(),
          label: 'Accountability',
          icon: Icons.people_outline_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/gamification/game-mode',
          builder: () => const GameModePage(),
          label: 'Game Mode',
          icon: Icons.sports_esports_rounded,
          sortOrder: 7,
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
