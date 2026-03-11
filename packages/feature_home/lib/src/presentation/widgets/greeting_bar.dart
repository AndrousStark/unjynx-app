import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Top greeting bar showing a time-aware greeting, streak chip,
/// and notification bell with badge.
///
/// Layout:
/// ```text
/// [Greeting text]          [Streak chip] [Bell badge]
/// ```
class GreetingBar extends ConsumerWidget {
  const GreetingBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final userName = ref.watch(homeUserNameProvider);
    final streakAsync = ref.watch(homeStreakProvider);
    final notificationCount = ref.watch(homeNotificationCountProvider);

    final greeting = _greetingForHour(DateTime.now().hour);

    return Row(
      children: [
        // --- Left: greeting text ---
        Expanded(
          child: Text(
            '$greeting, $userName!',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: colorScheme.onSurface,
                  fontWeight: FontWeight.bold,
                ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),

        const SizedBox(width: 12),

        // --- Streak chip ---
        streakAsync.when(
          data: (streak) => streak.currentStreak > 0
              ? _StreakChip(count: streak.currentStreak)
              : const SizedBox.shrink(),
          loading: SizedBox.shrink,
          error: (_, __) => const SizedBox.shrink(),
        ),

        const SizedBox(width: 8),

        // --- Notification bell ---
        _NotificationBell(count: notificationCount),
      ],
    );
  }

  /// Returns a time-aware greeting string.
  ///
  /// - 05:00 - 11:59 -> "Good morning"
  /// - 12:00 - 16:59 -> "Good afternoon"
  /// - 17:00 - 20:59 -> "Good evening"
  /// - 21:00 - 04:59 -> "Night owl mode"
  static String _greetingForHour(int hour) {
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Night owl mode';
  }
}

// ---------------------------------------------------------------------------
// Streak chip
// ---------------------------------------------------------------------------

class _StreakChip extends StatelessWidget {
  const _StreakChip({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    final isLight = context.isLightMode;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isLight ? ux.goldWash : colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: ux.gold.withValues(alpha: isLight ? 0.4 : 0.3),
        ),
        // Light: gold shadow pulse; Dark: gold glow
        boxShadow: [
          BoxShadow(
            color: ux.gold.withValues(alpha: isLight ? 0.2 : 0.3),
            blurRadius: isLight ? 6 : 10,
            spreadRadius: isLight ? 0 : 1,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.local_fire_department_rounded,
            color: ux.gold,
            size: 18,
          ),
          const SizedBox(width: 4),
          Text(
            '$count',
            style: TextStyle(
              color: ux.gold,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Notification bell with positioned badge
// ---------------------------------------------------------------------------

class _NotificationBell extends StatelessWidget {
  const _NotificationBell({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          icon: Icon(
            Icons.notifications_outlined,
            color: colorScheme.onSurface,
            size: 26,
          ),
          onPressed: () => context.push('/notifications'),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
        ),
        if (count > 0)
          Positioned(
            right: 4,
            top: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: colorScheme.error,
                borderRadius: BorderRadius.circular(10),
              ),
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              child: Text(
                count > 99 ? '99+' : '$count',
                style: TextStyle(
                  // Always white on error-red badge for contrast
                  color: colorScheme.onError,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}
