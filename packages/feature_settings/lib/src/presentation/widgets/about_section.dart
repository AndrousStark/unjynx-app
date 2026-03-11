import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'settings_section.dart';

/// About section: version, changelog, rate, feedback, support, social.
class AboutSection extends StatelessWidget {
  const AboutSection({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SettingsSection(
      title: 'About',
      children: [
        ListTile(
          leading: Icon(Icons.info_outline, color: colorScheme.onSurfaceVariant),
          title: const Text('Version'),
          subtitle: const Text('0.4.0 (Phase 4)'),
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.new_releases_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Changelog'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.star_outline_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Rate Us'),
          trailing: Icon(Icons.open_in_new, size: 18, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.feedback_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Send Feedback'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.support_agent_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Support'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.description_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Licenses'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            showLicensePage(
            context: context,
            applicationName: 'UNJYNX',
            applicationVersion: '0.4.0',
            );
          },
        ),
      ],
    );
  }
}
