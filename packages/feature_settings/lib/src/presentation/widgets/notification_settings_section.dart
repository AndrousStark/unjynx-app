import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/entities/app_settings.dart';
import '../providers/settings_providers.dart';
import 'settings_section.dart';

/// Notification settings section with links to J1/J5, quiet hours, sounds.
class NotificationSettingsSection extends ConsumerWidget {
  const NotificationSettingsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final settings = ref.watch(appSettingsProvider);
    final notifier = ref.read(appSettingsProvider.notifier);

    return SettingsSection(
      title: 'Notifications',
      children: [
        SwitchListTile(
          title: const Text('Enable Notifications'),
          subtitle: const Text('Push, sound, and badge alerts'),
          value: settings.notificationsEnabled,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            HapticFeedback.selectionClick();
            notifier.update(
              (s) => s.copyWith(notificationsEnabled: value),
            );
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.notifications_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Notification Hub'),
          subtitle: const Text('Manage channels and delivery'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            GoRouter.of(context).push('/notifications');
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.do_not_disturb_on_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Quiet Hours'),
          subtitle: Text(
            settings.quietHoursStart != null
                ? '${settings.quietHoursStart}:00 - ${settings.quietHoursEnd}:00'
                : 'Off',
          ),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            GoRouter.of(context).push('/notifications/quiet-hours');
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.send_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Test Notifications'),
          subtitle: const Text('Send a test to each channel'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            GoRouter.of(context).push('/notifications/test');
          },
        ),
        const Divider(height: 1),
        ListTile(
          title: const Text('Default Reminder'),
          subtitle: Text('${settings.defaultReminderMinutes} minutes before'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            _showReminderPicker(context, notifier, settings);
          },
        ),
      ],
    );
  }

  void _showReminderPicker(
    BuildContext context,
    SettingsNotifier notifier,
    AppSettings settings,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    const options = [5, 10, 15, 30, 60];
    showModalBottomSheet<int>(
      context: context,
      backgroundColor: colorScheme.surface,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final minutes in options)
              ListTile(
                title: Text(
                  '$minutes minutes',
                  style: TextStyle(color: colorScheme.onSurface),
                ),
                selected: settings.defaultReminderMinutes == minutes,
                onTap: () => Navigator.of(context).pop(minutes),
              ),
          ],
        ),
      ),
    ).then((selected) {
      if (selected != null) {
        notifier.update((s) => s.copyWith(defaultReminderMinutes: selected));
      }
    });
  }
}
