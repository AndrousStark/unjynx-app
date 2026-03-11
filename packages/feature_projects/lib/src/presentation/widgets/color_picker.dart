import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

/// Predefined project colors matching the UNJYNX brand palette.
const projectColors = <String>[
  '#6C5CE7', // Vivid Purple (default)
  '#FF6B6B', // Red
  '#FF8C42', // Orange
  '#FFD700', // Gold
  '#51CF66', // Green
  '#20C997', // Teal
  '#339AF0', // Blue
  '#845EF7', // Indigo
  '#F06595', // Pink
  '#868E96', // Gray
  '#E64980', // Hot Pink
  '#38D9A9', // Mint
];

/// Grid of color swatches for selecting a project color.
class ColorPicker extends StatelessWidget {
  const ColorPicker({
    required this.selectedColor,
    required this.onColorSelected,
    super.key,
  });

  final String selectedColor;
  final ValueChanged<String> onColorSelected;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        for (final hex in projectColors)
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              onColorSelected(hex);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _displayColor(hex, isLight),
                shape: BoxShape.circle,
                border: selectedColor == hex
                    ? Border.all(
                        color: isLight
                            ? colorScheme.onSurface
                            : colorScheme.onSurface,
                        width: 3,
                      )
                    : isLight
                        ? Border.all(
                            color: colorScheme.outlineVariant
                                .withValues(alpha: 0.3),
                          )
                        : null,
                boxShadow: selectedColor == hex
                    ? [
                        BoxShadow(
                          color: hexToColor(hex).withValues(
                            alpha: isLight ? 0.4 : 0.5,
                          ),
                          blurRadius: isLight ? 10 : 8,
                          spreadRadius: isLight ? 1 : 2,
                        ),
                      ]
                    : isLight
                        ? [
                            BoxShadow(
                              color: const Color(0xFF1A0533).withValues(alpha: 0.12),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ]
                        : null,
              ),
              child: selectedColor == hex
                  ? Icon(
                      Icons.check,
                      color: _checkmarkColor(hex),
                      size: 20,
                    )
                  : null,
            ),
          ),
      ],
    );
  }

  /// Returns the display color with slightly deeper saturation on light mode.
  static Color _displayColor(String hex, bool isLight) {
    final color = hexToColor(hex);
    if (!isLight) return color;

    final hsl = HSLColor.fromColor(color);
    return hsl
        .withSaturation((hsl.saturation * 1.1).clamp(0.0, 1.0))
        .withLightness((hsl.lightness * 0.92).clamp(0.0, 1.0))
        .toColor();
  }

  /// Returns white or dark checkmark depending on the swatch luminance.
  static Color _checkmarkColor(String hex) {
    final color = hexToColor(hex);
    // Use white check on dark colors, dark check on light colors
    return color.computeLuminance() > 0.5
        ? const Color(0xFF1A0533)
        : Colors.white;
  }

}
