import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:feature_home/src/presentation/widgets/calendar_connect_card.dart';
import 'package:feature_home/src/presentation/widgets/calendar_grid.dart';
import 'package:feature_home/src/presentation/widgets/day_task_list.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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
    final ghostEventsAsync = ref.watch(
      calendarGhostEventsProvider(_currentMonth),
    );

    // Resolve ghost events (empty list on loading/error).
    final ghostEvents = ghostEventsAsync.value ?? const [];

    return Scaffold(
      body: SafeArea(
        child: calendarTasksAsync.when(
          data: (tasks) => _buildContent(tasks, ghostEvents),
          loading: () => _buildContent(const [], ghostEvents),
          error: (error, _) => _buildErrorState(error),
        ),
      ),
      floatingActionButton: Semantics(
        label: 'Add task for selected date',
        button: true,
        child: FloatingActionButton(
          onPressed: () {
            HapticFeedback.mediumImpact();
            // Navigate to the todos page with the selected date as a query
            // parameter so the tasks list can pre-filter or pre-fill for
            // that date.
            final dateParam =
                '${_selectedDate.year}-'
                '${_selectedDate.month.toString().padLeft(2, '0')}-'
                '${_selectedDate.day.toString().padLeft(2, '0')}';
            context.push(
              Uri(
                path: '/todos',
                queryParameters: {'date': dateParam},
              ).toString(),
            );
          },
          tooltip: 'Add task for selected date',
          child: const Icon(Icons.add_rounded),
        ),
      ),
    );
  }

  Widget _buildContent(
    List<CalendarTask> allTasks,
    List<CalendarGhostEvent> ghostEvents,
  ) {
    final colorScheme = Theme.of(context).colorScheme;

    // Build task dots map: group tasks by date, assign priority colors.
    // Ghost event dots are added with a distinct cyan/grey color.
    final taskDots = _buildTaskDots(allTasks);
    final mergedDots = _mergeGhostDots(taskDots, ghostEvents);

    // Filter tasks for the selected date.
    final selectedDayTasks = allTasks.where((task) {
      if (task.dueDate == null) return false;
      return task.dueDate!.year == _selectedDate.year &&
          task.dueDate!.month == _selectedDate.month &&
          task.dueDate!.day == _selectedDate.day;
    }).toList();

    // Filter ghost events for the selected date.
    final selectedDayGhosts = ghostEvents.where((event) {
      // An event spans the selected date if start <= endOfDay and end >= startOfDay.
      final dayStart = DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
      );
      final dayEnd = dayStart.add(const Duration(days: 1));
      return event.start.isBefore(dayEnd) && event.end.isAfter(dayStart);
    }).toList();

    return RefreshIndicator(
      color: Theme.of(context).colorScheme.primary,
      onRefresh: () async {
        ref.invalidate(calendarTasksProvider(_currentMonth));
        ref.invalidate(calendarGhostEventsProvider(_currentMonth));
      },
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            sliver: SliverList.list(
              children: [
                // Google Calendar connect/disconnect banner
                const CalendarConnectCard(),
                const SizedBox(height: 12),

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
                    taskDots: mergedDots,
                    onDateSelected: _onDateSelected,
                  )
                else
                  CalendarGrid(
                    currentMonth: _currentMonth,
                    selectedDate: _selectedDate,
                    taskDots: mergedDots,
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

                // Ghost events section (shown below tasks when present)
                if (selectedDayGhosts.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  _GhostEventsSection(events: selectedDayGhosts),
                ],

                const SizedBox(height: 80), // Space for FAB
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(Object error) {
    return UnjynxErrorView(
      type: ErrorViewType.serverError,
      title: 'Failed to load calendar',
      onRetry: () => ref.invalidate(calendarTasksProvider(_currentMonth)),
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

      final color = unjynxPriorityColor(context, task.priority);
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

  /// Merge ghost event dots (cyan with 0.4 opacity) into the task dots map.
  ///
  /// Creates a new map without mutating the original. Ghost dots are appended
  /// after task dots, respecting the 3-dot maximum per date cell.
  Map<DateTime, List<Color>> _mergeGhostDots(
    Map<DateTime, List<Color>> taskDots,
    List<CalendarGhostEvent> ghostEvents,
  ) {
    if (ghostEvents.isEmpty) return taskDots;

    final isLight = context.isLightMode;
    final ghostColor = isLight
        ? const Color(0x6606B6D4) // cyan at 0.4 opacity (light)
        : const Color(0x6606B6D4); // cyan at 0.4 opacity (dark)

    final merged = <DateTime, List<Color>>{
      for (final entry in taskDots.entries) entry.key: [...entry.value],
    };

    for (final event in ghostEvents) {
      // Ghost events may span multiple days — add a dot on each day.
      var day = DateTime(event.start.year, event.start.month, event.start.day);
      final endDay = DateTime(event.end.year, event.end.month, event.end.day);

      while (!day.isAfter(endDay)) {
        final existing = merged[day];
        if (existing == null) {
          merged[day] = [ghostColor];
        } else if (existing.length < 3) {
          merged[day] = [...existing, ghostColor];
        }
        day = day.add(const Duration(days: 1));
      }
    }

    return Map.unmodifiable(merged);
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
          semanticLabel: 'Previous month',
          onTap: onPrevious,
        ),
        const SizedBox(width: 8),

        // Month + Year
        Expanded(
          child: Semantics(
            label: '${_monthNames[currentMonth.month - 1]} ${currentMonth.year}. Tap to go to today.',
            button: true,
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
        ),
        const SizedBox(width: 8),

        // Today button (only if not viewing current month)
        if (!isCurrentMonth) ...[
          Semantics(
            label: 'Go to today',
            button: true,
            child: GestureDetector(
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
          ),
          const SizedBox(width: 8),
        ],

        // Right arrow
        _NavButton(
          icon: Icons.chevron_right_rounded,
          semanticLabel: 'Next month',
          onTap: onNext,
        ),
      ],
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({
    required this.icon,
    required this.semanticLabel,
    required this.onTap,
  });

  final IconData icon;
  final String semanticLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Semantics(
      label: semanticLabel,
      button: true,
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        behavior: HitTestBehavior.opaque,
        child: Container(
          width: 48,
          height: 48,
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
      child: Semantics(
        label: '$label view',
        button: true,
        selected: isActive,
        child: GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: accessibleDuration(
              context,
              const Duration(milliseconds: 200),
            ),
            padding: const EdgeInsets.symmetric(vertical: 10),
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

// ---------------------------------------------------------------------------
// Ghost events section (Google Calendar events for selected day)
// ---------------------------------------------------------------------------

class _GhostEventsSection extends StatelessWidget {
  const _GhostEventsSection({required this.events});

  final List<CalendarGhostEvent> events;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section header
        Row(
          children: [
            Icon(
              Icons.calendar_month_rounded,
              size: 16,
              color: ux.info.withValues(alpha: 0.7),
            ),
            const SizedBox(width: 6),
            Text(
              'Calendar Events',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurfaceVariant,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: ux.info.withValues(alpha: isLight ? 0.1 : 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${events.length}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: ux.info,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Event cards
        for (var i = 0; i < events.length; i++) ...[
          if (i > 0) const SizedBox(height: 6),
          _GhostEventCard(event: events[i]),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Individual ghost event card
// ---------------------------------------------------------------------------

class _GhostEventCard extends StatelessWidget {
  const _GhostEventCard({required this.event});

  final CalendarGhostEvent event;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final timeDesc = event.allDay
        ? 'all day'
        : _formatEventTime(event.start, event.end);

    return Semantics(
      label: 'Google Calendar event: ${event.title}, $timeDesc',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isLight
              ? ux.info.withValues(alpha: 0.04)
              : ux.info.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: ux.info.withValues(alpha: isLight ? 0.1 : 0.12),
          ),
        ),
        child: Row(
          children: [
            // Ghost indicator dot (cyan, semi-transparent)
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: ux.info.withValues(alpha: 0.4),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 12),

            // Title
            Expanded(
              child: Text(
                event.title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: colorScheme.onSurfaceVariant,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),

            const SizedBox(width: 8),

            // Time or "All Day" badge
            if (event.allDay)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: ux.info.withValues(alpha: isLight ? 0.08 : 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'All Day',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: ux.info.withValues(alpha: 0.8),
                  ),
                ),
              )
            else
              Text(
                _formatEventTime(event.start, event.end),
                style: TextStyle(
                  fontSize: 12,
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                ),
              ),
          ],
        ),
      ),
    );
  }

  static String _formatEventTime(DateTime start, DateTime end) {
    return '${_formatHour(start)} - ${_formatHour(end)}';
  }

  static String _formatHour(DateTime dt) {
    final hour = dt.hour;
    final minute = dt.minute;
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour % 12 == 0 ? 12 : hour % 12;
    if (minute == 0) return '$displayHour $period';
    final displayMinute = minute.toString().padLeft(2, '0');
    return '$displayHour:$displayMinute $period';
  }
}
