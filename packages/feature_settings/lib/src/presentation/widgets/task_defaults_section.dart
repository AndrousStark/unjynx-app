import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/app_settings.dart';
import '../providers/settings_providers.dart';
import 'settings_section.dart';

/// Task defaults section: project, priority, reminder, view, week start.
class TaskDefaultsSection extends ConsumerWidget {
  const TaskDefaultsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final settings = ref.watch(appSettingsProvider);
    final notifier = ref.read(appSettingsProvider.notifier);

    return SettingsSection(
      title: 'Task Defaults',
      children: [
        ListTile(
          title: const Text('Default Priority'),
          subtitle: Text(
            settings.defaultPriority == 'none'
                ? 'No priority'
                : settings.defaultPriority[0].toUpperCase() +
                    settings.defaultPriority.substring(1),
          ),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.selectionClick();
            _showPriorityPicker(context, notifier, settings);
          },
        ),
        const Divider(height: 1),
        ListTile(
          title: const Text('Start of Week'),
          subtitle: Text(settings.startOfWeek == 1 ? 'Monday' : 'Sunday'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.selectionClick();
            notifier.update(
              (s) => s.copyWith(startOfWeek: s.startOfWeek == 1 ? 7 : 1),
            );
          },
        ),
        const Divider(height: 1),
        ListTile(
          title: const Text('Auto-Archive Completed'),
          subtitle: Text('After ${settings.autoArchiveDays} days'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.selectionClick();
            _showArchiveDaysPicker(context, notifier, settings);
          },
        ),
        const Divider(height: 1),
        // Date format placeholder
        ListTile(
          title: const Text('Date Format'),
          subtitle: const Text('DD/MM/YYYY'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.selectionClick();
          },
        ),
        const Divider(height: 1),
        // Time format placeholder
        ListTile(
          title: const Text('Time Format'),
          subtitle: const Text('12-hour'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.selectionClick();
          },
        ),
      ],
    );
  }

  void _showPriorityPicker(
    BuildContext context,
    SettingsNotifier notifier,
    AppSettings settings,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    const priorities = ['none', 'low', 'medium', 'high', 'urgent'];
    showModalBottomSheet<String>(
      context: context,
      backgroundColor: colorScheme.surface,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final p in priorities)
              ListTile(
                title: Text(
                  p == 'none' ? 'No priority' : p[0].toUpperCase() + p.substring(1),
                  style: TextStyle(color: colorScheme.onSurface),
                ),
                selected: settings.defaultPriority == p,
                onTap: () => Navigator.of(context).pop(p),
              ),
          ],
        ),
      ),
    ).then((selected) {
      if (selected != null) {
        notifier.update((s) => s.copyWith(defaultPriority: selected));
      }
    });
  }

  void _showArchiveDaysPicker(
    BuildContext context,
    SettingsNotifier notifier,
    AppSettings settings,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    const options = [1, 3, 7, 14, 30];
    showModalBottomSheet<int>(
      context: context,
      backgroundColor: colorScheme.surface,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final days in options)
              ListTile(
                title: Text(
                  '$days day${days == 1 ? '' : 's'}',
                  style: TextStyle(color: colorScheme.onSurface),
                ),
                selected: settings.autoArchiveDays == days,
                onTap: () => Navigator.of(context).pop(days),
              ),
          ],
        ),
      ),
    ).then((selected) {
      if (selected != null) {
        notifier.update((s) => s.copyWith(autoArchiveDays: selected));
      }
    });
  }
}
