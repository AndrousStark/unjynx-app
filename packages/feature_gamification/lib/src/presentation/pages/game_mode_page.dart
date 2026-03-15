import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/achievement.dart';
import '../providers/gamification_providers.dart';
import '../widgets/achievement_card.dart';
import '../widgets/challenge_card.dart';
import '../widgets/leaderboard_tile.dart';
import '../widgets/xp_bar.dart';

/// I4 - Game Mode page with XP, achievements, leaderboard, challenges.
class GameModePage extends ConsumerWidget {
  const GameModePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return Scaffold(
      appBar: AppBar(title: const Text('Game Mode')),
      body: RefreshIndicator(
        color: Theme.of(context).colorScheme.primary,
        onRefresh: () async {
          ref.invalidate(xpDataProvider);
          ref.invalidate(activeChallengesProvider);
          ref.invalidate(achievementsProvider);
          ref.invalidate(leaderboardProvider);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          children: [
            // XP bar section
          Container(
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              boxShadow: isLight
                  ? [
                      BoxShadow(
                        color: const Color(0xFF1A0533).withValues(alpha: 0.06),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                      BoxShadow(
                        color: const Color(0xFF1A0533).withValues(alpha: 0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: ref.watch(xpDataProvider).when(
                    data: (xp) => XpBar(
                      currentXp: xp.currentLevelXp,
                      nextLevelXp: xp.nextLevelXp,
                      level: xp.level,
                      percent: xp.percentToNext,
                    ),
                    loading: () => const UnjynxShimmerBox(
                      height: 44,
                      width: double.infinity,
                      borderRadius: 16,
                    ),
                    error: (e, _) => Text(
                      'Failed to load XP: $e',
                      style: textTheme.bodyMedium?.copyWith(
                        color: colorScheme.error,
                      ),
                    ),
                  ),
            ),
          ),
          const SizedBox(height: 20),

          // Active challenges
          const _ActiveChallengesSection(),
          const SizedBox(height: 20),

          // Achievements grid
          const _AchievementsSection(),
          const SizedBox(height: 20),

          // Leaderboard
          const _LeaderboardSection(),
          const SizedBox(height: 40),
        ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Active Challenges
// ---------------------------------------------------------------------------

class _ActiveChallengesSection extends ConsumerWidget {
  const _ActiveChallengesSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Active Challenges',
          style: textTheme.headlineSmall?.copyWith(
            color: colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        ref.watch(activeChallengesProvider).when(
              data: (challenges) {
                if (challenges.isEmpty) {
                  return Container(
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: context.isLightMode
                          ? [
                              BoxShadow(
                                color: const Color(0xFF1A0533)
                                    .withValues(alpha: 0.06),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                              BoxShadow(
                                color: const Color(0xFF1A0533)
                                    .withValues(alpha: 0.04),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.emoji_events_outlined,
                              size: 40,
                              color: colorScheme.onSurfaceVariant,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'No active challenges',
                              style: textTheme.bodyMedium?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }
                return Column(
                  children: challenges
                      .map((c) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: ChallengeCard(challenge: c),
                          ))
                      .toList(),
                );
              },
              loading: () => Column(
                children: List.generate(2, (_) => const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: UnjynxShimmerBox(
                    height: 80,
                    width: double.infinity,
                    borderRadius: 16,
                  ),
                )),
              ),
              error: (e, _) => Container(
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Failed to load challenges: $e',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.error,
                    ),
                  ),
                ),
              ),
            ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Achievements Grid
// ---------------------------------------------------------------------------

class _AchievementsSection extends ConsumerWidget {
  const _AchievementsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Achievements',
              style: textTheme.headlineSmall?.copyWith(
                color: colorScheme.onSurface,
              ),
            ),
            const Spacer(),
            ref.watch(unlockedCountProvider).when(
                  data: (count) {
                    final total =
                        ref.watch(achievementsProvider).value?.length ?? 0;
                    return Text(
                      '$count / $total',
                      style: textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    );
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
          ],
        ),
        const SizedBox(height: 8),
        ref.watch(achievementsProvider).when(
              data: (achievements) => GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 0.85,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: achievements.length,
                itemBuilder: (context, index) {
                  return AchievementCard(
                    achievement: achievements[index],
                    onTap: () => _showDetail(context, achievements[index]),
                  );
                },
              ),
              loading: () => GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 0.85,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: 6,
                itemBuilder: (context, index) => const UnjynxShimmerBox(
                  height: 100,
                  width: double.infinity,
                  borderRadius: 16,
                ),
              ),
              error: (e, _) => Center(
                child: Text(
                  'Failed to load achievements',
                  style: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.error,
                  ),
                ),
              ),
            ),
      ],
    );
  }

  void _showDetail(BuildContext context, Achievement achievement) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;

    HapticFeedback.lightImpact();

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              achievement.isUnlocked
                  ? Icons.emoji_events_rounded
                  : Icons.lock_outline_rounded,
              size: 48,
              color: achievement.isUnlocked ? ux.gold : ux.textDisabled,
            ),
            const SizedBox(height: 12),
            Text(
              achievement.name,
              style: textTheme.headlineMedium?.copyWith(
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              achievement.description,
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '+${achievement.xpReward} XP',
              style: textTheme.displaySmall?.copyWith(
                color: ux.gold,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

class _LeaderboardSection extends ConsumerWidget {
  const _LeaderboardSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final scope = ref.watch(leaderboardScopeProvider);
    final period = ref.watch(leaderboardPeriodProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Leaderboard',
          style: textTheme.headlineSmall?.copyWith(
            color: colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 8),

        // Scope toggle
        Row(
          children: [
            Expanded(
              child: SegmentedButton<LeaderboardScope>(
                segments: const [
                  ButtonSegment(
                    value: LeaderboardScope.friends,
                    label: Text('Friends'),
                  ),
                  ButtonSegment(
                    value: LeaderboardScope.team,
                    label: Text('Team'),
                  ),
                ],
                selected: {scope},
                onSelectionChanged: (s) {
                  HapticFeedback.selectionClick();
                  ref.read(leaderboardScopeProvider.notifier).set(s.first);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Period toggle
        Row(
          children: [
            Expanded(
              child: SegmentedButton<LeaderboardPeriod>(
                segments: const [
                  ButtonSegment(
                    value: LeaderboardPeriod.thisWeek,
                    label: Text('Week'),
                  ),
                  ButtonSegment(
                    value: LeaderboardPeriod.thisMonth,
                    label: Text('Month'),
                  ),
                  ButtonSegment(
                    value: LeaderboardPeriod.allTime,
                    label: Text('All'),
                  ),
                ],
                selected: {period},
                onSelectionChanged: (s) {
                  HapticFeedback.selectionClick();
                  ref.read(leaderboardPeriodProvider.notifier).set(s.first);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Entries
        ref.watch(leaderboardProvider).when(
              data: (entries) => Column(
                children: entries
                    .map((e) => LeaderboardTile(entry: e))
                    .toList(),
              ),
              loading: () => Column(
                children: List.generate(5, (_) => const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: UnjynxShimmerBox(
                    height: 56,
                    width: double.infinity,
                    borderRadius: 16,
                  ),
                )),
              ),
              error: (e, _) => Container(
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Failed to load leaderboard: $e',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.error,
                    ),
                  ),
                ),
              ),
            ),
      ],
    );
  }
}
