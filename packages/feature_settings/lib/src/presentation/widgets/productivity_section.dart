import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/app_settings.dart';
import '../providers/settings_providers.dart';
import 'settings_section.dart';

/// Productivity section: ghost mode, pomodoro, ritual times, content delivery.
class ProductivitySection extends ConsumerWidget {
  const ProductivitySection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final settings = ref.watch(appSettingsProvider);
    final notifier = ref.read(appSettingsProvider.notifier);

    return SettingsSection(
      title: 'Productivity',
      children: [
        SwitchListTile(
          title: const Text('Ghost Mode'),
          subtitle: const Text('Hide all notifications temporarily'),
          value: settings.ghostModeEnabled,
          activeColor: colorScheme.primary,
          onChanged: (value) {
            HapticFeedback.selectionClick();
            notifier.update((s) => s.copyWith(ghostModeEnabled: value));
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.timer_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Pomodoro Duration'),
          subtitle: Text(
            '${settings.pomodoroWorkMinutes} min work / '
            '${settings.pomodoroBreakMinutes} min break',
          ),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            _showPomodoroPicker(context, notifier, settings);
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.self_improvement_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Morning Ritual Time'),
          subtitle: Text(_formatTimeString(settings.morningRitualTime)),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            _showTimePicker(
              context: context,
              currentTime: settings.morningRitualTime,
              onSelected: (time) {
                notifier.update((s) => s.copyWith(morningRitualTime: time));
              },
            );
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.nightlight_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Evening Ritual Time'),
          subtitle: Text(_formatTimeString(settings.eveningRitualTime)),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            _showTimePicker(
              context: context,
              currentTime: settings.eveningRitualTime,
              onSelected: (time) {
                notifier.update((s) => s.copyWith(eveningRitualTime: time));
              },
            );
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.auto_stories_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Content Delivery'),
          subtitle: Text(
            'Daily quotes and insights at '
            '${_formatTimeString(settings.contentDeliveryTime)}',
          ),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            _showTimePicker(
              context: context,
              currentTime: settings.contentDeliveryTime,
              onSelected: (time) {
                notifier.update(
                  (s) => s.copyWith(contentDeliveryTime: time),
                );
              },
            );
          },
        ),
      ],
    );
  }

  /// Parse "HH:mm" string into a TimeOfDay.
  TimeOfDay _parseTime(String timeStr) {
    final parts = timeStr.split(':');
    return TimeOfDay(
      hour: int.tryParse(parts[0]) ?? 0,
      minute: int.tryParse(parts.length > 1 ? parts[1] : '0') ?? 0,
    );
  }

  /// Format "HH:mm" string into a human-readable time.
  String _formatTimeString(String timeStr) {
    final tod = _parseTime(timeStr);
    final hour = tod.hourOfPeriod == 0 ? 12 : tod.hourOfPeriod;
    final minute = tod.minute.toString().padLeft(2, '0');
    final period = tod.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  Future<void> _showTimePicker({
    required BuildContext context,
    required String currentTime,
    required ValueChanged<String> onSelected,
  }) async {
    final initial = _parseTime(currentTime);
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
    );
    if (picked != null) {
      final formatted =
          '${picked.hour.toString().padLeft(2, '0')}:'
          '${picked.minute.toString().padLeft(2, '0')}';
      onSelected(formatted);
    }
  }

  void _showPomodoroPicker(
    BuildContext context,
    SettingsNotifier notifier,
    AppSettings settings,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    const workOptions = [15, 20, 25, 30, 45, 50, 60];
    const breakOptions = [3, 5, 10, 15, 20];

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: colorScheme.surface,
      builder: (context) {
        var selectedWork = settings.pomodoroWorkMinutes;
        var selectedBreak = settings.pomodoroBreakMinutes;

        return StatefulBuilder(
          builder: (context, setState) => SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Pomodoro Duration',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Work duration',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      for (final mins in workOptions)
                        ChoiceChip(
                          label: Text('$mins min'),
                          selected: selectedWork == mins,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => selectedWork = mins);
                            }
                          },
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Break duration',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      for (final mins in breakOptions)
                        ChoiceChip(
                          label: Text('$mins min'),
                          selected: selectedBreak == mins,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => selectedBreak = mins);
                            }
                          },
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {
                        notifier.update(
                          (s) => s.copyWith(
                            pomodoroWorkMinutes: selectedWork,
                            pomodoroBreakMinutes: selectedBreak,
                          ),
                        );
                        Navigator.of(context).pop();
                      },
                      child: const Text('Save'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
