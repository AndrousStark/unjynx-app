import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Section showing today's tasks organized into three groups:
/// - **Overdue** (error red accent): tasks where dueDate < today
/// - **Today**: tasks where dueDate == today, sorted by time then priority
/// - **No Date**: tasks where dueDate == null
///
/// Each task row features a circular checkbox, title, and trailing metadata
/// (project color dot, priority flag, due time). Tapping navigates to
/// `/todos/:id` via GoRouter.
class TodayTasksSection extends ConsumerWidget {
  const TodayTasksSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final tasksAsync = ref.watch(homeTodayTasksProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // --- Header with task count badge ---
        tasksAsync.when(
          data: (tasks) => _SectionHeader(
            taskCount: tasks.where((t) => !t.isCompleted).length,
          ),
          loading: () => const _SectionHeader(taskCount: 0),
          error: (_, __) => const _SectionHeader(taskCount: 0),
        ),

        const SizedBox(height: 12),

        // --- Task list ---
        tasksAsync.when(
          data: (tasks) =>
              tasks.isEmpty ? const _EmptyState() : _TaskGroups(tasks: tasks),
          loading: () => const _TasksShimmer(),
          error: (error, _) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(
              'Failed to load tasks: $error',
              style: TextStyle(color: colorScheme.error, fontSize: 13),
            ),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Section header with task count badge
// ---------------------------------------------------------------------------

class _SectionHeader extends ConsumerWidget {
  const _SectionHeader({required this.taskCount});

  final int taskCount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    final tasksLabel = unjynxLabelWidget(ref, 'Tasks');

    return Row(
      children: [
        Text(
          "Today's $tasksLabel",
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: colorScheme.onSurface,
                fontWeight: FontWeight.bold,
              ),
        ),
        if (taskCount > 0) ...[
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: colorScheme.primary
                  .withValues(alpha: isLight ? 0.12 : 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$taskCount',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: colorScheme.primary,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Task groups: overdue, today, no date
// ---------------------------------------------------------------------------

class _TaskGroups extends StatelessWidget {
  const _TaskGroups({required this.tasks});

  final List<HomeTask> tasks;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final tomorrowStart = todayStart.add(const Duration(days: 1));

    final overdue = <HomeTask>[];
    final today = <HomeTask>[];
    final noDate = <HomeTask>[];

    for (final task in tasks) {
      if (task.isCompleted) continue;

      if (task.dueDate == null) {
        noDate.add(task);
      } else if (task.dueDate!.isBefore(todayStart)) {
        overdue.add(task);
      } else if (task.dueDate!.isBefore(tomorrowStart)) {
        today.add(task);
      } else {
        // Future tasks — skip, they belong in the upcoming section.
        continue;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (overdue.isNotEmpty)
          _TaskGroup(
            label: 'Overdue',
            labelColor: colorScheme.error,
            tasks: overdue,
          ),
        if (today.isNotEmpty) ...[
          if (overdue.isNotEmpty) const SizedBox(height: 16),
          _TaskGroup(
            label: 'Today',
            labelColor: colorScheme.onSurface,
            tasks: today,
          ),
        ],
        if (noDate.isNotEmpty) ...[
          if (overdue.isNotEmpty || today.isNotEmpty)
            const SizedBox(height: 16),
          _TaskGroup(
            label: 'No Date',
            labelColor: colorScheme.onSurfaceVariant,
            tasks: noDate,
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Task group (label + task rows)
// ---------------------------------------------------------------------------

class _TaskGroup extends ConsumerWidget {
  const _TaskGroup({
    required this.label,
    required this.labelColor,
    required this.tasks,
  });

  final String label;
  final Color labelColor;
  final List<HomeTask> tasks;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Group label
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: labelColor,
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 8),
        // Task rows
        for (var i = 0; i < tasks.length; i++) ...[
          if (i > 0) const SizedBox(height: 6),
          _TaskRow(
            task: tasks[i],
            onToggle: () {
              final toggle =
                  ref.read(toggleTaskCompletionCallbackProvider);
              toggle(tasks[i].id, completed: !tasks[i].isCompleted);
              ref.invalidate(homeTodayTasksProvider);
            },
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Individual task row
// ---------------------------------------------------------------------------

class _TaskRow extends StatelessWidget {
  const _TaskRow({required this.task, this.onToggle});

  final HomeTask task;
  final VoidCallback? onToggle;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final isOverdue = task.dueDate != null &&
        task.dueDate!.isBefore(
          DateTime(
            DateTime.now().year,
            DateTime.now().month,
            DateTime.now().day,
          ),
        ) &&
        !task.isCompleted;

    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: () => GoRouter.of(context).push('/todos/${task.id}'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          // Light: surfaceContainerLowest with subtle purple border; Dark: surfaceContainer
          color: isLight
              ? colorScheme.surfaceContainerLowest
              : colorScheme.surfaceContainer,
          borderRadius: BorderRadius.circular(12),
          border: isOverdue
              ? Border.all(
                  color: colorScheme.error
                      .withValues(alpha: isLight ? 0.3 : 0.4),
                )
              : isLight
                  ? Border.all(
                      color: colorScheme.primary.withValues(alpha: 0.08),
                    )
                  : null,
        ),
        child: Row(
          children: [
            // --- Circular checkbox (48dp touch target) ---
            Semantics(
              label: task.isCompleted
                  ? 'Mark task incomplete'
                  : 'Mark task complete',
              button: true,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onToggle?.call();
                },
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: Center(
                    child: _CircularCheckbox(
                      isCompleted: task.isCompleted,
                      priority: task.priority,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 4),

            // --- Title ---
            Expanded(
              child: Text(
                task.title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: task.isCompleted
                      ? colorScheme.onSurfaceVariant
                      : colorScheme.onSurface,
                  decoration:
                      task.isCompleted ? TextDecoration.lineThrough : null,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),

            // --- Trailing metadata ---
            const SizedBox(width: 8),

            // Project color dot
            if (task.projectColor != null) ...[
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: Color(task.projectColor!),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
            ],

            // Priority flag
            if (task.priority != HomeTaskPriority.none)
              Icon(
                Icons.flag_rounded,
                size: 16,
                color: unjynxPriorityColor(context, task.priority.name),
              ),

            // Due time
            if (task.dueDate != null &&
                (task.dueDate!.hour != 0 || task.dueDate!.minute != 0)) ...[
              const SizedBox(width: 6),
              Text(
                _formatTime(task.dueDate!),
                style: TextStyle(
                  fontSize: 12,
                  color: isOverdue
                      ? colorScheme.error
                      : colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  /// Formats a DateTime as a short time string (e.g. "2:30 PM").
  static String _formatTime(DateTime dt) {
    final hour = dt.hour;
    final minute = dt.minute;
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour % 12 == 0 ? 12 : hour % 12;
    final displayMinute = minute.toString().padLeft(2, '0');
    return '$displayHour:$displayMinute $period';
  }

}

// ---------------------------------------------------------------------------
// Circular checkbox
// ---------------------------------------------------------------------------

class _CircularCheckbox extends StatelessWidget {
  const _CircularCheckbox({
    required this.isCompleted,
    required this.priority,
  });

  final bool isCompleted;
  final HomeTaskPriority priority;

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;

    final borderColor = isCompleted
        ? ux.success
        : unjynxPriorityColor(context, priority.name);

    final isLight = context.isLightMode;

    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: borderColor, width: 2),
        color: isCompleted
            ? (isLight ? ux.successWash : ux.success.withValues(alpha: 0.2))
            : Colors.transparent,
      ),
      child: isCompleted
          ? Icon(Icons.check, size: 14, color: ux.success)
          : null,
    );
  }
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isLight
            ? colorScheme.surfaceContainerLowest
            : colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(12),
        border: isLight
            ? Border.all(
                color: colorScheme.primary.withValues(alpha: 0.08),
              )
            : null,
      ),
      child: Column(
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 40,
            color: ux.success,
          ),
          const SizedBox(height: 10),
          Text(
            'All caught up!',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'No tasks for today',
            style: TextStyle(
              fontSize: 13,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Loading shimmer
// ---------------------------------------------------------------------------

class _TasksShimmer extends StatelessWidget {
  const _TasksShimmer();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final shimmerAlpha = isLight ? 0.5 : 0.4;

    return Column(
      children: [
        for (var i = 0; i < 3; i++) ...[
          if (i > 0) const SizedBox(height: 6),
          Container(
            height: 48,
            decoration: BoxDecoration(
              color: isLight
                  ? colorScheme.surfaceContainerLowest
                  : colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: isLight
                  ? Border.all(
                      color: colorScheme.primary.withValues(alpha: 0.08),
                    )
                  : null,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: colorScheme.surfaceContainerHigh
                          .withValues(alpha: shimmerAlpha),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      height: 14,
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceContainerHigh
                            .withValues(alpha: shimmerAlpha),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}
