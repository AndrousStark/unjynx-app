import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Animated progress bar for import operations.
class ImportProgressBar extends StatelessWidget {
  const ImportProgressBar({
    required this.progress,
    this.label,
    super.key,
  });

  /// Progress from 0.0 to 1.0.
  final double progress;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final percent = (progress * 100).round();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
        ],

        // Progress bar with smooth animation
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.0, end: progress.clamp(0.0, 1.0)),
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
          builder: (context, animatedValue, _) {
            return ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: animatedValue,
                backgroundColor: colorScheme.surfaceContainerHigh.withValues(
                  alpha: isLight ? 0.5 : 0.3,
                ),
                valueColor: AlwaysStoppedAnimation(
                  progress >= 1.0 ? ux.success : colorScheme.primary,
                ),
                minHeight: 10,
              ),
            );
          },
        ),
        const SizedBox(height: 6),

        // Percentage label
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              progress >= 1.0 ? 'Complete!' : 'Importing...',
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            Text(
              '$percent%',
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                fontSize: 16,
                color: progress >= 1.0 ? ux.success : colorScheme.primary,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
