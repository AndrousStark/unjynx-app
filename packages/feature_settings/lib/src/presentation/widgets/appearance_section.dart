import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/theme_providers.dart';
import 'settings_section.dart';

/// Appearance section: theme, color scheme, font size, density, animations.
class AppearanceSection extends ConsumerWidget {
  const AppearanceSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final themeMode = ref.watch(themeModeProvider);
    final fontSize = ref.watch(fontSizeProvider);
    final reduceAnimations = ref.watch(reduceAnimationsProvider);
    final hapticEnabled = ref.watch(hapticFeedbackProvider);

    return SettingsSection(
      title: 'Appearance',
      children: [
        // Theme mode
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Theme mode', style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: SegmentedButton<ThemeMode>(
                  segments: const [
                    ButtonSegment(
                      value: ThemeMode.system,
                      icon: Icon(Icons.brightness_auto),
                      label: Text('System'),
                    ),
                    ButtonSegment(
                      value: ThemeMode.light,
                      icon: Icon(Icons.light_mode),
                      label: Text('Light'),
                    ),
                    ButtonSegment(
                      value: ThemeMode.dark,
                      icon: Icon(Icons.dark_mode),
                      label: Text('Dark'),
                    ),
                  ],
                  selected: {themeMode},
                  onSelectionChanged: (selected) {
                    HapticFeedback.selectionClick();
                    ref
                        .read(themeModeProvider.notifier)
                        .setThemeMode(selected.first);
                  },
                ),
              ),
            ],
          ),
        ),
        Divider(height: 1, color: const Color(0xFF6B21A8).withValues(alpha: 0.06)),
        // Font size
        ListTile(
          leading: Icon(Icons.text_fields_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Font Size'),
          subtitle: Text(fontSize.label),
          trailing: SizedBox(
            width: 200,
            child: SegmentedButton<FontSizeOption>(
              segments: const [
                ButtonSegment(
                  value: FontSizeOption.small,
                  label: Text('S'),
                ),
                ButtonSegment(
                  value: FontSizeOption.medium,
                  label: Text('M'),
                ),
                ButtonSegment(
                  value: FontSizeOption.large,
                  label: Text('L'),
                ),
              ],
              selected: {fontSize},
              onSelectionChanged: (selected) {
                HapticFeedback.selectionClick();
                ref
                    .read(fontSizeProvider.notifier)
                    .setFontSize(selected.first);
              },
            ),
          ),
        ),
        Divider(height: 1, color: const Color(0xFF6B21A8).withValues(alpha: 0.06)),
        // Animations toggle
        SwitchListTile(
          title: const Text('Animations'),
          subtitle: Text(
            reduceAnimations
                ? 'UI transitions disabled'
                : 'Enable UI transitions',
          ),
          value: !reduceAnimations,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            HapticFeedback.selectionClick();
            ref.read(reduceAnimationsProvider.notifier).set(!value);
          },
        ),
        Divider(height: 1, color: const Color(0xFF6B21A8).withValues(alpha: 0.06)),
        // Haptic feedback
        SwitchListTile(
          title: const Text('Haptic Feedback'),
          subtitle: Text(
            hapticEnabled
                ? 'Vibration on interactions'
                : 'Vibration disabled',
          ),
          value: hapticEnabled,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            if (hapticEnabled) {
              HapticFeedback.selectionClick();
            }
            ref.read(hapticFeedbackProvider.notifier).set(value);
          },
        ),
      ],
    );
  }
}
