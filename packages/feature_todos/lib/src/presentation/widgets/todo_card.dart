import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';

// Re-use accessibility utilities from core.

/// Card widget displaying a single TODO item.
///
/// Supports tap, long-press (for bulk mode), and completion toggle.
class TodoCard extends StatelessWidget {
  final Todo todo;
  final VoidCallback? onTap;
  final VoidCallback? onComplete;
  final VoidCallback? onDelete;
  final VoidCallback? onLongPress;

  const TodoCard({
    super.key,
    required this.todo,
    this.onTap,
    this.onComplete,
    this.onDelete,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final isCompleted = todo.status == TodoStatus.completed;

    // Light mode: gold fill + purple strikethrough; Dark mode: gold glow
    final completedCheckColor = isLight ? ux.gold : ux.success;

    // Build accessible description for screen readers.
    final semanticDesc = taskSemanticLabel(
      title: todo.title,
      priority: todo.priority != TodoPriority.none ? todo.priority.name : null,
      dueDescription: todo.dueDate != null
          ? _formatDueDateForA11y(todo.dueDate!)
          : null,
      isCompleted: isCompleted,
    );

    return Semantics(
      label: semanticDesc,
      child: GestureDetector(
      onLongPress: onLongPress == null
          ? null
          : () {
              HapticFeedback.mediumImpact();
              onLongPress!();
            },
      child: PressableScale(
        onTap: onTap == null
            ? null
            : () {
                HapticFeedback.lightImpact();
                onTap!();
              },
        child: Card(
          child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Completion checkbox (48x48dp touch target wrapping 28x28dp visual)
              Semantics(
                label: isCompleted ? 'Mark task incomplete' : 'Mark task complete',
                button: true,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: onComplete == null
                      ? null
                      : () {
                          HapticFeedback.selectionClick();
                          onComplete!();
                        },
                  child: SizedBox(
                    width: 48,
                    height: 48,
                    child: Center(
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isCompleted
                                ? completedCheckColor
                                : unjynxPriorityColor(context, todo.priority.name),
                            width: 2,
                          ),
                          color: isCompleted
                              ? completedCheckColor
                                  .withValues(alpha: isLight ? 0.15 : 0.2)
                              : Colors.transparent,
                        ),
                        child: isCompleted
                            ? Icon(
                                Icons.check,
                                size: 16,
                                color: completedCheckColor,
                              )
                            : null,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      todo.title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: isCompleted
                            ? colorScheme.onSurfaceVariant
                            : colorScheme.onSurface,
                        decoration:
                            isCompleted ? TextDecoration.lineThrough : null,
                        decorationColor: isCompleted && isLight
                            ? colorScheme.primary
                            : null,
                      ),
                    ),
                    if (todo.description.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        todo.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                    if (todo.dueDate != null) ...[
                      const SizedBox(height: 6),
                      _DueDateChip(dueDate: todo.dueDate!),
                    ],
                  ],
                ),
              ),

              // Priority indicator
              if (todo.priority != TodoPriority.none)
                Container(
                  width: 4,
                  height: 40,
                  decoration: BoxDecoration(
                    color: unjynxPriorityColor(context, todo.priority.name),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
            ],
          ),
        ),
        ),
      ),
    ),
    );
  }

  static String _formatDueDateForA11y(DateTime dueDate) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(dueDate.year, dueDate.month, dueDate.day);
    if (dateOnly.isBefore(today)) return 'overdue';
    if (dateOnly == today) return 'today';
    if (dateOnly == today.add(const Duration(days: 1))) return 'tomorrow';
    final months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return '${months[dueDate.month - 1]} ${dueDate.day}';
  }
}

class _DueDateChip extends StatelessWidget {
  final DateTime dueDate;

  const _DueDateChip({required this.dueDate});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(dueDate.year, dueDate.month, dueDate.day);
    final isOverdue = dateOnly.isBefore(today);
    final isToday = dateOnly == today;
    final isTomorrow = dateOnly == today.add(const Duration(days: 1));

    Color color;
    String label;

    if (isOverdue) {
      color = colorScheme.error;
      final days = today.difference(dateOnly).inDays;
      label = '${days}d overdue';
    } else if (isToday) {
      color = ux.warning;
      label = 'Today';
    } else if (isTomorrow) {
      color = colorScheme.onSurfaceVariant;
      label = 'Tomorrow';
    } else {
      color = colorScheme.onSurfaceVariant;
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      label = '${months[dueDate.month - 1]} ${dueDate.day}';
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.schedule, size: 14, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: color,
            fontWeight: isOverdue ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}
