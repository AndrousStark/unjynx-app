import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

/// A banner shown on the Home screen when the user denied notification
/// permission during onboarding (or later via system settings).
///
/// Uses the warning color wash from [UnjynxCustomColors] for adaptive
/// light/dark styling.
class DeniedBanner extends StatelessWidget {
  const DeniedBanner({
    this.onEnablePressed,
    super.key,
  });

  /// Called when the user taps "Enable in Settings".
  final VoidCallback? onEnablePressed;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: ux.warningWash,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: ux.warning.withValues(alpha: isLight ? 0.35 : 0.30),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.warning_amber_rounded,
            size: 22,
            color: ux.warning,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Notifications are disabled',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isLight
                    ? colorScheme.onSurface
                    : colorScheme.onSurface.withValues(alpha: 0.9),
              ),
            ),
          ),
          TextButton(
            onPressed: onEnablePressed == null
                ? null
                : () {
                    HapticFeedback.lightImpact();
                    onEnablePressed!();
                  },
            style: TextButton.styleFrom(
              foregroundColor: ux.warning,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              textStyle: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
            child: const Text('Enable in Settings'),
          ),
        ],
      ),
    );
  }
}
