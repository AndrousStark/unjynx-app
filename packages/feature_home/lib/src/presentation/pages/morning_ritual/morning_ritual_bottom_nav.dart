import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Bottom navigation bar for the morning ritual flow.
///
/// Shows a primary action button ("Next" or "Go Break the Curse!" on
/// the final step) and a secondary "Skip" link for non-final steps.
class MorningRitualBottomNav extends StatelessWidget {
  const MorningRitualBottomNav({
    super.key,
    required this.currentStep,
    required this.totalSteps,
    required this.isLastStep,
    required this.onNext,
    required this.onSkip,
    required this.onComplete,
    required this.isCompleting,
  });

  final int currentStep;
  final int totalSteps;
  final bool isLastStep;
  final VoidCallback onNext;
  final VoidCallback onSkip;
  final VoidCallback onComplete;
  final bool isCompleting;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Primary button (Next or Complete)
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: isCompleting
                  ? null
                  : (isLastStep ? onComplete : onNext),
              style: ElevatedButton.styleFrom(
                backgroundColor: ux.gold,
                foregroundColor:
                    context.isLightMode ? Colors.white : Colors.black,
                disabledBackgroundColor:
                    ux.gold.withValues(alpha: 0.4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: Text(
                isLastStep ? 'Go Break the Curse!' : 'Next',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          ),

          // Skip button (not on last step)
          if (!isLastStep) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: onSkip,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Text(
                  'Skip',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
