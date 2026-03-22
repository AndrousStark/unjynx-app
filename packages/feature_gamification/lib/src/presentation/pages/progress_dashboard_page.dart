import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/leaderboard_entry.dart';
import '../providers/gamification_providers.dart';
import '../widgets/category_breakdown_chart.dart';
import '../widgets/completion_trend_chart.dart';
import '../widgets/leaderboard_tile.dart';
import '../widgets/productivity_by_day_chart.dart';
import '../widgets/productivity_by_hour_chart.dart';

/// I2 - Progress Dashboard with analytics charts.
class ProgressDashboardPage extends ConsumerWidget {
  const ProgressDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Progress Dashboard'),
        actions: [
          // Export PDF button (Pro feature)
          IconButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              _showProBadge(context);
            },
            tooltip: 'Export PDF (Pro)',
            icon: Stack(
              children: [
                const Icon(Icons.picture_as_pdf_outlined),
                Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 4,
                      vertical: 1,
                    ),
                    decoration: BoxDecoration(
                      color: ux.gold,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      'PRO',
                      style: textTheme.labelMedium?.copyWith(
                        fontSize: 7,
                        fontWeight: FontWeight.w700,
                        color: isLight ? Colors.white : Colors.black,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: colorScheme.primary,
        onRefresh: () async {
          ref.invalidate(completionTrendProvider);
          ref.invalidate(productivityByDayProvider);
          ref.invalidate(productivityByHourProvider);
          ref.invalidate(categoryBreakdownProvider);
          ref.invalidate(leaderboardProvider);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          children: [
            // Trend range selector
          const _TrendRangeSelector(),
          const SizedBox(height: 16),

          // 1. Completion Trend
          _ChartSection(
            title: 'Completion Trend',
            icon: Icons.trending_up_rounded,
            child: ref.watch(completionTrendProvider).when(
                  data: (data) => CompletionTrendChart(dataPoints: data),
                  loading: () => const _ChartPlaceholder(),
                  error: (e, _) => _ChartError(error: e),
                ),
          ),
          const SizedBox(height: 20),

          // 2. Productivity by Day
          _ChartSection(
            title: 'Productivity by Day',
            icon: Icons.calendar_view_week_rounded,
            child: ref.watch(productivityByDayProvider).when(
                  data: (data) => ProductivityByDayChart(data: data),
                  loading: () => const _ChartPlaceholder(),
                  error: (e, _) => _ChartError(error: e),
                ),
          ),
          const SizedBox(height: 20),

          // 3. Productivity by Hour (Heatmap)
          _ChartSection(
            title: 'Productivity by Hour',
            icon: Icons.access_time_rounded,
            child: ref.watch(productivityByHourProvider).when(
                  data: (data) => ProductivityByHourChart(data: data),
                  loading: () => const _ChartPlaceholder(),
                  error: (e, _) => _ChartError(error: e),
                ),
          ),
          const SizedBox(height: 20),

          // 4. Category Breakdown
          _ChartSection(
            title: 'Category Breakdown',
            icon: Icons.pie_chart_outline_rounded,
            child: ref.watch(categoryBreakdownProvider).when(
                  data: (data) => CategoryBreakdownChart(data: data),
                  loading: () => const _ChartPlaceholder(),
                  error: (e, _) => _ChartError(error: e),
                ),
          ),
          const SizedBox(height: 20),

          // 5. Leaderboard
          _ChartSection(
            title: 'Leaderboard',
            icon: Icons.leaderboard_rounded,
            child: ref.watch(leaderboardProvider).when(
                  data: (List<LeaderboardEntry> entries) => entries.isEmpty
                      ? SizedBox(
                          height: 120,
                          child: Center(
                            child: Text(
                              'No leaderboard data yet.\n'
                              'Complete tasks to climb the ranks!',
                              textAlign: TextAlign.center,
                              style: textTheme.bodyMedium?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                        )
                      : Column(
                          children: [
                            for (final entry in entries)
                              LeaderboardTile(entry: entry),
                          ],
                        ),
                  loading: () => const _ChartPlaceholder(),
                  error: (e, _) => _ChartError(error: e),
                ),
          ),
          const SizedBox(height: 40),
        ],
        ),
      ),
    );
  }

  void _showProBadge(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Export to PDF is a Pro feature'),
        backgroundColor: context.unjynx.gold,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Trend range selector
// ---------------------------------------------------------------------------

class _TrendRangeSelector extends ConsumerWidget {
  const _TrendRangeSelector();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(trendRangeProvider);

    return SizedBox(
      width: double.infinity,
      child: SegmentedButton<TrendRange>(
        segments: const [
          ButtonSegment(value: TrendRange.days30, label: Text('30 Days')),
          ButtonSegment(value: TrendRange.days90, label: Text('90 Days')),
          ButtonSegment(value: TrendRange.year, label: Text('Year')),
        ],
        selected: {selected},
        onSelectionChanged: (selection) {
          HapticFeedback.selectionClick();
          ref.read(trendRangeProvider.notifier).set(selection.first);
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Chart section wrapper
// ---------------------------------------------------------------------------

class _ChartSection extends StatelessWidget {
  const _ChartSection({
    required this.title,
    required this.icon,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: isLight
            ? UnjynxShadows.lightMd
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Loading / error placeholders
// ---------------------------------------------------------------------------

class _ChartPlaceholder extends StatelessWidget {
  const _ChartPlaceholder();

  @override
  Widget build(BuildContext context) {
    return const UnjynxShimmerBox(
      height: 200,
      width: double.infinity,
      borderRadius: 16,
    );
  }
}

class _ChartError extends StatelessWidget {
  const _ChartError({required this.error});

  final Object error;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: UnjynxErrorView(
        type: ErrorViewType.serverError,
        title: 'Failed to load chart',
        compact: true,
      ),
    );
  }
}
