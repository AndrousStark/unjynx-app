import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Full-screen overlay shown when the morning ritual completes.
///
/// Displays a gold circle with a checkmark that scales in via an elastic
/// animation, along with the "Ritual Complete" and "Go break the curse."
/// text.
class MorningRitualCompletionOverlay extends StatelessWidget {
  const MorningRitualCompletionOverlay({
    super.key,
    required this.scaleAnimation,
    required this.opacityAnimation,
  });

  final Animation<double> scaleAnimation;
  final Animation<double> opacityAnimation;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return AnimatedBuilder(
      animation: scaleAnimation,
      builder: (context, child) {
        return ColoredBox(
          color: colorScheme.surfaceContainerLowest.withValues(
            alpha: opacityAnimation.value * 0.85,
          ),
          child: Center(
            child: Transform.scale(
              scale: scaleAnimation.value,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Gold circle with checkmark
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: ux.gold.withValues(alpha: 0.15),
                      border: Border.all(
                        color: ux.gold,
                        width: 3,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: ux.gold.withValues(alpha: 0.3),
                          blurRadius: 40,
                          spreadRadius: 10,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        Icons.check_rounded,
                        size: 48,
                        color: ux.gold,
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  Text(
                    'Ritual Complete',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: colorScheme.onSurface,
                      letterSpacing: -0.3,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Text(
                    'Go break the curse.',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                      color: ux.gold,
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
