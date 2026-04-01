import 'package:feature_sprints/src/presentation/pages/sprint_board_page.dart';
import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Sprint plugin for UNJYNX Plugin-Play architecture.
///
/// Provides agile sprint board, burndown charts, velocity tracking,
/// and retrospective workflows. Hidden from bottom nav (utility plugin).
class SprintPlugin implements UnjynxPlugin {
  @override
  String get id => 'sprints';

  @override
  String get name => 'Sprints';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {}

  @override
  List<PluginRoute> get routes => [
    PluginRoute(
      path: '/sprints',
      builder: () => const SprintBoardPage(),
      label: 'Sprints',
      icon: Icons.directions_run_rounded,
      sortOrder: -99, // Hidden from bottom nav
    ),
  ];

  @override
  Future<void> dispose() async {}
}
