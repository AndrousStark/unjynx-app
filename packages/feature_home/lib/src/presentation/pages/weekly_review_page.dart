import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// H5 - Weekly Review Page.
///
/// A productivity review that aggregates existing data from progress and
/// home providers, enhanced with ML-powered insights:
///
/// 1. Week date range header
/// 2. Stats cards (tasks, focus, streak, projects)
/// 3. Completion trend mini-chart (last 7 days from heatmap data)
/// 3b. AI Detected Patterns (ML-powered, graceful fallback)
/// 3c. Energy Forecast Mini-Chart (ML-powered, graceful fallback)
/// 4. Top accomplishments (top 3 completed tasks by priority)
/// 5. Carry forward (overdue/incomplete tasks from last week)
/// 5b. Smart Next Week Plan (ML-powered, graceful fallback)
/// 6. Next week focus (tasks due next week, grouped by day)
///
/// ML sections (3b, 3c, 5b) are hidden when the ML service is unavailable
/// or returns empty data, ensuring the page degrades gracefully.
///
/// Pull-to-refresh invalidates all relevant providers.
class WeeklyReviewPage extends ConsumerWidget {
  const WeeklyReviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;

    return Scaffold(
      backgroundColor: colorScheme.surfaceContainerLowest,
      appBar: AppBar(
        title: const Text(
          'Weekly Review',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
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
              ..invalidate(homeTodayTasksProvider)
              ..invalidate(homeUpcomingTasksProvider)
              ..invalidate(activityHeatmapProvider)
              ..invalidate(personalBestsProvider)
              ..invalidate(weeklyPatternsProvider)
              ..invalidate(energyForecastProvider)
              ..invalidate(smartSuggestionsProvider);
            // Invalidate the current and next month calendar tasks.
            final now = DateTime.now();
            ref
              ..invalidate(calendarTasksProvider(
                DateTime(now.year, now.month),
              ))
              ..invalidate(calendarTasksProvider(
                DateTime(now.year, now.month + 1),
              ));
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
                      // 1. Week header
                      _WeekHeader(textTheme: textTheme, ux: ux),
                      const SizedBox(height: 20),

                      // 2. Stats cards
                      _StatsGrid(ref: ref, ux: ux),
                      const SizedBox(height: 20),

                      // 3. Completion trend mini-chart
                      _CompletionTrendSection(ref: ref, ux: ux),
                      const SizedBox(height: 20),

                      // 3b. AI Detected Patterns (hidden if ML unavailable)
                      _AiPatternsSection(ref: ref, ux: ux),

                      // 3c. Energy Forecast Mini-Chart (hidden if ML unavailable)
                      _EnergyForecastSection(ref: ref, ux: ux),

                      // 4. Top accomplishments
                      _TopAccomplishments(ref: ref, ux: ux),
                      const SizedBox(height: 20),

                      // 5. Carry forward
                      _CarryForwardSection(ref: ref, ux: ux),
                      const SizedBox(height: 20),

                      // 5b. Smart Next Week Plan (hidden if ML unavailable)
                      _SmartSuggestionsSection(ref: ref, ux: ux),

                      // 6. Next week focus
                      _NextWeekFocus(ref: ref, ux: ux),
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

// ---------------------------------------------------------------------------
// 1. Week header
// ---------------------------------------------------------------------------

class _WeekHeader extends StatelessWidget {
  const _WeekHeader({required this.textTheme, required this.ux});

  final TextTheme textTheme;
  final UnjynxCustomColors ux;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    // Go back to most recent Monday.
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final weekEnd = weekStart.add(const Duration(days: 6));

    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    final startLabel = '${months[weekStart.month - 1]} ${weekStart.day}';
    final endLabel =
        '${months[weekEnd.month - 1]} ${weekEnd.day}, ${weekEnd.year}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$startLabel - $endLabel',
          style: textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Your week at a glance',
          style: textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Stats grid (2x2)
// ---------------------------------------------------------------------------

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.ref, required this.ux});

  final WidgetRef ref;
  final UnjynxCustomColors ux;

  @override
  Widget build(BuildContext context) {
    final ringsAsync = ref.watch(homeProgressRingsProvider);
    final streakAsync = ref.watch(homeStreakProvider);

    return ringsAsync.when(
      loading: () => const _StatsShimmer(),
      error: (_, __) => const _StatsShimmer(),
      data: (rings) {
        final streak = streakAsync.valueOrNull;
        return _buildGrid(context, rings, streak);
      },
    );
  }

  Widget _buildGrid(
    BuildContext context,
    ProgressRingsData rings,
    StreakData? streak,
  ) {
    final colorScheme = Theme.of(context).colorScheme;

    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.6,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _StatCard(
          icon: Icons.check_circle_outline,
          label: 'Tasks Done',
          value: '${rings.tasksCompleted}/${rings.tasksTotal}',
          color: ux.success,
          onTap: () => HapticFeedback.lightImpact(),
        ),
        _StatCard(
          icon: Icons.timer_outlined,
          label: 'Focus Minutes',
          value: '${rings.focusMinutes}',
          color: colorScheme.primary,
          onTap: () => HapticFeedback.lightImpact(),
        ),
        _StatCard(
          icon: Icons.local_fire_department,
          label: 'Streak Days',
          value: '${streak?.currentStreak ?? 0}',
          color: ux.gold,
          onTap: () => HapticFeedback.lightImpact(),
        ),
        _StatCard(
          icon: Icons.folder_outlined,
          label: 'Habits Done',
          value: '${rings.habitsCompleted}/${rings.habitsTotal}',
          color: ux.info,
          onTap: () => HapticFeedback.lightImpact(),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;

    return PressableScale(
      onPressed: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: ux.shadowBase.withValues(alpha: 0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 22),
            const Spacer(),
            Text(
              value,
              style: textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatsShimmer extends StatelessWidget {
  const _StatsShimmer();

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.6,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: List.generate(
        4,
        (_) => const UnjynxShimmerBox(borderRadius: 16),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Completion trend mini-chart (last 7 days)
// ---------------------------------------------------------------------------

class _CompletionTrendSection extends StatelessWidget {
  const _CompletionTrendSection({required this.ref, required this.ux});

  final WidgetRef ref;
  final UnjynxCustomColors ux;

  @override
  Widget build(BuildContext context) {
    final heatmapAsync = ref.watch(activityHeatmapProvider);
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: ux.shadowBase.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Completion Trend',
            style: textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Tasks completed per day this week',
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          heatmapAsync.when(
            loading: () => const UnjynxShimmerBox(height: 120, borderRadius: 8),
            error: (_, __) => const SizedBox(
              height: 120,
              child: Center(child: Text('Unable to load trend data')),
            ),
            data: (activity) => _MiniTrendChart(
              activity: activity,
              accentColor: colorScheme.primary,
              goldColor: ux.gold,
            ),
          ),
        ],
      ),
    );
  }
}

/// A minimal 7-day bar chart built with [CustomPaint].
///
/// Does not require fl_chart, keeping feature_home dependency-free.
class _MiniTrendChart extends StatelessWidget {
  const _MiniTrendChart({
    required this.activity,
    required this.accentColor,
    required this.goldColor,
  });

  final ActivityData activity;
  final Color accentColor;
  final Color goldColor;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    // Collect last 7 days of data.
    final dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final counts = <int>[];
    for (int i = 0; i < 7; i++) {
      final day = weekStart.add(Duration(days: i));
      final key =
          '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
      counts.add(activity.dailyCounts[key] ?? 0);
    }
    final maxCount = counts.fold<int>(0, (a, b) => a > b ? a : b);

    return SizedBox(
      height: 120,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(7, (i) {
          final fraction =
              maxCount > 0 ? (counts[i] / maxCount).clamp(0.0, 1.0) : 0.0;
          final isToday = i == now.weekday - 1;

          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  // Count label above bar
                  if (counts[i] > 0)
                    Text(
                      '${counts[i]}',
                      style: textTheme.bodySmall?.copyWith(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: isToday ? goldColor : colorScheme.onSurface,
                      ),
                    ),
                  const SizedBox(height: 4),
                  // Bar
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.easeOut,
                    height: fraction * 72 + 4, // min 4px even if 0
                    decoration: BoxDecoration(
                      color: isToday
                          ? goldColor
                          : accentColor.withValues(
                              alpha: 0.3 + fraction * 0.7,
                            ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Day label
                  Text(
                    dayLabels[i],
                    style: textTheme.bodySmall?.copyWith(
                      fontSize: 10,
                      fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                      color: isToday
                          ? goldColor
                          : colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Top accomplishments (top 3 completed tasks by priority)
// ---------------------------------------------------------------------------

class _TopAccomplishments extends StatelessWidget {
  const _TopAccomplishments({required this.ref, required this.ux});

  final WidgetRef ref;
  final UnjynxCustomColors ux;

  @override
  Widget build(BuildContext context) {
    final todayAsync = ref.watch(homeTodayTasksProvider);
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: ux.shadowBase.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.emoji_events, color: ux.gold, size: 20),
              const SizedBox(width: 8),
              Text(
                'Top Accomplishments',
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          todayAsync.when(
            loading: () => Column(
              children: List.generate(
                3,
                (_) => const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: UnjynxShimmerBox(height: 44, borderRadius: 10),
                ),
              ),
            ),
            error: (_, __) => Text(
              'Unable to load accomplishments',
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            data: (tasks) {
              final completed =
                  tasks.where((t) => t.isCompleted).toList();

              // Sort by priority (urgent first).
              final priorityOrder = {
                HomeTaskPriority.urgent: 0,
                HomeTaskPriority.high: 1,
                HomeTaskPriority.medium: 2,
                HomeTaskPriority.low: 3,
                HomeTaskPriority.none: 4,
              };
              final sorted = [...completed]..sort(
                  (a, b) => (priorityOrder[a.priority] ?? 4)
                      .compareTo(priorityOrder[b.priority] ?? 4),
                );

              final top3 = sorted.take(3).toList();

              if (top3.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    'Complete tasks to see your top accomplishments here.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                );
              }

              return Column(
                children: [
                  for (int i = 0; i < top3.length; i++) ...[
                    _AccomplishmentTile(
                      task: top3[i],
                      rank: i + 1,
                    ),
                    if (i < top3.length - 1) const SizedBox(height: 8),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _AccomplishmentTile extends StatelessWidget {
  const _AccomplishmentTile({required this.task, required this.rank});

  final HomeTask task;
  final int rank;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final priorityColor =
        unjynxPriorityColor(context, task.priority.name);

    return GestureDetector(
      onTap: () => HapticFeedback.lightImpact(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            // Rank badge
            Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: priorityColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Text(
                '#$rank',
                style: textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: priorityColor,
                  fontSize: 11,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                task.title,
                style: textTheme.bodyMedium?.copyWith(
                  decoration: TextDecoration.lineThrough,
                  color: colorScheme.onSurface.withValues(alpha: 0.7),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.check_circle,
              color: context.unjynx.success,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Carry forward (overdue / incomplete from this week)
// ---------------------------------------------------------------------------

class _CarryForwardSection extends StatelessWidget {
  const _CarryForwardSection({required this.ref, required this.ux});

  final WidgetRef ref;
  final UnjynxCustomColors ux;

  @override
  Widget build(BuildContext context) {
    final todayAsync = ref.watch(homeTodayTasksProvider);
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: ux.shadowBase.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.arrow_forward, color: ux.warning, size: 20),
              const SizedBox(width: 8),
              Text(
                'Carry Forward',
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Incomplete tasks to tackle next week',
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          todayAsync.when(
            loading: () => Column(
              children: List.generate(
                2,
                (_) => const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: UnjynxShimmerBox(height: 44, borderRadius: 10),
                ),
              ),
            ),
            error: (_, __) => Text(
              'Unable to load tasks',
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            data: (tasks) {
              final now = DateTime.now();
              final todayStart = DateTime(now.year, now.month, now.day);

              // Overdue or incomplete tasks that had a due date in the past.
              final carryForward = tasks.where((t) {
                if (t.isCompleted) return false;
                if (t.dueDate == null) return false;
                return t.dueDate!.isBefore(todayStart);
              }).toList();

              if (carryForward.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      Icon(
                        Icons.celebration,
                        color: ux.gold,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Nothing to carry forward -- you cleared everything!',
                          style: textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }

              return Column(
                children: [
                  for (int i = 0; i < carryForward.length; i++) ...[
                    _CarryForwardTile(task: carryForward[i]),
                    if (i < carryForward.length - 1)
                      const SizedBox(height: 8),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _CarryForwardTile extends StatelessWidget {
  const _CarryForwardTile({required this.task});

  final HomeTask task;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final priorityColor =
        unjynxPriorityColor(context, task.priority.name);

    final overdueDays = task.dueDate != null
        ? DateTime.now().difference(task.dueDate!).inDays
        : 0;

    return GestureDetector(
      onTap: () => HapticFeedback.lightImpact(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: ux.warningWash,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            // Priority dot
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: priorityColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                task.title,
                style: textTheme.bodyMedium,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (overdueDays > 0) ...[
              const SizedBox(width: 8),
              Text(
                '${overdueDays}d overdue',
                style: textTheme.bodySmall?.copyWith(
                  color: colorScheme.error,
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 3b. AI Detected Patterns (graceful fallback — hidden when ML unavailable)
// ---------------------------------------------------------------------------

class _AiPatternsSection extends StatelessWidget {
  const _AiPatternsSection({required this.ref, required this.ux});

  final WidgetRef ref;
  final UnjynxCustomColors ux;

  @override
  Widget build(BuildContext context) {
    final patternsAsync = ref.watch(weeklyPatternsProvider);

    return patternsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (data) {
        // Hide section if no patterns or only insufficient-data marker.
        if (data.patterns.isEmpty) return const SizedBox.shrink();
        if (data.patterns.length == 1 &&
            data.patterns.first['type'] == 'insufficient_data') {
          return const SizedBox.shrink();
        }

        final colorScheme = Theme.of(context).colorScheme;
        final textTheme = Theme.of(context).textTheme;

        return Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: ux.shadowBase.withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.insights, color: ux.info, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Detected Patterns',
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'AI-powered insights from your activity',
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                for (int i = 0; i < data.patterns.length; i++) ...[
                  _PatternTile(
                    pattern: data.patterns[i],
                    infoColor: ux.info,
                  ),
                  if (i < data.patterns.length - 1) const SizedBox(height: 8),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _PatternTile extends StatelessWidget {
  const _PatternTile({required this.pattern, required this.infoColor});

  final Map<String, dynamic> pattern;
  final Color infoColor;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final type = (pattern['type'] as String?) ?? '';
    final description = (pattern['description'] as String?) ?? '';
    final confidence = ((pattern['confidence'] as num?)?.toDouble() ?? 0.0)
        .clamp(0.0, 1.0);

    final icon = switch (type) {
      'weekly_peak' => Icons.calendar_today,
      'trend' => Icons.trending_up,
      'consistency' => Icons.equalizer,
      _ => Icons.lightbulb_outline,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: infoColor.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, color: infoColor, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  description,
                  style: textTheme.bodyMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                // Confidence bar
                Row(
                  children: [
                    Text(
                      '${(confidence * 100).toInt()}% confidence',
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(
                          value: confidence,
                          minHeight: 4,
                          backgroundColor:
                              colorScheme.onSurface.withValues(alpha: 0.08),
                          valueColor: AlwaysStoppedAnimation<Color>(
                            infoColor.withValues(alpha: 0.6),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 3c. Energy Forecast Mini-Chart (graceful fallback — hidden when ML unavailable)
// ---------------------------------------------------------------------------

class _EnergyForecastSection extends StatelessWidget {
  const _EnergyForecastSection({required this.ref, required this.ux});

  final WidgetRef ref;
  final UnjynxCustomColors ux;

  @override
  Widget build(BuildContext context) {
    final forecastAsync = ref.watch(energyForecastProvider);

    return forecastAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (data) {
        // Hide if no data or all zero-confidence (unfitted model).
        if (data.forecast.isEmpty) return const SizedBox.shrink();
        final hasRealData = data.forecast.any(
          (e) => ((e['confidence'] as num?)?.toDouble() ?? 0.0) > 0.0,
        );
        if (!hasRealData) return const SizedBox.shrink();

        final colorScheme = Theme.of(context).colorScheme;
        final textTheme = Theme.of(context).textTheme;

        // Build peak hours summary text.
        final peakSummary = data.peakHours.isNotEmpty
            ? data.peakHours
                .map((h) => _formatHour((h['hour'] as num?)?.toInt() ?? 0))
                .join(', ')
            : null;

        return Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: ux.shadowBase.withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.bolt, color: ux.gold, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Energy Forecast',
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Predicted energy levels by hour',
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                _EnergyBarChart(
                  forecast: data.forecast,
                  peakHours: data.peakHours
                      .map((h) => (h['hour'] as num?)?.toInt() ?? -1)
                      .toSet(),
                  lowHours: data.lowHours
                      .map((h) => (h['hour'] as num?)?.toInt() ?? -1)
                      .toSet(),
                  goldColor: ux.gold,
                  mutedColor: colorScheme.primary.withValues(alpha: 0.25),
                ),
                if (peakSummary != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(
                        Icons.local_fire_department,
                        color: ux.gold,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Best focus hours: $peakSummary',
                          style: textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  static String _formatHour(int hour) {
    if (hour == 0) return '12 AM';
    if (hour < 12) return '$hour AM';
    if (hour == 12) return '12 PM';
    return '${hour - 12} PM';
  }
}

/// A compact 24-bar chart showing predicted energy by hour.
///
/// Peak hours are highlighted in gold, low hours in muted purple.
class _EnergyBarChart extends StatelessWidget {
  const _EnergyBarChart({
    required this.forecast,
    required this.peakHours,
    required this.lowHours,
    required this.goldColor,
    required this.mutedColor,
  });

  final List<Map<String, dynamic>> forecast;
  final Set<int> peakHours;
  final Set<int> lowHours;
  final Color goldColor;
  final Color mutedColor;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    // Find min/max energy for scaling.
    double minE = 5.0;
    double maxE = 1.0;
    for (final entry in forecast) {
      final e = (entry['energy'] as num?)?.toDouble() ?? 3.0;
      if (e < minE) minE = e;
      if (e > maxE) maxE = e;
    }
    final range = (maxE - minE).clamp(0.5, 5.0);

    return SizedBox(
      height: 80,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(24, (hour) {
          final entry = hour < forecast.length ? forecast[hour] : null;
          final energy = (entry?['energy'] as num?)?.toDouble() ?? 3.0;
          final fraction = ((energy - minE) / range).clamp(0.05, 1.0);
          final isPeak = peakHours.contains(hour);
          final isLow = lowHours.contains(hour);

          final barColor = isPeak
              ? goldColor
              : isLow
                  ? mutedColor
                  : colorScheme.primary.withValues(alpha: 0.4);

          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 0.5),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.easeOut,
                    height: fraction * 60 + 4,
                    decoration: BoxDecoration(
                      color: barColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 2),
                  // Show label every 6 hours.
                  if (hour % 6 == 0)
                    Text(
                      '${hour}h',
                      style: textTheme.bodySmall?.copyWith(
                        fontSize: 8,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    )
                  else
                    const SizedBox(height: 10),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 5b. Smart Next Week Plan (graceful fallback — hidden when ML unavailable)
// ---------------------------------------------------------------------------

class _SmartSuggestionsSection extends StatelessWidget {
  const _SmartSuggestionsSection({required this.ref, required this.ux});

  final WidgetRef ref;
  final UnjynxCustomColors ux;

  @override
  Widget build(BuildContext context) {
    final suggestionsAsync = ref.watch(smartSuggestionsProvider);

    return suggestionsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (suggestions) {
        if (suggestions.isEmpty) return const SizedBox.shrink();

        final colorScheme = Theme.of(context).colorScheme;
        final textTheme = Theme.of(context).textTheme;

        // Show at most 3 suggestions.
        final top3 = suggestions.take(3).toList();

        return Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: ux.shadowBase.withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.auto_awesome, color: ux.gold, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Suggested Focus',
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'AI-ranked tasks for maximum impact',
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                for (int i = 0; i < top3.length; i++) ...[
                  _SuggestionTile(
                    suggestion: top3[i],
                    rank: i + 1,
                    goldColor: ux.gold,
                  ),
                  if (i < top3.length - 1) const SizedBox(height: 8),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _SuggestionTile extends StatelessWidget {
  const _SuggestionTile({
    required this.suggestion,
    required this.rank,
    required this.goldColor,
  });

  final SmartSuggestion suggestion;
  final int rank;
  final Color goldColor;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final confidencePercent = (suggestion.score.clamp(0.0, 1.0) * 100).toInt();

    return GestureDetector(
      onTap: () => HapticFeedback.lightImpact(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: goldColor.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            // Rank badge
            Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: goldColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Text(
                '#$rank',
                style: textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: goldColor,
                  fontSize: 11,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    suggestion.title,
                    style: textTheme.bodyMedium,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (suggestion.suggestedTime != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      suggestion.suggestedTime!,
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Confidence badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: goldColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '$confidencePercent%',
                style: textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: goldColor,
                  fontSize: 11,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 6. Next week focus (calendar tasks for next 7 days, grouped by day)
// ---------------------------------------------------------------------------

class _NextWeekFocus extends StatelessWidget {
  const _NextWeekFocus({required this.ref, required this.ux});

  final WidgetRef ref;
  final UnjynxCustomColors ux;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final nextMonday = now.add(Duration(days: 8 - now.weekday));
    final nextMonth = DateTime(nextMonday.year, nextMonday.month);

    // Watch calendar tasks for the month containing next week.
    final calendarAsync = ref.watch(calendarTasksProvider(nextMonth));
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: ux.shadowBase.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.calendar_today, color: ux.info, size: 20),
              const SizedBox(width: 8),
              Text(
                'Next Week Focus',
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Tasks due next week',
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          calendarAsync.when(
            loading: () => Column(
              children: List.generate(
                3,
                (_) => const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: UnjynxShimmerBox(height: 44, borderRadius: 10),
                ),
              ),
            ),
            error: (_, __) => Text(
              'Unable to load upcoming tasks',
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            data: (calendarTasks) {
              final nextSunday = nextMonday.add(const Duration(days: 6));

              // Filter tasks within next week.
              final nextWeekTasks = calendarTasks.where((t) {
                if (t.dueDate == null) return false;
                final d = DateTime(
                  t.dueDate!.year,
                  t.dueDate!.month,
                  t.dueDate!.day,
                );
                final start = DateTime(
                  nextMonday.year,
                  nextMonday.month,
                  nextMonday.day,
                );
                final end = DateTime(
                  nextSunday.year,
                  nextSunday.month,
                  nextSunday.day + 1,
                );
                return !d.isBefore(start) && d.isBefore(end);
              }).toList();

              if (nextWeekTasks.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    'No tasks scheduled for next week yet.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                );
              }

              // Group by day.
              final grouped = <DateTime, List<CalendarTask>>{};
              for (final task in nextWeekTasks) {
                final dayKey = DateTime(
                  task.dueDate!.year,
                  task.dueDate!.month,
                  task.dueDate!.day,
                );
                grouped.putIfAbsent(dayKey, () => []).add(task);
              }

              final sortedDays = grouped.keys.toList()..sort();
              final dayNames = [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
              ];
              final months = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
              ];

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (int di = 0; di < sortedDays.length; di++) ...[
                    if (di > 0) const SizedBox(height: 12),
                    // Day label
                    Text(
                      '${dayNames[sortedDays[di].weekday - 1]}, '
                      '${months[sortedDays[di].month - 1]} ${sortedDays[di].day}',
                      style: textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 6),
                    for (final task in grouped[sortedDays[di]]!)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: _NextWeekTaskTile(task: task),
                      ),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _NextWeekTaskTile extends StatelessWidget {
  const _NextWeekTaskTile({required this.task});

  final CalendarTask task;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final priorityColor = unjynxPriorityColor(context, task.priority);
    final isCompleted = task.status == 'completed';

    return GestureDetector(
      onTap: () => HapticFeedback.lightImpact(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: priorityColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                task.title,
                style: textTheme.bodyMedium?.copyWith(
                  decoration:
                      isCompleted ? TextDecoration.lineThrough : null,
                  color: isCompleted
                      ? colorScheme.onSurface.withValues(alpha: 0.5)
                      : null,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
