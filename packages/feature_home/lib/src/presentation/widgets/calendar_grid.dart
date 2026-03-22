import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A clean month-view calendar grid built with Row/Column layout.
///
/// Displays a 7-column grid with day-of-week headers, day cells with optional
/// colored task-indicator dots, and tap-to-select highlighting.
///
/// Uses gold for today, vivid purple for the selected date, and up to 3
/// colored dots beneath each day number to indicate tasks.
class CalendarGrid extends StatelessWidget {
  const CalendarGrid({
    required this.currentMonth,
    required this.selectedDate,
    required this.taskDots,
    required this.onDateSelected,
    super.key,
  });

  /// The month (year + month) to render. Day portion is ignored.
  final DateTime currentMonth;

  /// The currently selected date (highlighted with vivid purple).
  final DateTime selectedDate;

  /// Colored task-indicator dots keyed by date (year-month-day only).
  ///
  /// At most 3 dots are rendered per day cell.
  final Map<DateTime, List<Color>> taskDots;

  /// Invoked when the user taps a date cell.
  final ValueChanged<DateTime> onDateSelected;

  // -------------------------------------------------------------------------
  // Layout constants
  // -------------------------------------------------------------------------

  static const _dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  static const double _cellHeight = 52;
  static const double _dotSize = 5;
  static const double _todayCircleSize = 34;
  static const double _selectedCircleSize = 34;

  // -------------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final rows = _buildWeekRows(context);

    return Column(
      children: [
        _buildDayHeaders(context),
        const SizedBox(height: 4),
        ...rows,
      ],
    );
  }

  // -------------------------------------------------------------------------
  // Day-of-week headers
  // -------------------------------------------------------------------------

  Widget _buildDayHeaders(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      children: _dayLabels.map((label) {
        return Expanded(
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurfaceVariant,
                letterSpacing: 0.5,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // -------------------------------------------------------------------------
  // Grid rows
  // -------------------------------------------------------------------------

  List<Widget> _buildWeekRows(BuildContext context) {
    final cells = _generateCells(context);
    final rows = <Widget>[];

    for (var i = 0; i < cells.length; i += 7) {
      final end = (i + 7).clamp(0, cells.length);
      final weekCells = cells.sublist(i, end);

      // Pad partial last row (shouldn't happen with our logic, but safety).
      while (weekCells.length < 7) {
        weekCells.add(const SizedBox());
      }

      rows.add(
        SizedBox(
          height: _cellHeight,
          child: Row(children: weekCells),
        ),
      );
    }

    return rows;
  }

  // -------------------------------------------------------------------------
  // Generate 42 cells (6 rows x 7 columns) covering the month
  // -------------------------------------------------------------------------

  List<Widget> _generateCells(BuildContext context) {
    final year = currentMonth.year;
    final month = currentMonth.month;

    final firstOfMonth = DateTime(year, month);
    // weekday: 1=Mon, 7=Sun. We want Monday-first, so offset = weekday - 1.
    final startOffset = (firstOfMonth.weekday - 1) % 7;

    // The first date shown in the grid (may be previous month).
    final gridStart = firstOfMonth.subtract(Duration(days: startOffset));

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final cells = <Widget>[];

    for (var i = 0; i < 42; i++) {
      final date = gridStart.add(Duration(days: i));
      final isCurrentMonth = date.month == month && date.year == year;
      final isToday = date == today;
      final isSelected = _isSameDay(date, selectedDate);

      final dateKey = DateTime(date.year, date.month, date.day);
      final dots = taskDots[dateKey] ?? const [];

      cells.add(
        Expanded(
          child: GestureDetector(
            onTap: () => onDateSelected(date),
            behavior: HitTestBehavior.opaque,
            child: _DayCell(
              day: date.day,
              isCurrentMonth: isCurrentMonth,
              isToday: isToday,
              isSelected: isSelected,
              dots: dots,
              todayCircleSize: _todayCircleSize,
              selectedCircleSize: _selectedCircleSize,
              dotSize: _dotSize,
            ),
          ),
        ),
      );
    }

    return cells;
  }

  static bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}

// ---------------------------------------------------------------------------
// Day cell
// ---------------------------------------------------------------------------

class _DayCell extends StatelessWidget {
  const _DayCell({
    required this.day,
    required this.isCurrentMonth,
    required this.isToday,
    required this.isSelected,
    required this.dots,
    required this.todayCircleSize,
    required this.selectedCircleSize,
    required this.dotSize,
  });

  final int day;
  final bool isCurrentMonth;
  final bool isToday;
  final bool isSelected;
  final List<Color> dots;
  final double todayCircleSize;
  final double selectedCircleSize;
  final double dotSize;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    // Determine text color.
    Color textColor;
    if (isSelected || isToday) {
      // On colored circles, use high-contrast text
      textColor = isSelected
          ? colorScheme.onPrimary
          : (isLight
              ? colorScheme.surfaceContainerLowest
              : const Color(0xFF1A0A2E));
    } else {
      textColor = isCurrentMonth
          ? colorScheme.onSurface
          : colorScheme.onSurfaceVariant
                .withValues(alpha: isLight ? 0.5 : 0.4);
    }

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Day number with optional highlight circle
        Container(
          width: isToday || isSelected ? selectedCircleSize : null,
          height: isToday || isSelected ? todayCircleSize : null,
          decoration: _circleDecoration(colorScheme, ux, isLight: isLight),
          alignment: Alignment.center,
          child: Text(
            '$day',
            style: TextStyle(
              fontSize: 14,
              fontWeight: isToday || isSelected
                  ? FontWeight.bold
                  : FontWeight.w400,
              color: textColor,
            ),
          ),
        ),

        // Task dots (max 3)
        const SizedBox(height: 3),
        SizedBox(
          height: dotSize + 1,
          child: dots.isEmpty
              ? null
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (var i = 0; i < dots.length.clamp(0, 3); i++) ...[
                      if (i > 0) SizedBox(width: dotSize * 0.5),
                      Container(
                        width: dotSize,
                        height: dotSize,
                        decoration: BoxDecoration(
                          color: dots[i],
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ],
                ),
        ),
      ],
    );
  }

  BoxDecoration? _circleDecoration(
    ColorScheme colorScheme,
    UnjynxCustomColors ux, {
    required bool isLight,
  }) {
    if (isSelected) {
      return BoxDecoration(
        color: colorScheme.primary,
        shape: BoxShape.circle,
      );
    }
    if (isToday) {
      return BoxDecoration(
        color: ux.gold,
        shape: BoxShape.circle,
        // Light: gold shadow pulse, Dark: gold glow
        boxShadow: [
          BoxShadow(
            color: ux.gold.withValues(alpha: isLight ? 0.3 : 0.5),
            blurRadius: isLight ? 6 : 8,
            spreadRadius: isLight ? 0 : 1,
          ),
        ],
      );
    }
    return null;
  }
}
