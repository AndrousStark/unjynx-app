import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Retention Hook #1: Streak Continuity.
///
/// Displays a subtle "Streak at risk!" banner when:
/// - The user has an active streak (>= 1 day), AND
/// - No tasks have been completed today, AND
/// - It's past 6 PM local time.
///
/// The banner is dismissible and uses a warm amber/gold style to create
/// gentle urgency without being annoying.
class StreakAtRiskBanner extends ConsumerWidget {
  const StreakAtRiskBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final streakAsync = ref.watch(homeStreakProvider);
    final tasksAsync = ref.watch(homeTodayTasksProvider);
    final now = DateTime.now();

    // Only show after 6 PM (18:00).
    if (now.hour < 18) return const SizedBox.shrink();

    return streakAsync.when(
      data: (streak) {
        // No streak to protect.
        if (streak.currentStreak < 1) return const SizedBox.shrink();

        return tasksAsync.when(
          data: (tasks) {
            // Check if any task was completed today.
            final hasCompletedToday = tasks.any((t) => t.isCompleted);
            if (hasCompletedToday) return const SizedBox.shrink();

            return _StreakRiskCard(streakDays: streak.currentStreak);
          },
          loading: () => const SizedBox.shrink(),
          error: (_, __) => const SizedBox.shrink(),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _StreakRiskCard extends StatefulWidget {
  const _StreakRiskCard({required this.streakDays});

  final int streakDays;

  @override
  State<_StreakRiskCard> createState() => _StreakRiskCardState();
}

class _StreakRiskCardState extends State<_StreakRiskCard> {
  bool _dismissed = false;

  @override
  Widget build(BuildContext context) {
    if (_dismissed) return const SizedBox.shrink();

    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isLight ? ux.warningWash : ux.warning.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: ux.warning.withValues(alpha: isLight ? 0.3 : 0.2),
          ),
        ),
        child: Row(
          children: [
            // Fire icon with gentle pulse.
            Icon(
              Icons.local_fire_department_rounded,
              color: ux.warning,
              size: 24,
            ),
            const SizedBox(width: 12),

            // Text.
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Streak at risk!',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Complete a task to protect your '
                    '${widget.streakDays}-day streak.',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.onSurfaceVariant,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),

            // Quick action: go to tasks.
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                GoRouter.of(context).push('/todos');
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: ux.warning.withValues(alpha: isLight ? 0.15 : 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'Go',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: ux.warning,
                  ),
                ),
              ),
            ),

            const SizedBox(width: 6),

            // Dismiss.
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                setState(() => _dismissed = true);
              },
              child: Icon(
                Icons.close_rounded,
                size: 18,
                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
