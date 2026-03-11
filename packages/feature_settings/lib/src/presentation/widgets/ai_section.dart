import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'settings_section.dart';

/// AI settings section: smart suggestions, proactive insights.
class AiSection extends StatelessWidget {
  const AiSection({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SettingsSection(
      title: 'AI',
      children: [
        SwitchListTile(
          title: const Text('Smart Suggestions'),
          subtitle: const Text('AI-powered task scheduling hints'),
          value: true,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            HapticFeedback.selectionClick();
            // TODO: Wire to settings provider when AI module is ready.
          },
        ),
        const Divider(height: 1),
        SwitchListTile(
          title: const Text('Proactive Insights'),
          subtitle: const Text('Weekly productivity analysis'),
          value: true,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            HapticFeedback.selectionClick();
          },
        ),
      ],
    );
  }
}
