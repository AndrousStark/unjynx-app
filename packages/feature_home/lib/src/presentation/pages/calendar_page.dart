import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:feature_home/src/presentation/widgets/calendar_grid.dart';
import 'package:feature_home/src/presentation/widgets/day_task_list.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// Calendar view screen -- Tab 4 in the bottom navigation.
///
/// Displays a month-view calendar grid with colored task indicator dots,
/// a month/year header with navigation arrows, a month/week view toggle,
/// and below the grid the selected day's task list.
///
/// The gold circle marks today, vivid purple marks the selected date.
/// A floating action button lets users add a task for the selected date.
class CalendarPage extends ConsumerStatefulWidget {
  const CalendarPage({super.key});

  @override
  ConsumerState<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends ConsumerState<CalendarPage> {
  late DateTime _selectedDate;
  late DateTime _currentMonth;
  bool _isWeekView = false;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedDate = DateTime(now.year, now.month, now.day);
    _currentMonth = DateTime(now.year, now.month);
  }

  // -------------------------------------------------------------------------
  // Month navigation
  // -------------------------------------------------------------------------

  void _goToPreviousMonth() {
    setState(() {
      final prevMonth = _currentMonth.month == 1
          ? DateTime(_currentMonth.year - 1, 12)
          : DateTime(_currentMonth.year, _currentMonth.month - 1);
      _currentMonth = prevMonth;
    });
  }

  void _goToNextMonth() {
    setState(() {
      final nextMonth = _currentMonth.month == 12
          ? DateTime(_currentMonth.year + 1)
          : DateTime(_currentMonth.year, _currentMonth.month + 1);
      _currentMonth = nextMonth;
    });
  }

  void _goToToday() {
    final now = DateTime.now();
    setState(() {
      _selectedDate = DateTime(now.year, now.month, now.day);
      _currentMonth = DateTime(now.year, now.month);
    });
  }

  void _onDateSelected(DateTime date) {
    setState(() {
      _selectedDate = DateTime(date.year, date.month, date.day);
      // If user taps a date in a different month, navigate to that month.
      if (date.month != _currentMonth.month ||
          date.year != _currentMonth.year) {
        _currentMonth = DateTime(date.year, date.month);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final calendarTasksAsync = ref.watch(
      calendarTasksProvider(_currentMonth),
    );

    return Scaffold(
      body: SafeArea(
        child: calendarTasksAsync.when(
          data: _buildContent,
          loading: () => _buildContent(const []),
          error: (error, _) => _buildErrorState(error),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to add task with pre-filled date.
          // For now just a placeholder - will wire up in integration.
        },
        tooltip: 'Add task',
        child: const Icon(Icons.add_rounded),
      ),
    );
  }

  Widget _buildContent(List<CalendarTask> allTasks) {
    final colorScheme = Theme.of(context).colorScheme;

    // Build task dots map: group tasks by date, assign priority colors.
    final taskDots = _buildTaskDots(allTasks);

    // Filter tasks for the selected date.
    final selectedDayTasks = allTasks.where((task) {
      if (task.dueDate == null) return false;
      return task.dueDate!.year == _selectedDate.year &&
          task.dueDate!.month == _selectedDate.month &&
          task.dueDate!.day == _selectedDate.day;
    }).toList();

    return RefreshIndicator(
      color: Theme.of(context).colorScheme.primary,
      onRefresh: () async {
        ref.invalidate(calendarTasksProvider(_currentMonth));
      },
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            sliver: SliverList.list(
              children: [
                // Month/Year header with navigation
                _MonthHeader(
                  currentMonth: _currentMonth,
                  onPrevious: _goToPreviousMonth,
                  onNext: _goToNextMonth,
                  onToday: _goToToday,
                ),
                const SizedBox(height: 16),

                // View toggle (Month / Week)
                _ViewToggle(
                  isWeekView: _isWeekView,
                  onChanged: (isWeek) => setState(() => _isWeekView = isWeek),
                ),
                const SizedBox(height: 16),

                // Calendar grid
                if (_isWeekView)
                  _WeekStrip(
                    selectedDate: _selectedDate,
                    taskDots: taskDots,
                    onDateSelected: _onDateSelected,
                  )
                else
                  CalendarGrid(
                    currentMonth: _currentMonth,
                    selectedDate: _selectedDate,
                    taskDots: taskDots,
                    onDateSelected: _onDateSelected,
                  ),

                const SizedBox(height: 20),

                // Divider
                Container(
                  height: 1,
                  color: colorScheme.surfaceContainerHigh,
                ),
                const SizedBox(height: 16),

                // Selected day's tasks
                DayTaskList(
                  date: _selectedDate,
                  tasks: selectedDayTasks,
                ),
                const SizedBox(height: 80), // Space for FAB
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(Object error) {
    final colorScheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 48,
              color: colorScheme.error,
            ),
            const SizedBox(height: 12),
            Text(
              'Failed to load calendar',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '$error',
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () =>
                  ref.invalidate(calendarTasksProvider(_currentMonth)),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------------------
  // Task dots builder
  // -------------------------------------------------------------------------

  Map<DateTime, List<Color>> _buildTaskDots(List<CalendarTask> tasks) {
    final dots = <DateTime, List<Color>>{};

    for (final task in tasks) {
      if (task.dueDate == null) continue;

      final dateKey = DateTime(
        task.dueDate!.year,
        task.dueDate!.month,
        task.dueDate!.day,
      );

      final color = _priorityToColor(task.priority);
      final existing = dots[dateKey];
      if (existing == null) {
        dots[dateKey] = [color];
      } else if (existing.length < 3) {
        // Immutable approach: create new list with added color.
        dots[dateKey] = [...existing, color];
      }
    }

    return Map.unmodifiable(dots);
  }

  Color _priorityToColor(String priority) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return switch (priority) {
      'urgent' => colorScheme.error,
      'high' => context.isLightMode
          ? const Color(0xFFE53E3E)
          : const Color(0xFFFF8787),
      'medium' => ux.warning,
      'low' => colorScheme.primary,
      _ => colorScheme.onSurfaceVariant,
    };
  }
}

// ---------------------------------------------------------------------------
// Month header with navigation arrows
// ---------------------------------------------------------------------------

class _MonthHeader extends StatelessWidget {
  const _MonthHeader({
    required this.currentMonth,
    required this.onPrevious,
    required this.onNext,
    required this.onToday,
  });

  final DateTime currentMonth;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final VoidCallback onToday;

  static const _monthNames = [
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

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    final now = DateTime.now();
    final isCurrentMonth =
        currentMonth.year == now.year && currentMonth.month == now.month;

    return Row(
      children: [
        // Left arrow
        _NavButton(
          icon: Icons.chevron_left_rounded,
          onTap: onPrevious,
        ),
        const SizedBox(width: 8),

        // Month + Year
        Expanded(
          child: GestureDetector(
            onTap: onToday,
            child: Text(
              '${_monthNames[currentMonth.month - 1]} ${currentMonth.year}',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: colorScheme.onSurface,
                letterSpacing: 0.3,
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),

        // Today button (only if not viewing current month)
        if (!isCurrentMonth) ...[
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              onToday();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 10,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                border: Border.all(
                  color: context.isLightMode
                      ? ux.gold.withValues(alpha: 0.8)
                      : ux.gold.withValues(alpha: 0.5),
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'Today',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: ux.gold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],

        // Right arrow
        _NavButton(
          icon: Icons.chevron_right_rounded,
          onTap: onNext,
        ),
      ],
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          icon,
          size: 22,
          color: colorScheme.onSurface,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// View toggle (Month / Week)
// ---------------------------------------------------------------------------

class _ViewToggle extends StatelessWidget {
  const _ViewToggle({
    required this.isWeekView,
    required this.onChanged,
  });

  final bool isWeekView;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          _ToggleChip(
            label: 'Month',
            isActive: !isWeekView,
            onTap: () => onChanged(false),
          ),
          _ToggleChip(
            label: 'Week',
            isActive: isWeekView,
            onTap: () => onChanged(true),
          ),
        ],
      ),
    );
  }
}

class _ToggleChip extends StatelessWidget {
  const _ToggleChip({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isActive ? colorScheme.surfaceContainerHigh : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              color: isActive
                  ? colorScheme.onSurface
                  : colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Week strip (horizontal 7-day row for week view)
// ---------------------------------------------------------------------------

class _WeekStrip extends StatelessWidget {
  const _WeekStrip({
    required this.selectedDate,
    required this.taskDots,
    required this.onDateSelected,
  });

  final DateTime selectedDate;
  final Map<DateTime, List<Color>> taskDots;
  final ValueChanged<DateTime> onDateSelected;

  static const _dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    // Calculate the Monday of the selected date's week.
    final weekday = selectedDate.weekday; // 1=Mon, 7=Sun
    final monday = selectedDate.subtract(Duration(days: weekday - 1));

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    return Row(
      children: List.generate(7, (i) {
        final date = monday.add(Duration(days: i));
        final dateKey = DateTime(date.year, date.month, date.day);
        final isToday = dateKey == today;
        final isSelected = dateKey.year == selectedDate.year &&
            dateKey.month == selectedDate.month &&
            dateKey.day == selectedDate.day;
        final dots = taskDots[dateKey] ?? const [];

        return Expanded(
          child: GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              onDateSelected(date);
            },
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                children: [
                  // Day label (Mon, Tue, ...)
                  Text(
                    _dayLabels[i],
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: isSelected
                          ? colorScheme.primary
                          : colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Day number with highlight
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? colorScheme.primary
                          : isToday
                              ? ux.gold
                              : Colors.transparent,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${date.day}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: isSelected || isToday
                            ? FontWeight.bold
                            : FontWeight.w400,
                        color: isSelected
                            ? colorScheme.onPrimary
                            : isToday
                                ? colorScheme.surfaceContainerLowest
                                : colorScheme.onSurface,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Task dots
                  SizedBox(
                    height: 6,
                    child: dots.isEmpty
                        ? null
                        : Row(
                            mainAxisSize: MainAxisSize.min,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              for (var j = 0;
                                  j < dots.length.clamp(0, 3);
                                  j++) ...[
                                if (j > 0) const SizedBox(width: 2),
                                Container(
                                  width: 5,
                                  height: 5,
                                  decoration: BoxDecoration(
                                    color: dots[j],
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
                            ],
                          ),
                  ),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }
}
