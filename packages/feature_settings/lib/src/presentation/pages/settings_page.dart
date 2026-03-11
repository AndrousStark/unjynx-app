import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../providers/settings_providers.dart';
import '../widgets/about_section.dart';
import '../widgets/account_section.dart';
import '../widgets/ai_section.dart';
import '../widgets/appearance_section.dart';
import '../widgets/data_privacy_section.dart';
import '../widgets/integrations_section.dart';
import '../widgets/notification_settings_section.dart';
import '../widgets/productivity_section.dart';
import '../widgets/task_defaults_section.dart';

/// M1 - Full settings page with all sections from spec.
class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SingleChildScrollView(
        child: StaggeredColumn(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Account section
            const AccountSection(),

            // Appearance section
            const AppearanceSection(),

            // Notifications section
            const NotificationSettingsSection(),

            // Task Defaults section
            const TaskDefaultsSection(),

            // Productivity section
            const ProductivitySection(),

            // AI section
            const AiSection(),

            // Integrations section
            const IntegrationsSection(),

            // Data & Privacy section
            const DataPrivacySection(),

            // About section
            const AboutSection(),

            // Reset settings
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
              child: Card(
                child: ListTile(
                  leading: Icon(
                    Icons.restore,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  title: const Text('Reset All Settings'),
                  subtitle: const Text('Restore default values'),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _confirmReset(context, ref);
                  },
                ),
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  void _confirmReset(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final notifier = ref.read(appSettingsProvider.notifier);

    showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorScheme.surface,
        title: const Text('Reset Settings?'),
        content: const Text('All preferences will be restored to defaults.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: colorScheme.error,
            ),
            child: const Text('Reset'),
          ),
        ],
      ),
    ).then((confirmed) {
      if (confirmed == true) notifier.reset();
    });
  }
}
