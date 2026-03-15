import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Animated XP progress bar with gold gradient fill.
class XpBar extends StatelessWidget {
  const XpBar({
    required this.currentXp,
    required this.nextLevelXp,
    required this.level,
    required this.percent,
    this.height = 16,
    super.key,
  });

  final int currentXp;
  final int nextLevelXp;
  final int level;
  final double percent;
  final double height;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Level + XP label row
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isLight
                      ? [ux.gold, ux.darkGold]
                      : [ux.gold, ux.darkGold],
                ),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                'LVL $level',
                style: textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: isLight ? Colors.white : Colors.black,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              '$currentXp / $nextLevelXp XP',
              style: textTheme.displaySmall?.copyWith(
                fontSize: 14,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const Spacer(),
            Text(
              '${(percent * 100).toStringAsFixed(0)}%',
              style: textTheme.displaySmall?.copyWith(
                fontSize: 14,
                color: ux.gold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Progress bar
        ClipRRect(
          borderRadius: BorderRadius.circular(height / 2),
          child: SizedBox(
            height: height,
            child: Stack(
              children: [
                // Background track
                Container(
                  decoration: BoxDecoration(
                    color: isLight
                        ? colorScheme.surfaceContainerHigh
                        : colorScheme.surfaceContainerHighest,
                  ),
                ),

                // Animated fill
                TweenAnimationBuilder<double>(
                  tween: Tween<double>(
                    begin: 0,
                    end: percent.clamp(0.0, 1.0),
                  ),
                  duration: const Duration(milliseconds: 600),
                  curve: Curves.easeOutCubic,
                  builder: (context, animatedPercent, child) {
                    return FractionallySizedBox(
                      widthFactor: animatedPercent,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: isLight
                                ? [ux.gold, ux.darkGold]
                                : [ux.gold, ux.darkGold],
                          ),
                          borderRadius: BorderRadius.circular(height / 2),
                        ),
                      ),
                    );
                  },
                ),

                // Shimmer sweep overlay
                TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: -1, end: 2),
                  duration: const Duration(milliseconds: 1500),
                  curve: Curves.easeInOut,
                  builder: (context, value, child) {
                    return FractionallySizedBox(
                      widthFactor: percent.clamp(0.0, 1.0),
                      child: ShaderMask(
                        shaderCallback: (bounds) {
                          return LinearGradient(
                            begin: Alignment(value - 1, 0),
                            end: Alignment(value, 0),
                            colors: const [
                              Colors.transparent,
                              Colors.white24,
                              Colors.transparent,
                            ],
                          ).createShader(bounds);
                        },
                        blendMode: BlendMode.srcATop,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(height / 2),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
