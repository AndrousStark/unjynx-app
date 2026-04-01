import 'package:feature_goals/src/presentation/pages/goal_tree_page.dart';
import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Goals plugin for UNJYNX Plugin-Play architecture.
///
/// Provides hierarchical goal management (company → team → individual),
/// progress tracking, and task linkage. Hidden from bottom nav.
class GoalPlugin implements UnjynxPlugin {
  @override
  String get id => 'goals';

  @override
  String get name => 'Goals';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {}

  @override
  List<PluginRoute> get routes => [
    PluginRoute(
      path: '/goals',
      builder: () => const GoalTreePage(),
      label: 'Goals',
      icon: Icons.flag_rounded,
      sortOrder: -99, // Hidden from bottom nav
    ),
  ];

  @override
  Future<void> dispose() async {}
}
