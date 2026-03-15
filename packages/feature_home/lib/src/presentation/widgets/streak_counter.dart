import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// Large streak display with flame icon, personal best, and 14-day strip.
///
/// Shows the current consecutive-day streak prominently in gold, alongside
/// a flame icon. Below the main number, a subtitle shows the all-time
/// personal best. The 14-day activity strip visualises recent consistency
/// using small filled/empty circles.
class StreakCounter extends ConsumerWidget {
  const StreakCounter({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final streakAsync = ref.watch(homeStreakProvider);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: context.unjynxShadow(UnjynxElevation.sm),
      ),
      child: streakAsync.when(
        data: (streak) => _StreakContent(streak: streak),
        loading: () => const _StreakShimmer(),
        error: (error, _) => Center(
          child: Text(
            'Failed to load streak: $error',
            style: TextStyle(color: colorScheme.error, fontSize: 13),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Streak content (data loaded)
// ---------------------------------------------------------------------------

class _StreakContent extends StatelessWidget {
  const _StreakContent({required this.streak});

  final StreakData streak;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    final isLight = context.isLightMode;

    return Column(
      children: [
        // --- Main streak number + flame ---
        // Light: gold shadow pulse; Dark: gold glow
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: ux.gold.withValues(alpha: isLight ? 0.15 : 0.25),
                blurRadius: isLight ? 12 : 20,
                spreadRadius: isLight ? 0 : 2,
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.local_fire_department_rounded,
                color: ux.gold,
                size: 36,
              ),
              const SizedBox(width: 8),
              Text(
                '${streak.currentStreak}',
                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                  color: ux.gold,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 4),

        // --- "day streak" label ---
        Text(
          streak.currentStreak == 1 ? 'day streak' : 'days streak',
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),

        const SizedBox(height: 8),

        // --- Personal best subtitle ---
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.emoji_events_rounded,
              color: ux.darkGold,
              size: 16,
            ),
            const SizedBox(width: 4),
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'Personal best: ',
                    style: TextStyle(
                      fontSize: 13,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  TextSpan(
                    text: '${streak.longestStreak}',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontSize: 16,
                    ),
                  ),
                  TextSpan(
                    text: ' days',
                    style: TextStyle(
                      fontSize: 13,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 20),

        // --- 14-day activity strip ---
        const _FourteenDayStrip(),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// 14-day strip
// ---------------------------------------------------------------------------

/// Displays 14 small circles representing the last 14 days.
///
/// - **Gold filled**: active day (streak was maintained)
/// - **surfaceContainerHigh**: missed day (no activity)
///
/// In future phases, a blue outline will indicate a freeze was used.
/// For now, all days before the current streak start are shown as missed.
class _FourteenDayStrip extends ConsumerWidget {
  const _FourteenDayStrip();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final streakAsync = ref.watch(homeStreakProvider);

    return streakAsync.when(
      data: (streak) {
        // Build 14 dots from 13 days ago to today.
        // Days within the streak range are filled; others are empty.
        final now = DateTime.now();
        final today = DateTime(now.year, now.month, now.day);

        return Column(
          children: [
            // Day labels
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(14, (i) {
                final date = today.subtract(Duration(days: 13 - i));
                final dayName = _shortDayName(date.weekday);
                return SizedBox(
                  width: 18,
                  child: Text(
                    dayName,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 9,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 6),
            // Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(14, (i) {
                // i=0 is 13 days ago, i=13 is today.
                final daysAgo = 13 - i;
                final isActive = daysAgo < streak.currentStreak;
                return _DayDot(isActive: isActive);
              }),
            ),
          ],
        );
      },
      loading: () => const SizedBox(height: 30),
      error: (_, __) => const SizedBox(height: 30),
    );
  }

  /// Returns a single-char day name.
  static String _shortDayName(int weekday) {
    const names = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return names[weekday - 1];
  }
}

// ---------------------------------------------------------------------------
// Individual day dot
// ---------------------------------------------------------------------------

class _DayDot extends StatelessWidget {
  const _DayDot({required this.isActive});

  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    final isLight = context.isLightMode;

    return Container(
      width: 14,
      height: 14,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isActive ? ux.gold : colorScheme.surfaceContainerHigh,
        border: isActive
            ? null
            : Border.all(
                color: isLight
                    ? colorScheme.surfaceContainerHighest
                    : colorScheme.surfaceContainerHigh,
                width: 1.5,
              ),
        // Active dots get a subtle gold glow in dark mode
        boxShadow: isActive && !isLight
            ? [
                BoxShadow(
                  color: ux.gold.withValues(alpha: 0.3),
                  blurRadius: 4,
                ),
              ]
            : null,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Loading shimmer
// ---------------------------------------------------------------------------

class _StreakShimmer extends StatelessWidget {
  const _StreakShimmer();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final shimmerAlpha = isLight ? 0.5 : 0.4;

    return Column(
      children: [
        Container(
          width: 100,
          height: 48,
          decoration: BoxDecoration(
            color: colorScheme.surfaceContainerHigh
                .withValues(alpha: shimmerAlpha),
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          width: 140,
          height: 14,
          decoration: BoxDecoration(
            color: colorScheme.surfaceContainerHigh
                .withValues(alpha: shimmerAlpha),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(
            14,
            (_) => Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: colorScheme.surfaceContainerHigh
                    .withValues(alpha: shimmerAlpha),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
