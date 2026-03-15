import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'settings_section.dart';

/// Integrations section: calendar sync, third-party services.
class IntegrationsSection extends StatelessWidget {
  const IntegrationsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SettingsSection(
      title: 'Integrations',
      children: [
        ListTile(
          leading: Icon(Icons.calendar_today_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Google Calendar'),
          subtitle: const Text('Not connected'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Calendar sync coming in Phase 9')),
            );
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.event_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Apple Calendar'),
          subtitle: const Text('Not connected'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Calendar sync coming in Phase 9'),
              ),
            );
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.sync_alt_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Outlook Calendar'),
          subtitle: const Text('Not connected'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Calendar sync coming in Phase 9'),
              ),
            );
          },
        ),
      ],
    );
  }
}
