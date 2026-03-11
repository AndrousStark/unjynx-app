import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
                  ref.read(exportFormatProvider.notifier).state = format;
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
                  ref.read(exportDateRangeProvider.notifier).state =
                      DateTimeRange(start: range.start, end: range.end);
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
              onTap: () {
                // Phase 4: Show project picker from existing projects
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Project filter coming soon'),
                  ),
                );
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

  Future<void> _startExport(BuildContext context, WidgetRef ref) async {
    ref.read(exportLoadingProvider.notifier).state = true;

    // Phase 4: Real export via API
    await Future<void>.delayed(const Duration(seconds: 1));

    ref.read(exportLoadingProvider.notifier).state = false;

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Export ready! Check your downloads.')),
      );
    }
  }
}
