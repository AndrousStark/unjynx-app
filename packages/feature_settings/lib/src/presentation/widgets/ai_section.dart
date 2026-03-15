import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/settings_providers.dart';
import 'settings_section.dart';

/// AI settings section: smart suggestions, proactive insights.
class AiSection extends ConsumerWidget {
  const AiSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final settings = ref.watch(appSettingsProvider);
    final notifier = ref.read(appSettingsProvider.notifier);

    return SettingsSection(
      title: 'AI',
      children: [
        SwitchListTile(
          title: const Text('Smart Suggestions'),
          subtitle: const Text('AI-powered task scheduling hints'),
          value: settings.smartSuggestionsEnabled,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            HapticFeedback.selectionClick();
            notifier.update(
              (s) => s.copyWith(smartSuggestionsEnabled: value),
            );
          },
        ),
        const Divider(height: 1),
        SwitchListTile(
          title: const Text('Proactive Insights'),
          subtitle: const Text('Weekly productivity analysis'),
          value: settings.proactiveInsightsEnabled,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            HapticFeedback.selectionClick();
            notifier.update(
              (s) => s.copyWith(proactiveInsightsEnabled: value),
            );
          },
        ),
      ],
    );
  }
}
