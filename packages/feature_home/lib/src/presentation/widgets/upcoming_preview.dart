import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Preview of the next 3 upcoming tasks after today.
///
/// Each compact card shows a priority-colored dot, task title, and a
/// relative date label ("Tomorrow", "Wednesday", "Next Mon", etc.).
///
/// If there are no upcoming tasks, a "Nothing scheduled" message is shown.
class UpcomingPreview extends ConsumerWidget {
  const UpcomingPreview({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final upcomingAsync = ref.watch(homeUpcomingTasksProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // --- Header ---
        Text(
          'Coming Up',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: colorScheme.onSurface,
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),

        // --- Task cards ---
        upcomingAsync.when(
          data: (tasks) =>
              tasks.isEmpty ? const _EmptyState() : _UpcomingList(tasks: tasks),
          loading: () => const _UpcomingShimmer(),
          error: (error, _) => _ErrorState(
            error: error,
            onRetry: () => ref.invalidate(homeUpcomingTasksProvider),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Upcoming task list (max 3)
// ---------------------------------------------------------------------------

class _UpcomingList extends StatelessWidget {
  const _UpcomingList({required this.tasks});

  final List<HomeTask> tasks;

  @override
  Widget build(BuildContext context) {
    // Show at most 3 upcoming tasks.
    final displayTasks = tasks.length > 3 ? tasks.sublist(0, 3) : tasks;

    return Column(
      children: [
        for (var i = 0; i < displayTasks.length; i++) ...[
          if (i > 0) const SizedBox(height: 6),
          _UpcomingCard(task: displayTasks[i]),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Individual upcoming task card
// ---------------------------------------------------------------------------

class _UpcomingCard extends StatelessWidget {
  const _UpcomingCard({required this.task});

  final HomeTask task;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        GoRouter.of(context).push('/todos/${task.id}');
      },
      child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        // Light: surfaceContainerLowest with subtle purple border; Dark: surfaceContainer
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
      child: Row(
        children: [
          // Priority-colored dot
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: unjynxPriorityColor(context, task.priority.name),
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
                color: colorScheme.onSurface,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),

          const SizedBox(width: 12),

          // Relative date
          Text(
            task.dueDate != null
                ? _relativeDate(task.dueDate!)
                : 'No date',
            style: TextStyle(
              fontSize: 12,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
      ),
    );
  }

  /// Converts a [DateTime] to a human-readable relative date string.
  ///
  /// - Tomorrow -> "Tomorrow"
  /// - This week (2-6 days) -> day name (e.g. "Wednesday")
  /// - Next week (7-13 days) -> "Next {day}" (e.g. "Next Mon")
  /// - Further out -> "MMM d" (e.g. "Mar 15")
  static String _relativeDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(date.year, date.month, date.day);
    final difference = target.difference(today).inDays;

    if (difference <= 0) return 'Today';
    if (difference == 1) return 'Tomorrow';
    if (difference <= 6) return _fullDayName(target.weekday);
    if (difference <= 13) return 'Next ${_shortDayName(target.weekday)}';

    return '${_shortMonthName(target.month)} ${target.day}';
  }

  /// Full day name (e.g. "Wednesday").
  static String _fullDayName(int weekday) {
    const names = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return names[weekday - 1];
  }

  /// Short day name (e.g. "Mon").
  static String _shortDayName(int weekday) {
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return names[weekday - 1];
  }

  /// Short month name (e.g. "Mar").
  static String _shortMonthName(int month) {
    const names = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return names[month - 1];
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

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Center(
        child: Text(
          'Nothing scheduled',
          style: TextStyle(
            fontSize: 14,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.error, required this.onRetry});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      child: Column(
        children: [
          Text(
            'Failed to load upcoming tasks',
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.error,
            ),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: onRetry,
            icon: Icon(Icons.refresh, size: 18, color: colorScheme.primary),
            label: Text(
              'Retry',
              style: TextStyle(color: colorScheme.primary),
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

class _UpcomingShimmer extends StatelessWidget {
  const _UpcomingShimmer();

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
            height: 44,
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
                    width: 8,
                    height: 8,
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
                  const SizedBox(width: 12),
                  Container(
                    width: 60,
                    height: 12,
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerHigh
                          .withValues(alpha: shimmerAlpha),
                      borderRadius: BorderRadius.circular(4),
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
