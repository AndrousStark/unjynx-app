import 'package:feature_home/src/domain/models/home_models.dart';
import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// Step 4: Day Preview (top 3 tasks)
///
/// Shows the user's top 3 incomplete tasks for today, fetched from
/// [homeTodayTasksProvider]. Displays an encouraging empty state when
/// there are no tasks scheduled.
class DayPreviewStep extends StatelessWidget {
  const DayPreviewStep({super.key, required this.ref});

  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final tasksAsync = ref.watch(homeTodayTasksProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.checklist_rounded,
            size: 44,
            color: ux.success,
          ),
          const SizedBox(height: 24),

          Text(
            "Today's Priorities",
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 8),

          Text(
            'Your most important tasks for today',
            style: TextStyle(
              fontSize: 15,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 32),

          tasksAsync.when(
            data: (tasks) {
              final incomplete = tasks
                  .where((t) => !t.isCompleted)
                  .take(3)
                  .toList(growable: false);

              if (incomplete.isEmpty) {
                return Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: colorScheme.surface,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.celebration_rounded,
                        size: 36,
                        color: ux.gold.withValues(alpha: 0.6),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'No tasks for today yet!',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'A clean slate to create something great.',
                        style: TextStyle(
                          fontSize: 13,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                );
              }

              return Column(
                children: [
                  for (var i = 0; i < incomplete.length; i++) ...[
                    if (i > 0) const SizedBox(height: 10),
                    TaskPreviewTile(
                      task: incomplete[i],
                      index: i + 1,
                    ),
                  ],
                ],
              );
            },
            loading: () => CircularProgressIndicator(
              color: ux.success,
              strokeWidth: 2,
            ),
            error: (_, __) => Text(
              'Could not load tasks.',
              style: TextStyle(
                color: colorScheme.onSurfaceVariant,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Task preview tile for the day preview step
// ---------------------------------------------------------------------------

/// A compact row showing a single task with a priority dot and index badge.
class TaskPreviewTile extends StatelessWidget {
  const TaskPreviewTile({
    super.key,
    required this.task,
    required this.index,
  });

  final HomeTask task;
  final int index;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
        ),
      ),
      child: Row(
        children: [
          // Priority dot
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: unjynxPriorityColor(context, task.priority.name),
            ),
          ),

          const SizedBox(width: 14),

          // Task title
          Expanded(
            child: Text(
              task.title,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: colorScheme.onSurface,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),

          // Index badge
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: colorScheme.surfaceContainerHigh,
            ),
            child: Center(
              child: Text(
                '$index',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
