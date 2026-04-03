import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/entities/todo.dart';
import '../providers/todo_providers.dart';

/// View mode for the timeline scale.
enum _TimelineView { day, week, month }

/// Gantt-style timeline view of tasks with horizontal bars.
///
/// Shows tasks on a horizontal time axis, color-coded by priority,
/// with progress based on status. Tasks without dueDate are filtered out.
class TimelinePage extends ConsumerStatefulWidget {
  const TimelinePage({super.key});

  @override
  ConsumerState<TimelinePage> createState() => _TimelinePageState();
}

class _TimelinePageState extends ConsumerState<TimelinePage> {
  _TimelineView _view = _TimelineView.week;
  final ScrollController _hScrollController = ScrollController();

  @override
  void dispose() {
    _hScrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final todosAsync = ref.watch(todoListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Timeline'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          // View mode toggle
          SegmentedButton<_TimelineView>(
            segments: const [
              ButtonSegment(value: _TimelineView.day, label: Text('D')),
              ButtonSegment(value: _TimelineView.week, label: Text('W')),
              ButtonSegment(value: _TimelineView.month, label: Text('M')),
            ],
            selected: {_view},
            onSelectionChanged: (s) {
              HapticFeedback.selectionClick();
              setState(() => _view = s.first);
            },
            style: ButtonStyle(
              visualDensity: VisualDensity.compact,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              padding: WidgetStateProperty.all(
                const EdgeInsets.symmetric(horizontal: 8),
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: todosAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Failed to load tasks')),
        data: (todos) {
          // Filter to tasks with dueDate
          final timelineTasks =
              todos
                  .where(
                    (t) =>
                        t.dueDate != null && t.status != TodoStatus.cancelled,
                  )
                  .toList()
                ..sort((a, b) => a.dueDate!.compareTo(b.dueDate!));

          if (timelineTasks.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.timeline_rounded,
                    size: 56,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No tasks with due dates',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Add due dates to your tasks\nto see them on the timeline.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return _TimelineBody(
            tasks: timelineTasks,
            view: _view,
            hScrollController: _hScrollController,
            colorScheme: colorScheme,
            theme: theme,
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Timeline body
// ---------------------------------------------------------------------------

class _TimelineBody extends StatelessWidget {
  final List<Todo> tasks;
  final _TimelineView view;
  final ScrollController hScrollController;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _TimelineBody({
    required this.tasks,
    required this.view,
    required this.hScrollController,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    // Compute date range
    final now = DateTime.now();
    final earliest = tasks
        .map((t) => t.startDate ?? t.createdAt)
        .reduce((a, b) => a.isBefore(b) ? a : b);
    final latest = tasks
        .map((t) => t.dueDate!)
        .reduce((a, b) => a.isAfter(b) ? a : b);

    final rangeStart = DateTime(
      earliest.year,
      earliest.month,
      earliest.day,
    ).subtract(const Duration(days: 2));
    final rangeEnd = DateTime(
      latest.year,
      latest.month,
      latest.day,
    ).add(const Duration(days: 7));
    final totalDays = rangeEnd.difference(rangeStart).inDays;

    final dayWidth = switch (view) {
      _TimelineView.day => 60.0,
      _TimelineView.week => 24.0,
      _TimelineView.month => 8.0,
    };

    final totalWidth = totalDays * dayWidth;

    return Column(
      children: [
        // Date header
        SizedBox(
          height: 40,
          child: SingleChildScrollView(
            controller: hScrollController,
            scrollDirection: Axis.horizontal,
            child: SizedBox(
              width: totalWidth + 160, // 160 for task name column
              child: Row(
                children: [
                  // Task name column header
                  Container(
                    width: 160,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    alignment: Alignment.centerLeft,
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      border: Border(
                        bottom: BorderSide(
                          color: colorScheme.outlineVariant.withValues(
                            alpha: 0.3,
                          ),
                        ),
                        right: BorderSide(
                          color: colorScheme.outlineVariant.withValues(
                            alpha: 0.3,
                          ),
                        ),
                      ),
                    ),
                    child: Text(
                      'Task',
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  // Date markers
                  ...List.generate(totalDays, (i) {
                    final date = rangeStart.add(Duration(days: i));
                    final isToday =
                        date.year == now.year &&
                        date.month == now.month &&
                        date.day == now.day;
                    final isMonday = date.weekday == 1;
                    final isFirstOfMonth = date.day == 1;

                    final showLabel = switch (view) {
                      _TimelineView.day => true,
                      _TimelineView.week => isMonday || isFirstOfMonth,
                      _TimelineView.month => isFirstOfMonth,
                    };

                    return Container(
                      width: dayWidth,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isToday
                            ? colorScheme.primary.withValues(alpha: 0.08)
                            : null,
                        border: Border(
                          bottom: BorderSide(
                            color: colorScheme.outlineVariant.withValues(
                              alpha: 0.3,
                            ),
                          ),
                        ),
                      ),
                      child: showLabel
                          ? Text(
                              _formatDateLabel(date, view),
                              style: theme.textTheme.labelSmall?.copyWith(
                                fontSize: view == _TimelineView.day ? 10 : 9,
                                fontWeight: isToday ? FontWeight.bold : null,
                                color: isToday
                                    ? colorScheme.primary
                                    : colorScheme.onSurfaceVariant,
                              ),
                              textAlign: TextAlign.center,
                            )
                          : null,
                    );
                  }),
                ],
              ),
            ),
          ),
        ),

        // Task rows
        Expanded(
          child: SingleChildScrollView(
            child: SingleChildScrollView(
              controller: hScrollController,
              scrollDirection: Axis.horizontal,
              child: SizedBox(
                width: totalWidth + 160,
                child: Column(
                  children: tasks.map((task) {
                    return _TaskRow(
                      task: task,
                      rangeStart: rangeStart,
                      dayWidth: dayWidth,
                      totalWidth: totalWidth,
                      colorScheme: colorScheme,
                      theme: theme,
                    );
                  }).toList(),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _formatDateLabel(DateTime d, _TimelineView view) {
    final months = [
      '',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return switch (view) {
      _TimelineView.day => '${d.day}\n${months[d.month]}',
      _TimelineView.week => '${months[d.month]} ${d.day}',
      _TimelineView.month => months[d.month],
    };
  }
}

// ---------------------------------------------------------------------------
// Task row
// ---------------------------------------------------------------------------

class _TaskRow extends StatelessWidget {
  final Todo task;
  final DateTime rangeStart;
  final double dayWidth;
  final double totalWidth;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _TaskRow({
    required this.task,
    required this.rangeStart,
    required this.dayWidth,
    required this.totalWidth,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final start = task.startDate ?? task.createdAt;
    final end = task.dueDate!;
    final startOffset = start.difference(rangeStart).inDays;
    final durationDays = end.difference(start).inDays.clamp(1, 365);

    final barLeft = startOffset * dayWidth;
    final barWidth = (durationDays * dayWidth).clamp(dayWidth, totalWidth);

    final progress = switch (task.status) {
      TodoStatus.completed => 1.0,
      TodoStatus.inProgress => 0.5,
      _ => 0.0,
    };

    final priorityColor = _priorityColor(task.priority, colorScheme);
    final isOverdue =
        end.isBefore(DateTime.now()) && task.status != TodoStatus.completed;

    return SizedBox(
      height: 40,
      child: Row(
        children: [
          // Task name
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              GoRouter.of(context).push('/todos/${task.id}');
            },
            child: Container(
              width: 160,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              alignment: Alignment.centerLeft,
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: colorScheme.outlineVariant.withValues(alpha: 0.15),
                  ),
                  right: BorderSide(
                    color: colorScheme.outlineVariant.withValues(alpha: 0.3),
                  ),
                ),
              ),
              child: Text(
                task.title,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  decoration: task.status == TodoStatus.completed
                      ? TextDecoration.lineThrough
                      : null,
                  color: isOverdue ? colorScheme.error : null,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),

          // Bar area
          Expanded(
            child: Stack(
              children: [
                // Grid line
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: colorScheme.outlineVariant.withValues(
                            alpha: 0.15,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                // Task bar
                Positioned(
                  left: barLeft.clamp(0, totalWidth),
                  top: 6,
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      GoRouter.of(context).push('/todos/${task.id}');
                    },
                    child: Container(
                      width: barWidth,
                      height: 28,
                      decoration: BoxDecoration(
                        color: priorityColor.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: priorityColor.withValues(alpha: 0.4),
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(5),
                        child: Stack(
                          children: [
                            // Progress fill
                            FractionallySizedBox(
                              widthFactor: progress,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: priorityColor.withValues(alpha: 0.35),
                                  borderRadius: BorderRadius.circular(5),
                                ),
                              ),
                            ),
                            // Label
                            if (barWidth > 60)
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                ),
                                child: Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    task.title,
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w600,
                                      color: priorityColor,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _priorityColor(TodoPriority p, ColorScheme cs) {
    return switch (p) {
      TodoPriority.urgent => const Color(0xFFEF4444),
      TodoPriority.high => const Color(0xFFF59E0B),
      TodoPriority.medium => const Color(0xFF3B82F6),
      TodoPriority.low => const Color(0xFF22C55E),
      TodoPriority.none => cs.onSurfaceVariant,
    };
  }
}
