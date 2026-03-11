import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'settings_section.dart';

/// Data & Privacy section: offline mode, sync, cache, privacy, terms.
class DataPrivacySection extends StatelessWidget {
  const DataPrivacySection({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SettingsSection(
      title: 'Data & Privacy',
      children: [
        SwitchListTile(
          title: const Text('Offline Mode'),
          subtitle: const Text('Work without internet, sync later'),
          value: true,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            HapticFeedback.selectionClick();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.sync_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Sync Status'),
          subtitle: const Text('All data synced'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.cached_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Clear Cache'),
          subtitle: const Text('Free up storage space'),
          onTap: () {
            HapticFeedback.mediumImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Cache cleared')),
            );
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.privacy_tip_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Privacy Policy'),
          trailing: Icon(Icons.open_in_new, size: 18, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.article_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Terms of Service'),
          trailing: Icon(Icons.open_in_new, size: 18, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
      ],
    );
  }
}
