import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A row of 5 mood emoji icons for the Morning Ritual mood check-in.
///
/// Each icon has a label below. The selected mood gets a gold border
/// and a slight scale-up (1.1x). Unselected moods sit on a
/// surfaceContainerHigh circle.
///
/// Mood values: 1 = Drained, 2 = Tired, 3 = Okay, 4 = Good, 5 = Great.
class MoodSlider extends StatelessWidget {
  const MoodSlider({
    required this.selectedMood,
    required this.onMoodSelected,
    super.key,
  });

  /// Currently selected mood (1-5), or `null` if nothing selected yet.
  final int? selectedMood;

  /// Called when the user taps a mood icon.
  final ValueChanged<int> onMoodSelected;

  static const _moods = <_MoodOption>[
    _MoodOption(
      value: 1,
      icon: Icons.sentiment_very_dissatisfied_rounded,
      label: 'Drained',
    ),
    _MoodOption(
      value: 2,
      icon: Icons.sentiment_dissatisfied_rounded,
      label: 'Tired',
    ),
    _MoodOption(
      value: 3,
      icon: Icons.sentiment_neutral_rounded,
      label: 'Okay',
    ),
    _MoodOption(
      value: 4,
      icon: Icons.sentiment_satisfied_rounded,
      label: 'Good',
    ),
    _MoodOption(
      value: 5,
      icon: Icons.sentiment_very_satisfied_rounded,
      label: 'Great',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        for (final mood in _moods)
          _MoodButton(
            mood: mood,
            isSelected: selectedMood == mood.value,
            onTap: () => onMoodSelected(mood.value),
          ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Internal data class
// ---------------------------------------------------------------------------

class _MoodOption {
  const _MoodOption({
    required this.value,
    required this.icon,
    required this.label,
  });

  final int value;
  final IconData icon;
  final String label;
}

// ---------------------------------------------------------------------------
// Single mood button
// ---------------------------------------------------------------------------

class _MoodButton extends StatelessWidget {
  const _MoodButton({
    required this.mood,
    required this.isSelected,
    required this.onTap,
  });

  final _MoodOption mood;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedScale(
        scale: isSelected ? 1.1 : 1.0,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Circle with icon
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                // Light: goldWash selected, lavender unselected
                // Dark: gold at 15% selected, surfaceContainerHigh unselected
                color: isSelected
                    ? (isLight
                        ? ux.goldWash
                        : ux.gold.withValues(alpha: 0.15))
                    : colorScheme.surfaceContainerHigh,
                border: Border.all(
                  color: isSelected
                      ? ux.gold
                      : colorScheme.surfaceContainerHigh,
                  width: isSelected ? 2.5 : 1.5,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: ux.gold
                              .withValues(alpha: isLight ? 0.2 : 0.3),
                          blurRadius: isLight ? 6 : 10,
                        ),
                      ]
                    : null,
              ),
              child: Center(
                child: Icon(
                  mood.icon,
                  size: 28,
                  color: isSelected
                      ? ux.gold
                      : colorScheme.onSurfaceVariant,
                ),
              ),
            ),

            const SizedBox(height: 8),

            // Label
            Text(
              mood.label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected
                    ? ux.gold
                    : colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
