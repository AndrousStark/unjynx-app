import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/models/sprint.dart';
import '../providers/sprint_providers.dart';

/// Main sprint board page showing all sprints for a project.
///
/// Displays the active sprint prominently, with planning/completed
/// sprints listed below. Tabs for Board / Burndown / Velocity.
class SprintBoardPage extends ConsumerWidget {
  const SprintBoardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final sprintsAsync = ref.watch(sprintsProvider);
    final activeAsync = ref.watch(activeSprintProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sprints'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.bar_chart_rounded),
            tooltip: 'Velocity',
            onPressed: () => context.push('/sprints/velocity'),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/sprints/create'),
        child: const Icon(Icons.add_rounded),
      ),
      body: sprintsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text(
            'Failed to load sprints',
            style: theme.textTheme.bodyMedium,
          ),
        ),
        data: (sprints) {
          if (sprints.isEmpty) {
            return _EmptyState(colorScheme: colorScheme, theme: theme);
          }

          final active = activeAsync.value;
          final planning = sprints
              .where((s) => s.status == SprintStatus.planning)
              .toList();
          final completed = sprints
              .where((s) => s.status == SprintStatus.completed)
              .toList();

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(sprintsProvider);
              ref.invalidate(activeSprintProvider);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Active sprint card
                if (active != null) ...[
                  Text(
                    'Active Sprint',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _SprintCard(sprint: active, isActive: true),
                  const SizedBox(height: 24),
                ],

                // Planning sprints
                if (planning.isNotEmpty) ...[
                  Text(
                    'Planning',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 8),
                  for (final sprint in planning) ...[
                    _SprintCard(sprint: sprint),
                    const SizedBox(height: 8),
                  ],
                  const SizedBox(height: 16),
                ],

                // Completed sprints
                if (completed.isNotEmpty) ...[
                  Text(
                    'Completed',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 8),
                  for (final sprint in completed) ...[
                    _SprintCard(sprint: sprint),
                    const SizedBox(height: 8),
                  ],
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SprintCard extends StatelessWidget {
  final Sprint sprint;
  final bool isActive;

  const _SprintCard({required this.sprint, this.isActive = false});

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

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        GoRouter.of(context).push('/sprints/${sprint.id}');
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isActive
              ? colorScheme.primaryContainer.withValues(alpha: 0.3)
              : colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isActive
                ? colorScheme.primary.withValues(alpha: 0.3)
                : colorScheme.outlineVariant.withValues(alpha: 0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    sprint.name,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    sprint.status.name.toUpperCase(),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
            if (sprint.goal != null) ...[
              const SizedBox(height: 4),
              Text(
                sprint.goal!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 12),
            // Progress bar
            if (sprint.committedPoints > 0) ...[
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: sprint.completionRate.clamp(0, 1),
                        minHeight: 6,
                        backgroundColor: colorScheme.outlineVariant.withValues(
                          alpha: 0.3,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${sprint.completedPoints}/${sprint.committedPoints} pts',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
            if (sprint.hasRetro) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.rate_review_rounded,
                    size: 14,
                    color: colorScheme.primary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Retro completed',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _EmptyState({required this.colorScheme, required this.theme});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.directions_run_rounded,
              size: 64,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No sprints yet',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Create your first sprint to start tracking\nwork in focused iterations.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
