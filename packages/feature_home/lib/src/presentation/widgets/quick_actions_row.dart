import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Horizontal scrollable row of quick action chips.
///
/// Each chip displays a [CircleAvatar] icon above a label text.
///
/// Actions:
/// 1. **Ghost Mode** - visibility_off icon (navigates to /ghost-mode)
/// 2. **Focus** (Pomodoro) - timer icon (navigates to /pomodoro)
/// 3. **Morning/Evening** - sun/moon icon (time-aware: before 2PM -> morning
///    ritual, after -> evening review)
/// 4. **Suggest** (AI Suggest) - auto_awesome icon
///
/// Unbuilt screens show a "Coming soon" snackbar.
class QuickActionsRow extends StatelessWidget {
  const QuickActionsRow({super.key});

  @override
  Widget build(BuildContext context) {
    return StaggeredColumn(
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _QuickActionChip(
                icon: Icons.visibility_off_rounded,
                label: 'Ghost',
                onTap: () => GoRouter.of(context).push('/ghost-mode'),
              ),
              const SizedBox(width: 16),
              _QuickActionChip(
                icon: Icons.timer_rounded,
                label: 'Focus',
                onTap: () => GoRouter.of(context).push('/pomodoro'),
              ),
              const SizedBox(width: 16),
              _QuickActionChip(
                icon: DateTime.now().hour < 14
                    ? Icons.wb_sunny_rounded
                    : Icons.nightlight_round,
                label: DateTime.now().hour < 14 ? 'Morning' : 'Evening',
                onTap: () {
                  final route = DateTime.now().hour < 14
                      ? '/rituals/morning'
                      : '/rituals/evening';
                  GoRouter.of(context).push(route);
                },
              ),
              const SizedBox(width: 16),
              _QuickActionChip(
                icon: Icons.auto_awesome_rounded,
                label: 'Suggest',
                onTap: () => _showComingSoon(context, 'AI Suggestions'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Shows a "Coming soon" snackbar for features not yet built.
  static void _showComingSoon(BuildContext context, String featureName) {
    final colorScheme = Theme.of(context).colorScheme;

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text('$featureName \u2014 Coming soon'),
          duration: const Duration(seconds: 2),
          backgroundColor: colorScheme.surfaceContainerHigh,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
  }
}

// ---------------------------------------------------------------------------
// Quick action chip (CircleAvatar + label)
// ---------------------------------------------------------------------------

class _QuickActionChip extends StatelessWidget {
  const _QuickActionChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Semantics(
      label: label,
      button: true,
      child: PressableScale(
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 26,
              backgroundColor: isLight
                  ? colorScheme.primary.withValues(alpha: 0.08)
                  : colorScheme.surfaceContainerHigh,
              child: Icon(
                icon,
                color: colorScheme.primary,
                size: 24,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
