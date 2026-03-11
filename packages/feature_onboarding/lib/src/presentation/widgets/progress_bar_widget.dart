import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Animated segmented progress bar for multi-step flows.
///
/// Shows [totalSteps] segments with the first [currentStep + 1] filled gold.
class ProgressBarWidget extends StatelessWidget {
  const ProgressBarWidget({
    required this.totalSteps,
    required this.currentStep,
    super.key,
  });

  final int totalSteps;
  final int currentStep;

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: List.generate(totalSteps, (index) {
          final isActive = index <= currentStep;

          return Flexible(
            child: Padding(
              // 4px gap between segments (2px on each side, except edges).
              padding: EdgeInsets.only(
                left: index == 0 ? 0 : 2,
                right: index == totalSteps - 1 ? 0 : 2,
              ),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOut,
                height: 4,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  color: isActive
                      ? ux.gold
                      : colorScheme.onSurfaceVariant
                          .withValues(alpha: isLight ? 0.15 : 0.2),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
