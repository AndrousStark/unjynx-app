import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/import_preview.dart';
import '../providers/import_export_providers.dart';
import '../widgets/column_mapping_row.dart';
import '../widgets/import_progress_bar.dart';
import '../widgets/import_summary_card.dart';
import '../widgets/source_card.dart';

/// Multi-step import page.
///
/// Flow: Select source -> Upload file -> Preview -> Column mapping -> Execute -> Summary.
class ImportPage extends ConsumerWidget {
  const ImportPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final step = ref.watch(importFlowProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Import Tasks'),
        leading: step != ImportStep.selectSource
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () {
                  if (step == ImportStep.summary ||
                      step == ImportStep.selectSource) {
                    Navigator.of(context).pop();
                  } else {
                    ref.read(importFlowProvider.notifier).reset();
                  }
                },
              )
            : null,
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: switch (step) {
          ImportStep.selectSource => _SourceSelection(key: const ValueKey('source')),
          ImportStep.upload => _UploadStep(key: const ValueKey('upload')),
          ImportStep.preview => _PreviewStep(key: const ValueKey('preview')),
          ImportStep.mapping => _MappingStep(key: const ValueKey('mapping')),
          ImportStep.executing => _ExecutingStep(key: const ValueKey('executing')),
          ImportStep.summary => _SummaryStep(key: const ValueKey('summary')),
        },
      ),
    );
  }
}

class _SourceSelection extends ConsumerWidget {
  const _SourceSelection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: StaggeredColumn(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Where are your tasks?',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Select the app you want to import from',
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 20),
          ...ImportSource.values.map(
            (source) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: SourceCard(
                source: source,
                onTap: () {
                  HapticFeedback.lightImpact();
                  ref.read(importFlowProvider.notifier).selectSource(source);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UploadStep extends ConsumerWidget {
  const _UploadStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final source = ref.watch(importSourceProvider);

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Upload ${source?.displayName ?? ''} Export',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Select the CSV or export file from your device',
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 32),

          // Upload area
          GestureDetector(
            onTap: () async {
              try {
                final result = await FilePicker.platform.pickFiles(
                  type: FileType.custom,
                  allowedExtensions: ['csv', 'json', 'ics'],
                );
                if (result != null && result.files.single.path != null) {
                  ref.read(importFlowProvider.notifier).uploadFile(
                    result.files.single.path!,
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to pick file: $e'),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  );
                }
              }
            },
            child: Container(
              height: 180,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: colorScheme.primary.withValues(alpha: 0.3),
                  width: 2,
                ),
                color: colorScheme.primary.withValues(
                  alpha: isLight ? 0.04 : 0.06,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.cloud_upload_rounded,
                    size: 48,
                    color: colorScheme.primary.withValues(
                      alpha: isLight ? 0.6 : 0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Tap to select file',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'CSV, JSON, or ICS files supported',
                    style: TextStyle(
                      fontSize: 13,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PreviewStep extends ConsumerWidget {
  const _PreviewStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final preview = ref.watch(importPreviewProvider);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Preview',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${preview?.totalRows ?? 0} tasks found',
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),

          // Sample tasks preview
          Expanded(
            child: preview == null || preview.sampleTasks.isEmpty
                ? Center(
                    child: Text(
                      'No tasks parsed. Check your file format.',
                      style: TextStyle(
                        fontSize: 14,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  )
                : ListView.separated(
                    itemCount: preview.sampleTasks.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final task = preview.sampleTasks[index];
                      return ListTile(
                        title: Text(
                          task['title'] ?? 'Untitled',
                          style: TextStyle(
                            color: colorScheme.onSurface,
                          ),
                        ),
                        subtitle: task['description'] != null
                            ? Text(
                                task['description']!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: colorScheme.onSurfaceVariant,
                                ),
                              )
                            : null,
                      );
                    },
                  ),
          ),
          const SizedBox(height: 16),

          ElevatedButton(
            onPressed: () {
              ref.read(importFlowProvider.notifier).proceedToMapping();
            },
            child: const Text('Configure Mapping'),
          ),
        ],
      ),
    );
  }
}

class _MappingStep extends ConsumerWidget {
  const _MappingStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final mapping = ref.watch(columnMappingProvider);
    final preview = ref.watch(importPreviewProvider);

    // Get source columns from preview or use defaults
    final sourceColumns = preview?.sampleTasks.isNotEmpty == true
        ? preview!.sampleTasks.first.keys.toList()
        : <String>['Column 1', 'Column 2', 'Column 3'];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Map Columns',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Map source columns to UNJYNX fields',
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),

          Expanded(
            child: ListView(
              children: sourceColumns.map((col) {
                return ColumnMappingRow(
                  sourceColumn: col,
                  currentMapping: mapping[col],
                  onChanged: (target) {
                    final newMapping = Map<String, String>.from(mapping);
                    if (target == null) {
                      newMapping.remove(col);
                    } else {
                      newMapping[col] = target;
                    }
                    ref.read(columnMappingProvider.notifier).set(newMapping);
                  },
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),

          ElevatedButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              ref.read(importFlowProvider.notifier).executeImport();
            },
            child: const Text('Start Import'),
          ),
        ],
      ),
    );
  }
}

class _ExecutingStep extends ConsumerWidget {
  const _ExecutingStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progress = ref.watch(importProgressProvider);

    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ImportProgressBar(
            progress: progress,
            label: 'Importing your tasks...',
          ),
        ],
      ),
    );
  }
}

class _SummaryStep extends ConsumerWidget {
  const _SummaryStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final result = ref.watch(importResultProvider);

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (result != null) ImportSummaryCard(result: result),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              ref.read(importFlowProvider.notifier).reset();
              Navigator.of(context).pop();
            },
            child: const Text('Done'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () {
              ref.read(importFlowProvider.notifier).reset();
            },
            child: const Text('Import More'),
          ),
        ],
      ),
    );
  }
}
