import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../../domain/entities/todo.dart';

/// A single action button shown in the bottom action row of the detail page.
class TodoDetailBottomAction extends StatelessWidget {
  const TodoDetailBottomAction({
    super.key,
    required this.icon,
    required this.label,
    this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color? color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final effectiveColor = color ?? colorScheme.onSurfaceVariant;

    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: effectiveColor.withValues(
                alpha: isLight ? 0.08 : 0.1,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 20, color: effectiveColor),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: effectiveColor,
            ),
          ),
        ],
      ),
    );
  }
}

/// A row inside a [PopupMenuItem] with icon + label, optionally destructive.
class TodoDetailMenuRow extends StatelessWidget {
  const TodoDetailMenuRow({
    super.key,
    required this.icon,
    required this.label,
    this.destructive = false,
  });

  final IconData icon;
  final String label;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = destructive ? colorScheme.error : colorScheme.onSurface;
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 12),
        Text(label, style: TextStyle(color: color)),
      ],
    );
  }
}

/// Shows a modal bottom sheet for picking a [TodoPriority].
///
/// Returns the selected priority, or `null` if dismissed.
Future<TodoPriority?> showPriorityPickerSheet(
  BuildContext context, {
  required TodoPriority currentPriority,
}) {
  return showModalBottomSheet<TodoPriority>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (context) {
      final cs = Theme.of(context).colorScheme;
      final uxInner = context.unjynx;
      final isLight = context.isLightMode;
      return Container(
        decoration: BoxDecoration(
          color: isLight ? Colors.white : cs.surface,
          borderRadius:
              const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Set Priority',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: cs.onSurface,
                    ),
                  ),
                ),
                for (final priority in TodoPriority.values)
                  ListTile(
                    leading: Icon(
                      Icons.flag,
                      color: unjynxPriorityColor(context, priority.name),
                    ),
                    title: Text(
                      priority == TodoPriority.none
                          ? 'No priority'
                          : '${priority.name[0].toUpperCase()}${priority.name.substring(1)}',
                      style: TextStyle(color: cs.onSurface),
                    ),
                    trailing: priority == currentPriority
                        ? Icon(Icons.check, color: uxInner.gold)
                        : null,
                    selected: priority == currentPriority,
                    onTap: () => Navigator.of(context).pop(priority),
                  ),
              ],
            ),
          ),
        ),
      );
    },
  );
}

/// Shows a confirmation dialog for deleting a task.
///
/// Returns `true` if the user confirmed, `false` or `null` otherwise.
Future<bool?> showDeleteConfirmation(
  BuildContext context, {
  required String taskTitle,
}) {
  return showDialog<bool>(
    context: context,
    builder: (context) {
      final cs = Theme.of(context).colorScheme;
      return AlertDialog(
        backgroundColor: cs.surface,
        title: Text('Delete Task?',
            style: TextStyle(color: cs.onSurface)),
        content: Text(
          'Are you sure you want to delete "$taskTitle"?',
          style: TextStyle(color: cs.onSurfaceVariant),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text('Delete',
                style: TextStyle(color: cs.error)),
          ),
        ],
      );
    },
  );
}

/// Shows a date picker followed by an optional time picker.
///
/// Returns a [DateTime] combining the selected date and time,
/// or `null` if the user dismissed.
Future<DateTime?> showDateTimePicker(
  BuildContext context, {
  DateTime? initialDate,
  TimeOfDay? initialTime,
}) async {
  final now = DateTime.now();
  final date = await showDatePicker(
    context: context,
    initialDate: initialDate ?? now,
    firstDate: DateTime(2020),
    lastDate: now.add(const Duration(days: 365 * 5)),
    builder: (context, child) => child!,
  );

  if (date == null) return null;

  final time = await showTimePicker(
    context: context,
    initialTime: initialTime ?? const TimeOfDay(hour: 9, minute: 0),
    builder: (context, child) => child!,
  );

  return DateTime(
    date.year,
    date.month,
    date.day,
    time?.hour ?? 9,
    time?.minute ?? 0,
  );
}
