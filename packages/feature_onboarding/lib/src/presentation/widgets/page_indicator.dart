import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Animated dot indicator for onboarding pages.
class PageIndicator extends StatelessWidget {
  const PageIndicator({
    required this.count,
    required this.currentIndex,
    super.key,
  });

  final int count;
  final int currentIndex;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (index) {
        final isActive = index == currentIndex;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: isActive ? 28 : 8,
          height: 8,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(4),
            color: isActive
                ? ux.gold
                // Light: higher opacity so dots visible on lavender bg
                // Dark: subtler dots against dark background
                : colorScheme.onSurfaceVariant
                    .withValues(alpha: isLight ? 0.2 : 0.3),
          ),
        );
      }),
    );
  }
}
