import 'package:feature_home/src/presentation/widgets/mood_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

/// Step 1: Mood Check-in
///
/// Presents a mood emoji slider and shows a context-aware encouragement
/// message once the user selects a mood level (1-5).
class MoodStep extends StatelessWidget {
  const MoodStep({
    super.key,
    required this.selectedMood,
    required this.onMoodSelected,
  });

  final int? selectedMood;
  final ValueChanged<int> onMoodSelected;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Sunrise icon
          Icon(
            Icons.wb_sunny_rounded,
            size: 48,
            color: ux.gold,
          ),
          const SizedBox(height: 24),

          Text(
            'How are you feeling?',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 8),

          Text(
            'Start your day with awareness',
            style: TextStyle(
              fontSize: 15,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 40),

          MoodSlider(
            selectedMood: selectedMood,
            onMoodSelected: (mood) {
              HapticFeedback.selectionClick();
              onMoodSelected(mood);
            },
          ),

          const SizedBox(height: 32),

          // Subtle encouragement based on mood
          if (selectedMood != null)
            AnimatedOpacity(
              opacity: 1,
              duration: const Duration(milliseconds: 300),
              child: Text(
                _moodEncouragement(selectedMood!),
                style: TextStyle(
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }

  static String _moodEncouragement(int mood) {
    return switch (mood) {
      1 => 'Every sunrise is a fresh start.',
      2 => 'Rest is productive too. Be gentle today.',
      3 => 'Steady and present. That is enough.',
      4 => 'Channel this energy into what matters.',
      5 => 'On fire! Let nothing stand in your way.',
      _ => '',
    };
  }
}
