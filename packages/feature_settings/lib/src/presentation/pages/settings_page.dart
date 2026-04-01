import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../providers/settings_providers.dart';
import '../providers/theme_providers.dart';
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

            // Industry Mode section
            const _IndustryModeSection(),

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

// ---------------------------------------------------------------------------
// Industry Mode section
// ---------------------------------------------------------------------------

/// Maps a mode slug to a display-friendly name.
String _modeDisplayName(String slug) {
  return switch (slug) {
    'general' => 'General',
    'hustle' => 'Hustle',
    'closer' => 'Closer',
    'grind' => 'Grind',
    _ => slug[0].toUpperCase() + slug.substring(1),
  };
}

/// Maps a mode slug to an icon.
IconData _modeIcon(String slug) {
  return switch (slug) {
    'general' => Icons.tune_rounded,
    'hustle' => Icons.rocket_launch_rounded,
    'closer' => Icons.handshake_rounded,
    'grind' => Icons.fitness_center_rounded,
    _ => Icons.settings_suggest_rounded,
  };
}

class _IndustryModeSection extends ConsumerWidget {
  const _IndustryModeSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final vocab = ref.watch(vocabularyProvider);

    // Determine current mode from cached slug.
    // The vocabulary being empty means General mode.
    final isGeneral = vocab.isEmpty;

    // Try to read the cached slug from SharedPreferences synchronously.
    String slug = 'general';
    try {
      final prefs = ref.read(sharedPreferencesProvider);
      slug = prefs.getString('unjynx_active_mode_slug') ?? 'general';
    } catch (_) {
      // SharedPreferences not available; default to General.
    }

    final displayName = _modeDisplayName(slug);
    final modeIcon = _modeIcon(slug);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
          child: Text(
            'INDUSTRY MODE',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: colorScheme.primary,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Card(
          margin: const EdgeInsets.symmetric(horizontal: 12),
          child: ListTile(
            leading: Icon(modeIcon, color: colorScheme.onSurfaceVariant),
            title: Text(displayName),
            subtitle: Text(
              isGeneral
                  ? 'Standard labels, no vocabulary swap'
                  : '${vocab.length} labels customized',
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Change',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.chevron_right,
                  color: colorScheme.onSurfaceVariant,
                ),
              ],
            ),
            onTap: () {
              HapticFeedback.lightImpact();
              context.push('/settings/mode');
            },
          ),
        ),
      ],
    );
  }
}
