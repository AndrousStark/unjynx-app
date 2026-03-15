import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/achievement.dart';

/// Card displaying a single achievement with lock/unlock state.
class AchievementCard extends StatelessWidget {
  const AchievementCard({
    required this.achievement,
    this.onTap,
    super.key,
  });

  final Achievement achievement;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final isUnlocked = achievement.isUnlocked;

    return PressableScale(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap?.call();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isUnlocked
              ? (isLight
                  ? ux.goldWash
                  : ux.gold.withValues(alpha: 0.08))
              : (isLight
                  ? colorScheme.surfaceContainer
                  : colorScheme.surfaceContainerHigh),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isUnlocked ? ux.gold : Colors.transparent,
            width: isUnlocked ? 2 : 1.5,
          ),
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
        child: Stack(
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon placeholder
                _AchievementIcon(
                  category: achievement.category,
                  isUnlocked: isUnlocked,
                  ux: ux,
                  colorScheme: colorScheme,
                  isLight: isLight,
                ),
                const SizedBox(height: 8),

                // Name
                Text(
                  achievement.name,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: isUnlocked
                        ? colorScheme.onSurface
                        : colorScheme.onSurfaceVariant
                            .withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(height: 4),

                // XP reward
                Text(
                  '+${achievement.xpReward} XP',
                  style: textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: isUnlocked ? ux.gold : ux.textDisabled,
                  ),
                ),

                // Lock icon overlay for locked achievements
                if (!isUnlocked)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Icon(
                      Icons.lock_outline_rounded,
                      size: 14,
                      color: ux.textDisabled,
                    ),
                  ),
              ],
            ),

            // Gold checkmark for unlocked achievements
            if (isUnlocked)
              Positioned(
                right: 0,
                top: 0,
                child: Icon(
                  Icons.check_circle,
                  size: 18,
                  color: ux.gold,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _AchievementIcon extends StatelessWidget {
  const _AchievementIcon({
    required this.category,
    required this.isUnlocked,
    required this.ux,
    required this.colorScheme,
    required this.isLight,
  });

  final AchievementCategory category;
  final bool isUnlocked;
  final UnjynxCustomColors ux;
  final ColorScheme colorScheme;
  final bool isLight;

  @override
  Widget build(BuildContext context) {
    final icon = _iconForCategory(category);

    final Widget iconWidget = Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isUnlocked
            ? ux.gold.withValues(alpha: isLight ? 0.15 : 0.2)
            : colorScheme.onSurfaceVariant.withValues(alpha: 0.1),
      ),
      child: Icon(
        icon,
        size: 22,
        color: isUnlocked
            ? ux.gold
            : colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
      ),
    );

    // Locked state: grayscale filter
    if (!isUnlocked) {
      return ColorFiltered(
        colorFilter: const ColorFilter.mode(
          Colors.grey,
          BlendMode.saturation,
        ),
        child: iconWidget,
      );
    }

    return iconWidget;
  }

  IconData _iconForCategory(AchievementCategory category) {
    switch (category) {
      case AchievementCategory.tasks:
        return Icons.check_circle_outline_rounded;
      case AchievementCategory.streaks:
        return Icons.local_fire_department_rounded;
      case AchievementCategory.social:
        return Icons.people_outline_rounded;
      case AchievementCategory.challenges:
        return Icons.emoji_events_outlined;
      case AchievementCategory.milestones:
        return Icons.flag_outlined;
    }
  }
}
