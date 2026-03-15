import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Displays the task list for a selected calendar date.
///
/// Shows a date header ("Tuesday, March 9"), then a list of task cards
/// with priority indicator, title, optional time, and project color dot.
/// Renders an empty state when no tasks exist for the date.
class DayTaskList extends ConsumerWidget {
  const DayTaskList({
    required this.date,
    required this.tasks,
    super.key,
  });

  /// The date whose tasks are displayed.
  final DateTime date;

  /// Tasks for [date].
  final List<CalendarTask> tasks;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Date header
        _DateHeader(date: date, taskCount: tasks.length),
        const SizedBox(height: 12),

        // Task cards or empty state
        if (tasks.isEmpty)
          const _EmptyDayState()
        else
          _TaskCardList(tasks: tasks),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Date header
// ---------------------------------------------------------------------------

class _DateHeader extends StatelessWidget {
  const _DateHeader({required this.date, required this.taskCount});

  final DateTime date;
  final int taskCount;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Row(
      children: [
        Text(
          _formatDateHeader(date),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: colorScheme.onSurface,
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
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: colorScheme.primary,
              ),
            ),
          ),
        ],
      ],
    );
  }

  static String _formatDateHeader(DateTime dt) {
    const weekdays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    final weekday = weekdays[dt.weekday - 1];
    final month = months[dt.month - 1];
    return '$weekday, $month ${dt.day}';
  }
}

// ---------------------------------------------------------------------------
// Task card list
// ---------------------------------------------------------------------------

class _TaskCardList extends StatelessWidget {
  const _TaskCardList({required this.tasks});

  final List<CalendarTask> tasks;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < tasks.length; i++) ...[
          if (i > 0) const SizedBox(height: 6),
          _CalendarTaskCard(task: tasks[i]),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Individual task card
// ---------------------------------------------------------------------------

class _CalendarTaskCard extends StatelessWidget {
  const _CalendarTaskCard({required this.task});

  final CalendarTask task;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isCompleted = task.status == 'completed';

    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: () => GoRouter.of(context).push('/todos/${task.id}'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          // Light: white bg with subtle purple border; Dark: surfaceContainer
          color: isLight ? Colors.white : colorScheme.surfaceContainer,
          borderRadius: BorderRadius.circular(12),
          border: isLight
              ? Border.all(
                  color: colorScheme.primary.withValues(alpha: 0.08),
                )
              : null,
        ),
        child: Row(
          children: [
            // Priority dot
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: unjynxPriorityColor(context, task.priority),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 12),

            // Title
            Expanded(
              child: Text(
                task.title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isCompleted
                      ? colorScheme.onSurfaceVariant
                      : colorScheme.onSurface,
                  decoration: isCompleted ? TextDecoration.lineThrough : null,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),

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

            // Due time
            if (task.dueDate != null &&
                (task.dueDate!.hour != 0 || task.dueDate!.minute != 0))
              Text(
                _formatTime(task.dueDate!),
                style: TextStyle(
                  fontSize: 12,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),

            // Completed check
            if (isCompleted) ...[
              const SizedBox(width: 6),
              Icon(
                Icons.check_circle_rounded,
                size: 16,
                color: ux.success,
              ),
            ],
          ],
        ),
      ),
    );
  }

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
// Empty state
// ---------------------------------------------------------------------------

class _EmptyDayState extends StatelessWidget {
  const _EmptyDayState();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        color: isLight ? Colors.white : colorScheme.surfaceContainer,
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
            Icons.event_available_rounded,
            size: 36,
            color: colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 10),
          Text(
            'No tasks for this day',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Tap + to add one',
            style: TextStyle(
              fontSize: 12,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
