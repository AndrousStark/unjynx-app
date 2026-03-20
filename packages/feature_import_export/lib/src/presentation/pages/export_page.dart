import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:service_api/service_api.dart';
import 'package:share_plus/share_plus.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/export_format.dart';
import '../providers/import_export_providers.dart';
import '../widgets/export_format_card.dart';

/// Export page for downloading task data in various formats.
///
/// Supports CSV, JSON (GDPR), and ICS formats with optional
/// date range and project filters.
class ExportPage extends ConsumerWidget {
  const ExportPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final selectedFormat = ref.watch(exportFormatProvider);
    final isLoading = ref.watch(exportLoadingProvider);
    final projectFilter = ref.watch(exportProjectFilterProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Export Tasks')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Format selection
          Text(
            'Export Format',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          ...ExportFormat.values.map(
            (format) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ExportFormatCard(
                format: format,
                isSelected: selectedFormat == format,
                onTap: () {
                  HapticFeedback.lightImpact();
                  ref.read(exportFormatProvider.notifier).set(format);
                },
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Filters section
          Text(
            'Filters (Optional)',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 12),

          // Date range filter
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: isLight
                  ? BorderSide(
                      color: colorScheme.primary.withValues(alpha: 0.1),
                    )
                  : BorderSide.none,
            ),
            child: ListTile(
              leading: Icon(
                Icons.date_range_rounded,
                color: colorScheme.primary,
              ),
              title: const Text('Date Range'),
              subtitle: Text(
                'All time',
                style: TextStyle(
                  fontSize: 13,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () async {
                final range = await showDateRangePicker(
                  context: context,
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (range != null) {
                  ref.read(exportDateRangeProvider.notifier).set(
                    DateTimeRange(start: range.start, end: range.end),
                  );
                }
              },
            ),
          ),
          const SizedBox(height: 8),

          // Project filter
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: isLight
                  ? BorderSide(
                      color: colorScheme.primary.withValues(alpha: 0.1),
                    )
                  : BorderSide.none,
            ),
            child: ListTile(
              leading: Icon(
                Icons.folder_outlined,
                color: colorScheme.primary,
              ),
              title: const Text('Project'),
              subtitle: Text(
                projectFilter ?? 'All projects',
                style: TextStyle(
                  fontSize: 13,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () async {
                final selected = await _showProjectPicker(context, ref);
                if (selected != null) {
                  ref.read(exportProjectFilterProvider.notifier).set(
                    selected.isEmpty ? null : selected,
                  );
                }
              },
            ),
          ),
          const SizedBox(height: 24),

          // Download button
          ElevatedButton.icon(
            onPressed: selectedFormat == null || isLoading
                ? null
                : () {
                    HapticFeedback.mediumImpact();
                    _startExport(context, ref);
                  },
            icon: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.download_rounded),
            label: Text(isLoading ? 'Exporting...' : 'Download'),
          ),
          const SizedBox(height: 24),

          // GDPR card
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
              padding: const EdgeInsets.all(14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.privacy_tip_rounded, size: 20, color: ux.info),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'GDPR Data Request',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Under GDPR/DPDP, you can request a full export of '
                          'all your data. Use JSON format for a complete dump. '
                          'Processing may take up to 72 hours for large datasets.',
                          style: TextStyle(
                            fontSize: 13,
                            color: colorScheme.onSurface.withValues(
                              alpha: isLight ? 0.7 : 0.6,
                            ),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  /// Builds a filename based on the export format and current date.
  String _exportFilename(ExportFormat format) {
    final date = DateTime.now().toIso8601String().split('T').first;
    final extension = switch (format) {
      ExportFormat.csv => 'csv',
      ExportFormat.json => 'json',
      ExportFormat.ics => 'ics',
    };
    return 'unjynx-export-$date.$extension';
  }

  /// Converts the raw API response data into a string suitable for writing
  /// to a file.
  String _encodeExportData(dynamic data, ExportFormat format) {
    if (data is String) return data;
    if (format == ExportFormat.json) {
      return const JsonEncoder.withIndent('  ').convert(data);
    }
    return data.toString();
  }

  /// Executes the export: calls the API, writes to a temp file, and shares it.
  Future<void> _startExport(BuildContext context, WidgetRef ref) async {
    ref.read(exportLoadingProvider.notifier).set(true);

    try {
      // Invalidate previous result so the provider re-fetches
      ref.invalidate(exportProvider);
      final result = await ref.read(exportProvider.future);

      if (!context.mounted) return;

      if (result == null) {
        final error = ref.read(exportErrorProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error ?? 'Export failed. Please try again.'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
        return;
      }

      final format = ref.read(exportFormatProvider)!;
      final filename = _exportFilename(format);
      final content = _encodeExportData(result, format);

      // Write to temp directory
      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/$filename');
      await file.writeAsString(content, flush: true);

      if (!context.mounted) return;

      // Share the file via the system share sheet
      final xFile = XFile(file.path);
      await Share.shareXFiles(
        [xFile],
        subject: 'UNJYNX Export - $filename',
      );
    } on DioException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Network error: ${e.message ?? 'Connection failed'}',
            ),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } on ApiException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Export failed: $e'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } finally {
      ref.read(exportLoadingProvider.notifier).set(false);
    }
  }

  /// Shows a dialog for picking a project to filter exports by.
  ///
  /// Returns the selected project name, an empty string to clear the filter,
  /// or null if the dialog was dismissed.
  Future<String?> _showProjectPicker(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final colorScheme = Theme.of(context).colorScheme;

    // Try to fetch projects from the API
    ProjectApiService? projectApi;
    try {
      projectApi = ref.read(projectApiProvider);
    } catch (_) {
      // Provider not overridden
    }

    List<String> projectNames = [];
    String? fetchError;

    if (projectApi != null) {
      try {
        final response = await projectApi.getProjects();
        if (response.success && response.data != null) {
          projectNames = (response.data!)
              .map((item) {
                if (item is Map<String, dynamic>) {
                  return item['name']?.toString() ?? '';
                }
                return '';
              })
              .where((name) => name.isNotEmpty)
              .toList();
        }
      } on DioException {
        fetchError = 'Could not load projects. Check your connection.';
      } on ApiException catch (e) {
        fetchError = e.message;
      }
    } else {
      fetchError = 'Project service unavailable.';
    }

    if (!context.mounted) return null;

    return showDialog<String>(
      context: context,
      builder: (dialogContext) {
        return SimpleDialog(
          title: Text(
            'Select Project',
            style: TextStyle(color: colorScheme.onSurface),
          ),
          children: [
            // "All projects" option to clear filter
            SimpleDialogOption(
              onPressed: () => Navigator.pop(dialogContext, ''),
              child: Row(
                children: [
                  Icon(
                    Icons.all_inclusive_rounded,
                    color: colorScheme.primary,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'All projects',
                    style: TextStyle(
                      color: colorScheme.onSurface,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            if (fetchError != null)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 8,
                ),
                child: Text(
                  fetchError,
                  style: TextStyle(
                    fontSize: 13,
                    color: colorScheme.error,
                  ),
                ),
              ),
            ...projectNames.map(
              (name) => SimpleDialogOption(
                onPressed: () => Navigator.pop(dialogContext, name),
                child: Row(
                  children: [
                    Icon(
                      Icons.folder_outlined,
                      color: colorScheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        name,
                        style: TextStyle(color: colorScheme.onSurface),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
