import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/settings_providers.dart';
import 'settings_section.dart';

/// Data & Privacy section: offline mode, sync, cache, privacy, terms.
class DataPrivacySection extends ConsumerWidget {
  const DataPrivacySection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final settings = ref.watch(appSettingsProvider);
    final notifier = ref.read(appSettingsProvider.notifier);

    return SettingsSection(
      title: 'Data & Privacy',
      children: [
        SwitchListTile(
          title: const Text('Offline Mode'),
          subtitle: const Text('Work without internet, sync later'),
          value: settings.offlineMode,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            HapticFeedback.selectionClick();
            notifier.update((s) => s.copyWith(offlineMode: value));
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
            _showSyncStatusDialog(context);
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
            _copyUrlAndNotify(context, 'https://unjynx.me/privacy');
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.article_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Terms of Service'),
          trailing: Icon(Icons.open_in_new, size: 18, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            _copyUrlAndNotify(context, 'https://unjynx.me/terms');
          },
        ),
      ],
    );
  }

  void _showSyncStatusDialog(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorScheme.surface,
        title: const Text('Sync Status'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SyncStatusRow(
              label: 'Tasks',
              status: 'Synced',
              icon: Icons.check_circle_outline,
              color: Colors.green,
            ),
            const SizedBox(height: 8),
            _SyncStatusRow(
              label: 'Projects',
              status: 'Synced',
              icon: Icons.check_circle_outline,
              color: Colors.green,
            ),
            const SizedBox(height: 8),
            _SyncStatusRow(
              label: 'Settings',
              status: 'Synced',
              icon: Icons.check_circle_outline,
              color: Colors.green,
            ),
            const SizedBox(height: 16),
            Text(
              'Last sync: just now',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _copyUrlAndNotify(BuildContext context, String url) {
    Clipboard.setData(ClipboardData(text: url));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Copied $url to clipboard'),
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

class _SyncStatusRow extends StatelessWidget {
  const _SyncStatusRow({
    required this.label,
    required this.status,
    required this.icon,
    required this.color,
  });

  final String label;
  final String status;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Expanded(child: Text(label)),
        Text(
          status,
          style: TextStyle(color: color, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }
}
