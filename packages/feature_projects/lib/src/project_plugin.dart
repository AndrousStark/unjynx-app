import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/create_edit_project_page.dart';
import 'presentation/pages/enhanced_project_list_page.dart';
import 'presentation/pages/project_list_page.dart';
import 'presentation/pages/workspace_page.dart';

/// Project plugin for UNJYNX Plugin-Play architecture.
///
/// Provides:
///   /projects           -> E1: Enhanced project list (sectioned)
///   /projects/create    -> E3: Create project (full page)
///   /projects/workspace -> E4: Workspace (team plan)
class ProjectPlugin implements UnjynxPlugin {
  @override
  String get id => 'projects';

  @override
  String get name => 'Projects';

  @override
  String get version => '0.2.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed yet.
    // Phase 2: Listen for ProjectCreated events for gamification.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/projects',
          builder: () => const EnhancedProjectListPage(),
          label: 'Projects',
          icon: Icons.folder_outlined,
          sortOrder: 1,
        ),
        PluginRoute(
          path: '/projects/create',
          builder: () => const CreateEditProjectPage(),
          label: 'New Project',
          icon: Icons.create_new_folder_outlined,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/projects/workspace',
          builder: () => const WorkspacePage(),
          label: 'Workspace',
          icon: Icons.business_rounded,
          sortOrder: -1,
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
