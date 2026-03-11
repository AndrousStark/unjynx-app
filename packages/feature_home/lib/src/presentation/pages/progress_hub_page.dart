import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:feature_home/src/presentation/widgets/activity_heatmap.dart';
import 'package:feature_home/src/presentation/widgets/personal_bests_card.dart';
import 'package:feature_home/src/presentation/widgets/progress_rings.dart';
import 'package:feature_home/src/presentation/widgets/streak_counter.dart';
import 'package:feature_home/src/presentation/widgets/weekly_insights_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// Progress Hub -- detailed analytics dashboard accessible from the home page.
///
/// A scrollable screen that feels data-rich but clean, inspired by Apple
/// Fitness and Strava. Composed of five sections:
///
/// 1. [ProgressRings] - reused concentric ring widget from home
/// 2. [StreakCounter] - current streak with flame, personal best, 14-day strip
/// 3. [ActivityHeatmap] - GitHub contribution-style heatmap (last 12 weeks)
/// 4. [WeeklyInsightsCard] - contextual rotating weekly insight
/// 5. [PersonalBestsCard] - lifetime records in a 2x2 grid
///
/// Pull-to-refresh invalidates all Progress Hub providers.
class ProgressHubPage extends ConsumerWidget {
  const ProgressHubPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Scaffold(
      backgroundColor: colorScheme.surfaceContainerLowest,
      appBar: AppBar(
        title: const Text(
          'Progress',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        backgroundColor: colorScheme.surfaceContainerLowest,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: ux.gold,
          backgroundColor: colorScheme.surface,
          onRefresh: () async {
            ref
              ..invalidate(homeProgressRingsProvider)
              ..invalidate(homeStreakProvider)
              ..invalidate(activityHeatmapProvider)
              ..invalidate(weeklyInsightProvider)
              ..invalidate(personalBestsProvider);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                sliver: SliverToBoxAdapter(
                  child: StaggeredColumn(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. Progress Rings (tap disabled to avoid loop)
                      GestureDetector(
                        onTap: () => HapticFeedback.lightImpact(),
                        child: const ProgressRings(navigateOnTap: false),
                      ),
                      const SizedBox(height: 20),

                      // 2. Streak Counter
                      GestureDetector(
                        onTap: () => HapticFeedback.lightImpact(),
                        child: const StreakCounter(),
                      ),
                      const SizedBox(height: 20),

                      // 3. Activity Heatmap
                      GestureDetector(
                        onTap: () => HapticFeedback.lightImpact(),
                        child: const ActivityHeatmap(),
                      ),
                      const SizedBox(height: 20),

                      // 4. Weekly Insight
                      GestureDetector(
                        onTap: () => HapticFeedback.lightImpact(),
                        child: const WeeklyInsightsCard(),
                      ),
                      const SizedBox(height: 20),

                      // 5. Personal Bests
                      GestureDetector(
                        onTap: () => HapticFeedback.lightImpact(),
                        child: const PersonalBestsCard(),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
