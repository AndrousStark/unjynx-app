import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';

/// Tappable info rows showing task metadata (project, date, priority, etc).
///
/// Each row has an icon, label, value, and optional tap handler for editing.
class TaskInfoSection extends StatelessWidget {
  const TaskInfoSection({
    super.key,
    required this.todo,
    this.projectName,
    this.onDateTap,
    this.onPriorityTap,
    this.onProjectTap,
    this.onRecurrenceTap,
    this.onTagsTap,
    this.onReminderTap,
  });

  final Todo todo;
  final String? projectName;
  final VoidCallback? onDateTap;
  final VoidCallback? onPriorityTap;
  final VoidCallback? onProjectTap;
  final VoidCallback? onRecurrenceTap;
  final VoidCallback? onTagsTap;
  final VoidCallback? onReminderTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        color: isLight ? Colors.white : colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isLight
              ? colorScheme.primary.withValues(alpha: 0.12)
              : colorScheme.surfaceContainerHigh,
        ),
      ),
      child: Column(
        children: [
          // Project
          _InfoRow(
            icon: Icons.folder_outlined,
            label: 'Project',
            value: projectName ?? 'None',
            valueColor: projectName != null
                ? colorScheme.primary
                : colorScheme.onSurfaceVariant,
            onTap: onProjectTap,
          ),
          _divider(context),

          // Due date
          _InfoRow(
            icon: Icons.calendar_today_outlined,
            label: 'Due date',
            value: _formatDueDate(todo.dueDate),
            valueColor: _dueDateColor(context, todo.dueDate),
            onTap: onDateTap,
          ),
          _divider(context),

          // Priority
          _InfoRow(
            icon: Icons.flag_outlined,
            label: 'Priority',
            value: _priorityLabel(todo.priority),
            valueColor: unjynxPriorityColor(context, todo.priority.name),
            trailing: Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: unjynxPriorityColor(context, todo.priority.name),
              ),
            ),
            onTap: onPriorityTap,
          ),
          _divider(context),

          // Recurrence
          _InfoRow(
            icon: Icons.repeat_rounded,
            label: 'Repeat',
            value: todo.rrule != null ? _humanizeRrule(todo.rrule!) : 'None',
            valueColor: todo.rrule != null
                ? ux.gold
                : colorScheme.onSurfaceVariant,
            onTap: onRecurrenceTap,
          ),
          _divider(context),

          // Tags
          _InfoRow(
            icon: Icons.label_outline,
            label: 'Tags',
            value: 'Add tags',
            valueColor: colorScheme.onSurfaceVariant,
            onTap: onTagsTap,
          ),
          _divider(context),

          // Reminder
          _InfoRow(
            icon: Icons.notifications_none_rounded,
            label: 'Reminder',
            value: todo.dueDate != null ? 'At due time' : 'Not set',
            valueColor: todo.dueDate != null
                ? ux.gold
                : colorScheme.onSurfaceVariant,
            onTap: onReminderTap,
            showDivider: false,
          ),
        ],
      ),
    );
  }

  Widget _divider(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Divider(
      height: 1,
      indent: 44,
      color: colorScheme.surfaceContainerHigh,
    );
  }

  String _formatDueDate(DateTime? date) {
    if (date == null) return 'Not set';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(date.year, date.month, date.day);

    if (dateOnly == today) {
      return 'Today${_formatTime(date)}';
    }
    if (dateOnly == today.add(const Duration(days: 1))) {
      return 'Tomorrow${_formatTime(date)}';
    }
    if (dateOnly == today.subtract(const Duration(days: 1))) {
      return 'Yesterday${_formatTime(date)}';
    }

    final diff = dateOnly.difference(today).inDays;
    if (diff > 0 && diff <= 7) {
      const weekdays = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday',
        'Friday', 'Saturday', 'Sunday',
      ];
      return '${weekdays[date.weekday - 1]}${_formatTime(date)}';
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}${_formatTime(date)}';
  }

  String _formatTime(DateTime date) {
    if (date.hour == 0 && date.minute == 0) return '';
    final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
    final period = date.hour >= 12 ? 'PM' : 'AM';
    final minute = date.minute.toString().padLeft(2, '0');
    return ', $hour:$minute $period';
  }

  Color _dueDateColor(BuildContext context, DateTime? date) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    if (date == null) return colorScheme.onSurfaceVariant;
    final now = DateTime.now();
    if (date.isBefore(now)) return colorScheme.error;
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(date.year, date.month, date.day);
    if (dateOnly == today) return ux.warning;
    return colorScheme.onSurface;
  }

  String _priorityLabel(TodoPriority priority) {
    return switch (priority) {
      TodoPriority.urgent => 'P1 - Urgent',
      TodoPriority.high => 'P2 - High',
      TodoPriority.medium => 'P3 - Medium',
      TodoPriority.low => 'P4 - Low',
      TodoPriority.none => 'None',
    };
  }

  String _humanizeRrule(String rrule) {
    final upper = rrule.toUpperCase();
    if (upper.contains('DAILY')) return 'Every day';
    if (upper.contains('WEEKLY')) {
      if (upper.contains('MO,TU,WE,TH,FR')) return 'Weekdays';
      return 'Every week';
    }
    if (upper.contains('MONTHLY')) return 'Every month';
    if (upper.contains('YEARLY')) return 'Every year';
    return 'Custom';
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.valueColor,
    this.trailing,
    this.onTap,
    this.showDivider = true,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color valueColor;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return InkWell(
      onTap: onTap == null
          ? null
          : () {
              HapticFeedback.lightImpact();
              onTap!();
            },
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(icon, size: 18, color: colorScheme.onSurfaceVariant),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const Spacer(),
            if (trailing != null) ...[
              trailing!,
              const SizedBox(width: 8),
            ],
            Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: valueColor,
              ),
            ),
            const SizedBox(width: 4),
            if (onTap != null)
              Icon(
                Icons.chevron_right,
                size: 16,
                color: colorScheme.onSurfaceVariant,
              ),
          ],
        ),
      ),
    );
  }
}
