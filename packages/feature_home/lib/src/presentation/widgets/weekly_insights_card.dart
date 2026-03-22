import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// Card displaying a rotating weekly insight with a vivid purple accent.
///
/// Shows contextual insights based on the user's recent activity, such as
/// streak progress, completion rate changes, or most productive day.
/// A left border accent in primary gives visual emphasis.
class WeeklyInsightsCard extends ConsumerWidget {
  const WeeklyInsightsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final insightAsync = ref.watch(weeklyInsightProvider);

    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        color: isLight
            ? colorScheme.surfaceContainerLowest
            : colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border(
          left: BorderSide(
            color: colorScheme.primary,
            width: 4,
          ),
        ),
        boxShadow: context.unjynxShadow(UnjynxElevation.sm),
      ),
      child: insightAsync.when(
        data: (insight) => _InsightContent(insight: insight),
        loading: () => const _InsightShimmer(),
        error: (error, _) => Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Failed to load insight: $error',
            style: TextStyle(color: colorScheme.error, fontSize: 13),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Insight content
// ---------------------------------------------------------------------------

class _InsightContent extends StatelessWidget {
  const _InsightContent({required this.insight});

  final WeeklyInsight insight;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- Sparkle icon ---
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(
              Icons.auto_awesome_rounded,
              color: ux.gold,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),

          // --- Text content ---
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Weekly Insight',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: _badgeColor(
                          insight.type,
                          colorScheme: colorScheme,
                          ux: ux,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        insight.type,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  insight.text,
                  style: TextStyle(
                    fontSize: 14,
                    color: colorScheme.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Badge background colour based on insight type.
  ///
  /// Light uses wash colors for subtle tints; dark uses alpha-based tints.
  static Color _badgeColor(
    String type, {
    required ColorScheme colorScheme,
    required UnjynxCustomColors ux,
  }) {
    final isLight = colorScheme.brightness == Brightness.light;
    switch (type) {
      case 'streak':
        return isLight ? ux.goldWash : ux.gold.withValues(alpha: 0.2);
      case 'completion':
        return isLight ? ux.successWash : ux.success.withValues(alpha: 0.2);
      case 'productivity':
        return colorScheme.primary.withValues(alpha: isLight ? 0.12 : 0.2);
      default:
        return colorScheme.surfaceContainerHigh;
    }
  }
}

// ---------------------------------------------------------------------------
// Loading shimmer
// ---------------------------------------------------------------------------

class _InsightShimmer extends StatelessWidget {
  const _InsightShimmer();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final shimmerAlpha = isLight ? 0.5 : 0.4;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: colorScheme.surfaceContainerHigh
                  .withValues(alpha: shimmerAlpha),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 120,
                  height: 14,
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHigh
                        .withValues(alpha: shimmerAlpha),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 14,
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHigh
                        .withValues(alpha: shimmerAlpha),
                    borderRadius: BorderRadius.circular(4),
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
