import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';

import '../../domain/models/sprint.dart';
import '../providers/sprint_providers.dart';

/// Detail page for a single sprint.
///
/// Shows sprint info, task list, burndown chart, and retrospective.
class SprintDetailPage extends ConsumerWidget {
  const SprintDetailPage({required this.sprintId, super.key});

  final String sprintId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final burndownAsync = ref.watch(burndownProvider(sprintId));

    // Find sprint from the loaded list.
    final sprints = ref.watch(sprintsProvider).value ?? [];
    final sprint = sprints.where((s) => s.id == sprintId).firstOrNull;

    return Scaffold(
      appBar: AppBar(
        title: Text(sprint?.name ?? 'Sprint'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (sprint != null && sprint.status == SprintStatus.planning)
            TextButton(
              onPressed: () => _startSprint(context, ref),
              child: const Text('Start'),
            ),
          if (sprint != null && sprint.status == SprintStatus.active)
            TextButton(
              onPressed: () => _completeSprint(context, ref),
              child: const Text('Complete'),
            ),
        ],
      ),
      body: sprint == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(sprintsProvider);
                ref.invalidate(burndownProvider(sprintId));
              },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Status + progress
                  _SprintHeader(sprint: sprint),
                  const SizedBox(height: 20),

                  // Goal
                  if (sprint.goal != null) ...[
                    Text(
                      'Goal',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      sprint.goal!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Burndown chart placeholder
                  Text(
                    'Burndown',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  burndownAsync.when(
                    loading: () => const SizedBox(
                      height: 160,
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (_, __) => const SizedBox(
                      height: 160,
                      child: Center(child: Text('Failed to load burndown')),
                    ),
                    data: (entries) => _BurndownChart(
                      entries: entries,
                      colorScheme: colorScheme,
                      theme: theme,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Retrospective
                  if (sprint.hasRetro) ...[
                    Text(
                      'Retrospective',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (sprint.retroWentWell != null)
                      _RetroSection(
                        label: 'Went Well',
                        icon: Icons.thumb_up_rounded,
                        color: Colors.green,
                        text: sprint.retroWentWell!,
                      ),
                    if (sprint.retroToImprove != null)
                      _RetroSection(
                        label: 'To Improve',
                        icon: Icons.construction_rounded,
                        color: Colors.orange,
                        text: sprint.retroToImprove!,
                      ),
                    if (sprint.retroActionItems.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Action Items',
                        style: theme.textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      for (final item in sprint.retroActionItems)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(
                                Icons.check_box_outline_blank_rounded,
                                size: 16,
                                color: colorScheme.primary,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  item,
                                  style: theme.textTheme.bodySmall,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ],

                  // Save retro button (if completed and no retro yet)
                  if (sprint.status == SprintStatus.completed &&
                      !sprint.hasRetro) ...[
                    const SizedBox(height: 20),
                    OutlinedButton.icon(
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        _showRetroSheet(context, ref);
                      },
                      icon: const Icon(Icons.rate_review_rounded),
                      label: const Text('Write Retrospective'),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Future<void> _startSprint(BuildContext context, WidgetRef ref) async {
    HapticFeedback.mediumImpact();
    try {
      final api = ref.read(sprintApiProvider);
      await api.startSprint(sprintId);
      ref.invalidate(sprintsProvider);
      ref.invalidate(activeSprintProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Sprint started')));
      }
    } on DioException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed: ${e.message}')));
      }
    }
  }

  Future<void> _completeSprint(BuildContext context, WidgetRef ref) async {
    HapticFeedback.mediumImpact();
    try {
      final api = ref.read(sprintApiProvider);
      await api.completeSprint(sprintId);
      ref.invalidate(sprintsProvider);
      ref.invalidate(activeSprintProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Sprint completed')));
      }
    } on DioException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed: ${e.message}')));
      }
    }
  }

  void _showRetroSheet(BuildContext context, WidgetRef ref) {
    final wentWellCtl = TextEditingController();
    final toImproveCtl = TextEditingController();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Sprint Retrospective',
              style: Theme.of(
                ctx,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: wentWellCtl,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'What went well?',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: toImproveCtl,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'What to improve?',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () async {
                HapticFeedback.mediumImpact();
                try {
                  final api = ref.read(sprintApiProvider);
                  await api.saveRetro(
                    sprintId,
                    wentWell: wentWellCtl.text.trim().isEmpty
                        ? null
                        : wentWellCtl.text.trim(),
                    toImprove: toImproveCtl.text.trim().isEmpty
                        ? null
                        : toImproveCtl.text.trim(),
                  );
                  ref.invalidate(sprintsProvider);
                  if (ctx.mounted) Navigator.pop(ctx);
                } on DioException {
                  // Swallow.
                }
              },
              child: const Text('Save Retrospective'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SprintHeader extends StatelessWidget {
  final Sprint sprint;

  const _SprintHeader({required this.sprint});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final statusColor = switch (sprint.status) {
      SprintStatus.active => colorScheme.primary,
      SprintStatus.completed => Colors.green,
      SprintStatus.cancelled => colorScheme.error,
      SprintStatus.planning => colorScheme.onSurfaceVariant,
    };

    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            sprint.status.name.toUpperCase(),
            style: theme.textTheme.labelSmall?.copyWith(
              color: statusColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(width: 12),
        if (sprint.committedPoints > 0)
          Text(
            '${sprint.completedPoints}/${sprint.committedPoints} pts',
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        const Spacer(),
        if (sprint.startDate != null)
          Text(
            '${sprint.startDate!.day}/${sprint.startDate!.month} — ${sprint.endDate?.day ?? '?'}/${sprint.endDate?.month ?? '?'}',
            style: theme.textTheme.labelSmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
      ],
    );
  }
}

class _BurndownChart extends StatelessWidget {
  final List<BurndownEntry> entries;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _BurndownChart({
    required this.entries,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return Container(
        height: 120,
        decoration: BoxDecoration(
          color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Text(
            'Burndown data will appear once the sprint starts.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    // Simple bar representation of burndown points.
    final maxPoints = entries
        .map((e) => e.totalPoints)
        .fold<int>(0, (a, b) => a > b ? a : b);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final entry in entries) ...[
            Row(
              children: [
                SizedBox(
                  width: 40,
                  child: Text(
                    '${entry.capturedAt.day}/${entry.capturedAt.month}',
                    style: theme.textTheme.labelSmall?.copyWith(fontSize: 9),
                  ),
                ),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(
                      value: maxPoints > 0
                          ? entry.remainingPoints / maxPoints
                          : 0,
                      minHeight: 8,
                      backgroundColor: colorScheme.outlineVariant.withValues(
                        alpha: 0.2,
                      ),
                      color: colorScheme.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                SizedBox(
                  width: 24,
                  child: Text(
                    '${entry.remainingPoints}',
                    style: theme.textTheme.labelSmall,
                    textAlign: TextAlign.end,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
          ],
        ],
      ),
    );
  }
}

class _RetroSection extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final String text;

  const _RetroSection({
    required this.label,
    required this.icon,
    required this.color,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
                Text(text, style: theme.textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
