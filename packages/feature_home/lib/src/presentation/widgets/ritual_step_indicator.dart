import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A horizontal step indicator for ritual flows.
///
/// Renders [totalSteps] circles connected by lines:
/// - **Completed** (index < currentStep): gold filled circle
/// - **Current** (index == currentStep): gold outline with inner dot
/// - **Upcoming** (index > currentStep): surfaceContainerHigh filled circle
///
/// The connecting lines between circles are gold for completed transitions
/// and surfaceContainerHigh for upcoming ones.
class RitualStepIndicator extends StatelessWidget {
  const RitualStepIndicator({
    required this.totalSteps,
    required this.currentStep,
    super.key,
  });

  /// Total number of steps in the ritual flow.
  final int totalSteps;

  /// Zero-based index of the current step.
  final int currentStep;

  static const double _dotSize = 12;
  static const double _currentDotSize = 14;
  static const double _lineHeight = 2;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < totalSteps; i++) ...[
          // Dot
          _StepDot(
            isCompleted: i < currentStep,
            isCurrent: i == currentStep,
          ),

          // Connecting line (between dots, not after the last)
          if (i < totalSteps - 1)
            Flexible(
              child: Container(
                height: _lineHeight,
                constraints: const BoxConstraints(
                  minWidth: 16,
                  maxWidth: 40,
                ),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: i < currentStep
                      ? ux.gold
                      : colorScheme.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(_lineHeight / 2),
                ),
              ),
            ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Individual step dot
// ---------------------------------------------------------------------------

class _StepDot extends StatelessWidget {
  const _StepDot({
    required this.isCompleted,
    required this.isCurrent,
  });

  final bool isCompleted;
  final bool isCurrent;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final size = isCurrent
        ? RitualStepIndicator._currentDotSize
        : RitualStepIndicator._dotSize;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOutCubic,
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: _fillColor(colorScheme, ux),
        border: Border.all(
          color: _borderColor(colorScheme, ux),
          width: isCurrent ? 2.0 : 1.5,
        ),
        // Gold glow for completed/current dots in dark mode
        boxShadow: (isCompleted || isCurrent) && !isLight
            ? [
                BoxShadow(
                  color: ux.gold.withValues(alpha: 0.3),
                  blurRadius: 4,
                ),
              ]
            : null,
      ),
      child: isCurrent
          ? Center(
              child: Container(
                width: 5,
                height: 5,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: ux.gold,
                ),
              ),
            )
          : null,
    );
  }

  Color _fillColor(ColorScheme colorScheme, UnjynxCustomColors ux) {
    if (isCompleted) return ux.gold;
    if (isCurrent) return Colors.transparent;
    return colorScheme.surfaceContainerHigh;
  }

  Color _borderColor(ColorScheme colorScheme, UnjynxCustomColors ux) {
    if (isCompleted) return ux.gold;
    if (isCurrent) return ux.gold;
    return colorScheme.surfaceContainerHigh;
  }
}
