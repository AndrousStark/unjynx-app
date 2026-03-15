import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Full-screen overlay shown when the evening review is completing.
///
/// Displays a calming moon icon with "Day Complete" text,
/// animated with scale and opacity transitions.
class EveningReviewCompletionOverlay extends StatelessWidget {
  const EveningReviewCompletionOverlay({
    super.key,
    required this.scaleAnimation,
    required this.opacityAnimation,
  });

  final Animation<double> scaleAnimation;
  final Animation<double> opacityAnimation;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return AnimatedBuilder(
      animation: scaleAnimation,
      builder: (context, child) {
        return ColoredBox(
          color: (isLight
                  ? const Color(0xFFE2D9F3)
                  : const Color(0xFF0D0D1A))
              .withValues(alpha: opacityAnimation.value * 0.9),
          child: Center(
            child: Transform.scale(
              scale: scaleAnimation.value,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Moon circle with check
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: colorScheme.primary.withValues(alpha: 0.15),
                      border: Border.all(
                        color: colorScheme.primary,
                        width: 3,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color:
                              colorScheme.primary.withValues(alpha: 0.25),
                          blurRadius: 40,
                          spreadRadius: 10,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        Icons.nightlight_round,
                        size: 44,
                        color: colorScheme.primary,
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  Text(
                    'Day Complete',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: colorScheme.onSurface,
                      letterSpacing: -0.3,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Text(
                    'Rest well. Tomorrow awaits.',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                      color: colorScheme.primary.withValues(alpha: 0.8),
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
