import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// GitHub contribution-style activity heatmap showing the last 12 weeks.
///
/// Renders a grid of 7 rows (Mon-Sun) x 12 columns (weeks), where each
/// cell is coloured based on the number of tasks completed that day:
///
/// - **No activity** (0 tasks): surfaceContainerHigh (dark)
/// - **Low** (1-2 tasks): deepPurple
/// - **Medium** (3-5 tasks): primary
/// - **High** (6+ tasks): gold
///
/// Day labels (M, W, F) appear on the left. Month labels appear along
/// the top when the month changes within the grid.
class ActivityHeatmap extends ConsumerWidget {
  const ActivityHeatmap({super.key});

  /// Total number of weeks shown in the heatmap.
  static const int _weekCount = 12;

  /// Total days in the grid.
  static const int _dayCount = _weekCount * 7;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final activityAsync = ref.watch(activityHeatmapProvider);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: context.unjynxShadow(UnjynxElevation.sm),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- Section title ---
          Row(
            children: [
              Icon(
                Icons.grid_view_rounded,
                color: colorScheme.primary,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Activity',
                style: Theme.of(context).textTheme.titleMedium!.copyWith(
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // --- Heatmap grid ---
          activityAsync.when(
            data: (data) =>
                _HeatmapGrid(activityData: data, isLight: isLight),
            loading: () => const _HeatmapShimmer(),
            error: (error, _) => Text(
              'Failed to load activity: $error',
              style: Theme.of(context).textTheme.bodySmall!.copyWith(
                color: colorScheme.error,
              ),
            ),
          ),

          const SizedBox(height: 12),

          // --- Legend ---
          _HeatmapLegend(
            emptyColor: isLight
                ? const Color(0xFFF0EAF5)
                : colorScheme.surfaceContainerHigh,
            level1Color: isLight
                ? const Color(0xFFD1C4E9)
                : ux.deepPurple,
            level2Color: isLight
                ? const Color(0xFF9333EA).withValues(alpha: 0.4)
                : colorScheme.primary.withValues(alpha: 0.6),
            primary: colorScheme.primary,
            gold: ux.gold,
            textSecondary: colorScheme.onSurfaceVariant,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Heatmap grid
// ---------------------------------------------------------------------------

class _HeatmapGrid extends StatelessWidget {
  const _HeatmapGrid({
    required this.activityData,
    required this.isLight,
  });

  final ActivityData activityData;
  final bool isLight;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    // Calculate the start date: go back (weekCount * 7 - 1) days from today.
    final startDate = today.subtract(
      const Duration(days: ActivityHeatmap._dayCount - 1),
    );

    // Build the list of dates and their counts.
    final dates = List.generate(
      ActivityHeatmap._dayCount,
      (i) => startDate.add(Duration(days: i)),
    );

    // Determine which months appear at the top of each column.
    final monthLabels = _buildMonthLabels(dates);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Month labels row
        Row(
          children: [
            // Spacer for day labels column
            const SizedBox(width: 20),
            Expanded(
              child: Row(
                children: List.generate(ActivityHeatmap._weekCount, (weekIdx) {
                  final label = monthLabels[weekIdx];
                  return Expanded(
                    child: Text(
                      label,
                      style: Theme.of(context).textTheme.labelSmall!.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  );
                }),
              ),
            ),
          ],
        ),

        const SizedBox(height: 4),

        // Grid: 7 rows x 12 columns
        for (int dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) ...[
          Row(
            children: [
              // Day label
              SizedBox(
                width: 20,
                child: Text(
                  _dayLabel(dayOfWeek),
                  style: Theme.of(context).textTheme.labelSmall!.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
              Expanded(
                child: Row(
                  children:
                      List.generate(ActivityHeatmap._weekCount, (weekIdx) {
                    final dayIndex = weekIdx * 7 + dayOfWeek;
                    if (dayIndex >= dates.length) {
                      return const Expanded(child: SizedBox.shrink());
                    }
                    final date = dates[dayIndex];
                    final key = _dateKey(date);
                    final count = activityData.dailyCounts[key] ?? 0;
                    final isFuture = date.isAfter(today);

                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(1.5),
                        child: AspectRatio(
                          aspectRatio: 1,
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(3),
                              color: isFuture
                                  ? Colors.transparent
                                  : _cellColor(
                                      count,
                                      isLight: isLight,
                                      gold: ux.gold,
                                      primary: colorScheme.primary,
                                      deepPurple: ux.deepPurple,
                                      surfaceContainerHigh:
                                          colorScheme.surfaceContainerHigh,
                                    ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  /// Returns the colour for a cell based on task count.
  ///
  /// 5-level scale per spec:
  /// - Level 0 (empty): light #F0EAF5, dark surfaceContainerHigh
  /// - Level 1 (1-2):   light #D1C4E9, dark deepPurple
  /// - Level 2 (3-4):   light #9333EA@40%, dark primary@60%
  /// - Level 3 (5-6):   primary (#6B21A8)
  /// - Level 4 (7+):    gold (#B8860B)
  static Color _cellColor(
    int count, {
    required bool isLight,
    required Color gold,
    required Color primary,
    required Color deepPurple,
    required Color surfaceContainerHigh,
  }) {
    if (count >= 7) return gold; // Level 4: gold
    if (count >= 5) return primary; // Level 3: primary (#6B21A8)
    if (count >= 3) {
      // Level 2
      return isLight
          ? const Color(0xFF9333EA).withValues(alpha: 0.4)
          : primary.withValues(alpha: 0.6);
    }
    if (count >= 1) {
      // Level 1
      return isLight
          ? const Color(0xFFD1C4E9)
          : deepPurple;
    }
    // Level 0: empty
    return isLight
        ? const Color(0xFFF0EAF5)
        : surfaceContainerHigh;
  }

  /// Day label for a row index (0 = Monday, 6 = Sunday).
  static String _dayLabel(int dayOfWeek) {
    const labels = ['M', '', 'W', '', 'F', '', ''];
    return labels[dayOfWeek];
  }

  /// ISO date key from a DateTime.
  static String _dateKey(DateTime date) {
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '${date.year}-$m-$d';
  }

  /// Build month labels for each week column.
  ///
  /// Shows the abbreviated month name only for the first week where
  /// that month appears, to avoid clutter.
  static List<String> _buildMonthLabels(List<DateTime> dates) {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final labels = <String>[];
    var lastMonth = -1;

    for (var weekIdx = 0; weekIdx < ActivityHeatmap._weekCount; weekIdx++) {
      // Use the first day of the week (Monday) as the representative.
      final dayIndex = weekIdx * 7;
      if (dayIndex < dates.length) {
        final month = dates[dayIndex].month;
        if (month != lastMonth) {
          labels.add(monthNames[month - 1]);
          lastMonth = month;
        } else {
          labels.add('');
        }
      } else {
        labels.add('');
      }
    }
    return labels;
  }
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

class _HeatmapLegend extends StatelessWidget {
  const _HeatmapLegend({
    required this.emptyColor,
    required this.level1Color,
    required this.level2Color,
    required this.primary,
    required this.gold,
    required this.textSecondary,
  });

  final Color emptyColor;
  final Color level1Color;
  final Color level2Color;
  final Color primary;
  final Color gold;
  final Color textSecondary;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Text(
          'Less',
          style: Theme.of(context).textTheme.labelSmall!.copyWith(
            color: textSecondary,
          ),
        ),
        const SizedBox(width: 4),
        _LegendCell(color: emptyColor),
        _LegendCell(color: level1Color),
        _LegendCell(color: level2Color),
        _LegendCell(color: primary),
        _LegendCell(color: gold),
        const SizedBox(width: 4),
        Text(
          'More',
          style: Theme.of(context).textTheme.labelSmall!.copyWith(
            color: textSecondary,
          ),
        ),
      ],
    );
  }
}

class _LegendCell extends StatelessWidget {
  const _LegendCell({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(2),
          color: color,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Loading shimmer
// ---------------------------------------------------------------------------

class _HeatmapShimmer extends StatelessWidget {
  const _HeatmapShimmer();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHigh
            .withValues(alpha: isLight ? 0.5 : 0.3),
        borderRadius: BorderRadius.circular(8),
      ),
    );
  }
}
