import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/export_page.dart';
import 'presentation/pages/import_page.dart';

/// Import/Export plugin for UNJYNX Plugin-Play architecture.
///
/// Provides:
///   /import -> Multi-step import wizard
///   /export -> Export format selection and download
class ImportExportPlugin implements UnjynxPlugin {
  @override
  String get id => 'import_export';

  @override
  String get name => 'Import & Export';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed at this stage.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/import',
          builder: () => const ImportPage(),
          label: 'Import',
          icon: Icons.upload_file_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/export',
          builder: () => const ExportPage(),
          label: 'Export',
          icon: Icons.download_rounded,
          sortOrder: -1,
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
