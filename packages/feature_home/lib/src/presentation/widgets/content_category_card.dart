import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A tappable card representing a single content category.
///
/// Displays the category icon, name, and tagline. When selected, a gold
/// border and a gold checkmark overlay appear in the top-right corner.
///
/// Layout:
/// ```text
/// ┌─────────────────────┐
/// │  [icon]         [✓] │
/// │  Name               │
/// │  Tagline            │
/// └─────────────────────┘
/// ```
class ContentCategoryCard extends StatelessWidget {
  const ContentCategoryCard({
    required this.name,
    required this.tagline,
    required this.icon,
    required this.isSelected,
    required this.onTap,
    super.key,
  });

  /// Display name of the category.
  final String name;

  /// Short tagline shown below the name.
  final String tagline;

  /// Material icon for the category.
  final IconData icon;

  /// Whether this category is currently selected.
  final bool isSelected;

  /// Called when the card is tapped.
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final iconColor = isSelected ? ux.gold : colorScheme.primary;

    return PressableScale(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          // Selected: goldWash (light) or gold at 15% (dark)
          color: isSelected
              ? (isLight ? ux.goldWash : ux.gold.withValues(alpha: 0.15))
              : colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? ux.gold
                : colorScheme.surfaceContainerHigh
                    .withValues(alpha: isLight ? 0.7 : 0.5),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: ux.gold.withValues(alpha: isLight ? 0.15 : 0.2),
                    blurRadius: isLight ? 8 : 12,
                  ),
                ]
              : context.unjynxShadow(UnjynxElevation.sm),
        ),
        child: Stack(
          children: [
            // Main content column.
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category icon.
                Icon(
                  icon,
                  size: 40,
                  color: iconColor,
                ),

                const SizedBox(height: 12),

                // Category name.
                Text(
                  name,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: colorScheme.onSurface,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: 4),

                // Tagline.
                Text(
                  tagline,
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.onSurfaceVariant,
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),

            // Selected checkmark in top-right corner.
            if (isSelected)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: ux.gold,
                  ),
                  child: Icon(
                    Icons.check,
                    size: 16,
                    // Dark text on gold circle for contrast
                    color: isLight
                        ? const Color(0xFF1A0533)
                        : const Color(0xFF1A0A2E),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
