import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// A 2x2 grid of lifetime personal best statistics.
///
/// Displays four achievement stats:
/// - **Most tasks in a day** (trophy icon)
/// - **Longest streak** (flame icon)
/// - **Total completed** (check_circle icon)
/// - **Total focus minutes** (timer icon)
///
/// Each cell uses a subtle elevated surface and icon accent colour.
class PersonalBestsCard extends ConsumerWidget {
  const PersonalBestsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final bestsAsync = ref.watch(personalBestsProvider);

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
                Icons.emoji_events_rounded,
                color: ux.gold,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Personal Bests',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // --- Stats grid ---
          bestsAsync.when(
            data: (bests) => _BestsGrid(bests: bests),
            loading: () => const _BestsShimmer(),
            error: (error, _) => Text(
              'Failed to load stats: $error',
              style: TextStyle(color: colorScheme.error, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Bests grid (2x2)
// ---------------------------------------------------------------------------

class _BestsGrid extends StatelessWidget {
  const _BestsGrid({required this.bests});

  final PersonalBests bests;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StatCell(
                icon: Icons.emoji_events_rounded,
                iconColor: ux.gold,
                value: '${bests.mostTasksInDay}',
                label: 'Best Day',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCell(
                icon: Icons.local_fire_department_rounded,
                iconColor: ux.gold,
                value: '${bests.longestStreak}',
                label: 'Top Streak',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _StatCell(
                icon: Icons.check_circle_rounded,
                iconColor: ux.success,
                value: _formatLargeNumber(bests.totalCompleted),
                label: 'Completed',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCell(
                icon: Icons.timer_rounded,
                iconColor: colorScheme.primary,
                value: _formatMinutes(bests.totalFocusMinutes),
                label: 'Focus Time',
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Formats large numbers with K suffix (e.g. 1234 -> "1.2K").
  static String _formatLargeNumber(int value) {
    if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(1)}K';
    }
    return '$value';
  }

  /// Formats minutes into a human-readable string (e.g. "2h 30m").
  static String _formatMinutes(int minutes) {
    if (minutes >= 60) {
      final h = minutes ~/ 60;
      final m = minutes % 60;
      return m > 0 ? '${h}h ${m}m' : '${h}h';
    }
    return '${minutes}m';
  }
}

// ---------------------------------------------------------------------------
// Individual stat cell
// ---------------------------------------------------------------------------

class _StatCell extends StatelessWidget {
  const _StatCell({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(14),
        boxShadow: context.unjynxShadow(UnjynxElevation.sm),
      ),
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: textTheme.displaySmall?.copyWith(
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
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

// ---------------------------------------------------------------------------
// Loading shimmer
// ---------------------------------------------------------------------------

class _BestsShimmer extends StatelessWidget {
  const _BestsShimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _shimmerCell(context)),
            const SizedBox(width: 12),
            Expanded(child: _shimmerCell(context)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _shimmerCell(context)),
            const SizedBox(width: 12),
            Expanded(child: _shimmerCell(context)),
          ],
        ),
      ],
    );
  }

  Widget _shimmerCell(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Container(
      height: 90,
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHigh
            .withValues(alpha: isLight ? 0.5 : 0.4),
        borderRadius: BorderRadius.circular(14),
      ),
    );
  }
}
