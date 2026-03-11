import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'settings_section.dart';

/// Productivity section: ghost mode, pomodoro, ritual times, content delivery.
class ProductivitySection extends StatelessWidget {
  const ProductivitySection({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SettingsSection(
      title: 'Productivity',
      children: [
        SwitchListTile(
          title: const Text('Ghost Mode'),
          subtitle: const Text('Hide all notifications temporarily'),
          value: false,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            HapticFeedback.selectionClick();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.timer_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Pomodoro Duration'),
          subtitle: const Text('25 min work / 5 min break'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.self_improvement_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Morning Ritual Time'),
          subtitle: const Text('7:00 AM'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.nightlight_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Evening Ritual Time'),
          subtitle: const Text('9:00 PM'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.auto_stories_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Content Delivery'),
          subtitle: const Text('Daily quotes and insights at 8:00 AM'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
      ],
    );
  }
}
