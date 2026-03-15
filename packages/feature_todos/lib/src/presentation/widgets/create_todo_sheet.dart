import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';
import '../providers/todo_providers.dart';

/// Bottom sheet for creating a new TODO with title, priority, and due date.
class CreateTodoSheet extends ConsumerStatefulWidget {
  const CreateTodoSheet({super.key});

  @override
  ConsumerState<CreateTodoSheet> createState() => _CreateTodoSheetState();
}

class _CreateTodoSheetState extends ConsumerState<CreateTodoSheet> {
  final _titleController = TextEditingController();
  TodoPriority _priority = TodoPriority.none;
  DateTime? _dueDate;
  TimeOfDay? _dueTime;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'New Task',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 16),

          // Title
          TextField(
            controller: _titleController,
            autofocus: true,
            style: TextStyle(color: colorScheme.onSurface),
            decoration: InputDecoration(
              hintText: 'What needs to be done?',
              hintStyle: TextStyle(color: colorScheme.onSurfaceVariant),
            ),
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 16),

          // Quick actions row
          Row(
            children: [
              // Priority
              _ActionChip(
                icon: Icons.flag_outlined,
                label: _priority == TodoPriority.none
                    ? 'Priority'
                    : _priority.name.toUpperCase(),
                color: unjynxPriorityColor(context, _priority.name),
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showPriorityPicker();
                },
              ),
              const SizedBox(width: 8),

              // Due date
              _ActionChip(
                icon: Icons.calendar_today_outlined,
                label: _dueDate == null
                    ? 'Due date'
                    : _formatDueDate(_dueDate!, _dueTime),
                color: _dueDate != null
                    ? ux.gold
                    : colorScheme.onSurfaceVariant,
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showDatePicker();
                },
              ),

              // Clear due date
              if (_dueDate != null)
                IconButton(
                  icon: const Icon(Icons.close, size: 16),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    setState(() {
                      _dueDate = null;
                      _dueTime = null;
                    });
                  },
                  color: colorScheme.onSurfaceVariant,
                  iconSize: 16,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(
                    minWidth: 44,
                    minHeight: 44,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),

          // Submit
          ElevatedButton(
            onPressed: _isSubmitting
                ? null
                : () {
                    HapticFeedback.mediumImpact();
                    _submit();
                  },
            child: _isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Add Task'),
          ),
        ],
      ),
    );
  }

  void _showPriorityPicker() {
    final colorScheme = Theme.of(context).colorScheme;

    showModalBottomSheet<TodoPriority>(
      context: context,
      backgroundColor: colorScheme.surface,
      builder: (context) {
        final cs = Theme.of(context).colorScheme;
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final priority in TodoPriority.values)
                ListTile(
                  leading: Icon(
                    Icons.flag,
                    color: unjynxPriorityColor(context, priority.name),
                  ),
                  title: Text(
                    priority == TodoPriority.none
                        ? 'No priority'
                        : priority.name[0].toUpperCase() +
                            priority.name.substring(1),
                    style: TextStyle(color: cs.onSurface),
                  ),
                  selected: priority == _priority,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    Navigator.of(context).pop(priority);
                  },
                ),
            ],
          ),
        );
      },
    ).then((selected) {
      if (selected != null) {
        setState(() => _priority = selected);
      }
    });
  }

  Future<void> _showDatePicker() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365 * 5)),
    );

    if (date == null || !mounted) return;

    // Ask for time
    final time = await showTimePicker(
      context: context,
      initialTime: _dueTime ?? const TimeOfDay(hour: 9, minute: 0),
    );

    if (!mounted) return;

    setState(() {
      _dueDate = date;
      _dueTime = time;
    });
  }

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) return;

    setState(() => _isSubmitting = true);

    DateTime? scheduledAt;
    if (_dueDate != null) {
      final time = _dueTime ?? const TimeOfDay(hour: 9, minute: 0);
      scheduledAt = DateTime(
        _dueDate!.year,
        _dueDate!.month,
        _dueDate!.day,
        time.hour,
        time.minute,
      );
    }

    final createTodo = ref.read(createTodoProvider);
    final result = await createTodo(
      title: title,
      priority: _priority,
      dueDate: scheduledAt,
    );

    // Schedule notification if due date is set and in the future
    if (scheduledAt != null && scheduledAt.isAfter(DateTime.now())) {
      result.when(
        ok: (todo) async {
          final notificationPort = ref.read(notificationPortProvider);
          await notificationPort.schedule(
            id: todo.id,
            title: 'Task reminder',
            body: todo.title,
            scheduledAt: scheduledAt!,
            payload: {'todo_id': todo.id},
          );
        },
        err: (_, __) {},
      );
    }

    ref.invalidate(todoListProvider);

    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  String _formatDueDate(DateTime date, TimeOfDay? time) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(date.year, date.month, date.day);

    String dateStr;
    if (dateOnly == today) {
      dateStr = 'Today';
    } else if (dateOnly == today.add(const Duration(days: 1))) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = '${date.day}/${date.month}';
    }

    if (time != null) {
      final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
      final period = time.period == DayPeriod.am ? 'AM' : 'PM';
      final min = time.minute.toString().padLeft(2, '0');
      dateStr = '$dateStr $hour:$min $period';
    }
    return dateStr;
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: isLight ? 0.08 : 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: color.withValues(alpha: isLight ? 0.25 : 0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
