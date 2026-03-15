import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/async_standup_page.dart';
import 'presentation/pages/shared_project_page.dart';
import 'presentation/pages/team_dashboard_page.dart';
import 'presentation/pages/team_members_page.dart';
import 'presentation/pages/team_reports_page.dart';

/// Team management plugin for UNJYNX Plugin-Play architecture.
///
/// Provides the full team collaboration flow:
///   /team                -> N1: Team dashboard
///   /team/members        -> N2: Member management
///   /team/shared-project -> N3: Shared project view
///   /team/reports        -> N4: Team reports
///   /team/standup        -> N5: Async standup
class TeamPlugin implements UnjynxPlugin {
  @override
  String get id => 'team';

  @override
  String get name => 'Team';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed at this stage.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/team',
          builder: () => const TeamDashboardPage(),
          label: 'Team',
          icon: Icons.groups_rounded,
          sortOrder: 6,
        ),
        PluginRoute(
          path: '/team/members',
          builder: () => const TeamMembersPage(),
          label: 'Members',
          icon: Icons.people_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/team/shared-project',
          builder: () => const SharedProjectPage(),
          label: 'Shared Project',
          icon: Icons.folder_shared_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/team/reports',
          builder: () => const TeamReportsPage(),
          label: 'Reports',
          icon: Icons.analytics_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/team/standup',
          builder: () => const AsyncStandupPage(),
          label: 'Standup',
          icon: Icons.record_voice_over_rounded,
          sortOrder: -1,
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
