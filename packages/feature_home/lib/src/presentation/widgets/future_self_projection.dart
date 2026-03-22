import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// Retention Hook #8: Future Self Projection.
///
/// Shows "At this pace, you'll finish [X] tasks by [date]" based on the
/// user's average daily completion rate from recent streak and personal
/// bests data. Placed on the Progress Hub below the weekly insight.
///
/// This subtle motivator connects present actions to future outcomes,
/// encouraging continued engagement.
class FutureSelfProjection extends ConsumerWidget {
  const FutureSelfProjection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final personalBestsAsync = ref.watch(personalBestsProvider);
    final streakAsync = ref.watch(homeStreakProvider);
    final ringsAsync = ref.watch(homeProgressRingsProvider);

    // Need all three to compute projection.
    final personalBests = personalBestsAsync.valueOrNull;
    final streak = streakAsync.valueOrNull;
    final rings = ringsAsync.valueOrNull;

    if (personalBests == null || streak == null || rings == null) {
      return const SizedBox.shrink();
    }

    // Calculate average daily completion rate.
    // Use totalCompleted / max(longestStreak, currentStreak, 1) as a rough
    // average. If we have no history, don't show the projection.
    final activeDays = streak.longestStreak > streak.currentStreak
        ? streak.longestStreak
        : streak.currentStreak;

    if (activeDays < 1 || personalBests.totalCompleted < 1) {
      return const SizedBox.shrink();
    }

    final avgPerDay = personalBests.totalCompleted / activeDays;

    // Project out 30 days.
    final projectedTasks = (avgPerDay * 30).round();
    final projectedDate = DateTime.now().add(const Duration(days: 30));
    final dateStr = _formatDate(projectedDate);

    return _ProjectionCard(
      avgPerDay: avgPerDay,
      projectedTasks: projectedTasks,
      dateStr: dateStr,
    );
  }

  static String _formatDate(DateTime dt) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[dt.month - 1]} ${dt.day}';
  }
}

class _ProjectionCard extends StatelessWidget {
  const _ProjectionCard({
    required this.avgPerDay,
    required this.projectedTasks,
    required this.dateStr,
  });

  final double avgPerDay;
  final int projectedTasks;
  final String dateStr;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isLight
            ? colorScheme.surfaceContainerLowest
            : colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isLight
              ? colorScheme.primary.withValues(alpha: 0.1)
              : colorScheme.surfaceContainerHigh,
        ),
        boxShadow: context.unjynxShadow(UnjynxElevation.sm),
      ),
      child: Row(
        children: [
          // Crystal ball icon.
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: colorScheme.primary.withValues(alpha: isLight ? 0.1 : 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.insights_rounded,
              color: colorScheme.primary,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),

          // Projection text.
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Future You',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 2),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: 'At this pace, you\'ll complete ',
                        style: TextStyle(
                          fontSize: 13,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      TextSpan(
                        text: '$projectedTasks tasks',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      TextSpan(
                        text: ' by $dateStr.',
                        style: TextStyle(
                          fontSize: 13,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '~${avgPerDay.toStringAsFixed(1)} tasks/day',
                  style: TextStyle(
                    fontSize: 11,
                    color: ux.textTertiary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
