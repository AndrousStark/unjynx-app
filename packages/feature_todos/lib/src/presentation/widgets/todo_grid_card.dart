import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';

/// Compact card variant for grid view layout.
///
/// Shows title, priority indicator, due date chip, and completion state
/// in a square-ish card optimized for 2-column grid display.
class TodoGridCard extends StatelessWidget {
  const TodoGridCard({
    super.key,
    required this.todo,
    this.isSelected = false,
    this.onTap,
    this.onLongPress,
    this.onComplete,
  });

  final Todo todo;
  final bool isSelected;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final VoidCallback? onComplete;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isCompleted = todo.status == TodoStatus.completed;

    final isLight = context.isLightMode;

    return PressableScale(
      onTap: onTap == null
          ? null
          : () {
              HapticFeedback.lightImpact();
              onTap!();
            },
      child: GestureDetector(
        onLongPress: onLongPress == null
            ? null
            : () {
                HapticFeedback.mediumImpact();
                onLongPress!();
              },
        child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected
              ? isLight
                  ? ux.goldWash
                  : colorScheme.primary.withValues(alpha: 0.15)
              : isLight
                  ? Colors.white
                  : colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? colorScheme.primary.withValues(alpha: isLight ? 0.5 : 0.6)
                : isLight
                    ? colorScheme.primary.withValues(alpha: 0.12)
                    : colorScheme.surfaceContainerHigh,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? []
              : context.unjynxShadow(UnjynxElevation.md),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row: priority dot + selection indicator
              Row(
                children: [
                  if (todo.priority != TodoPriority.none)
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: unjynxPriorityColor(context, todo.priority.name),
                        shape: BoxShape.circle,
                      ),
                    ),
                  const Spacer(),
                  if (isSelected)
                    Icon(
                      Icons.check_circle,
                      size: 20,
                      color: colorScheme.primary,
                    )
                  else
                    Semantics(
                      label: isCompleted
                          ? 'Mark task incomplete'
                          : 'Mark task complete',
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
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isCompleted
                                    ? (isLight ? ux.gold : ux.success)
                                    : colorScheme.onSurfaceVariant
                                        .withValues(alpha: isLight ? 0.4 : 0.5),
                                width: 1.5,
                              ),
                              color: isCompleted
                                  ? (isLight ? ux.gold : ux.success)
                                      .withValues(alpha: isLight ? 0.15 : 0.2)
                                  : Colors.transparent,
                            ),
                            child: isCompleted
                                ? Icon(
                                    Icons.check,
                                    size: 12,
                                    color: isLight ? ux.gold : ux.success,
                                  )
                                : null,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),

              // Title
              Expanded(
                child: Text(
                  todo.title,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: isCompleted
                        ? colorScheme.onSurfaceVariant
                        : colorScheme.onSurface,
                    decoration:
                        isCompleted ? TextDecoration.lineThrough : null,
                    decorationColor: isCompleted && isLight
                        ? colorScheme.primary
                        : null,
                    height: 1.3,
                  ),
                ),
              ),

              // Bottom: due date or status
              if (todo.dueDate != null) ...[
                const SizedBox(height: 8),
                _CompactDueDateChip(dueDate: todo.dueDate!),
              ] else if (todo.description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  todo.description,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      ),
    );
  }
}

class _CompactDueDateChip extends StatelessWidget {
  const _CompactDueDateChip({required this.dueDate});

  final DateTime dueDate;

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

    final color = isOverdue
        ? colorScheme.error
        : isToday
            ? ux.warning
            : colorScheme.onSurfaceVariant;

    String label;
    if (isToday) {
      label = 'Today';
    } else if (isTomorrow) {
      label = 'Tomorrow';
    } else if (isOverdue) {
      final days = today.difference(dateOnly).inDays;
      label = '${days}d overdue';
    } else {
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      label = '${months[dueDate.month - 1]} ${dueDate.day}';
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.schedule, size: 12, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: color,
            fontWeight: isOverdue ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}
