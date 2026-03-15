import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../../domain/entities/todo.dart';

/// Header section of the todo detail page containing:
/// - Animated completion circle button
/// - Inline-editable title
/// - "Completed" status chip
class TodoDetailHeader extends StatelessWidget {
  const TodoDetailHeader({
    super.key,
    required this.todo,
    required this.titleController,
    required this.titleEditing,
    required this.completionScale,
    required this.onToggleComplete,
    required this.onTitleEditStart,
    required this.onTitleSubmitted,
  });

  final Todo todo;
  final TextEditingController titleController;
  final bool titleEditing;
  final Animation<double> completionScale;
  final VoidCallback onToggleComplete;
  final VoidCallback onTitleEditStart;
  final ValueChanged<String> onTitleSubmitted;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final isCompleted = todo.status == TodoStatus.completed;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // === Completion button + Title ===
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Animated completion button
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: GestureDetector(
                onTap: onToggleComplete,
                child: ScaleTransition(
                  scale: completionScale,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isCompleted
                          ? ux.success.withValues(
                              alpha: isLight ? 0.15 : 0.2)
                          : Colors.transparent,
                      border: Border.all(
                        color: isCompleted
                            ? ux.success
                            : unjynxPriorityColor(context, todo.priority.name),
                        width: 2.5,
                      ),
                    ),
                    child: isCompleted
                        ? Icon(Icons.check_rounded,
                            size: 20, color: ux.success)
                        : null,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Editable title
            Expanded(
              child: titleEditing
                  ? TextField(
                      controller: titleController,
                      autofocus: true,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: colorScheme.onSurface,
                        decoration: isCompleted
                            ? TextDecoration.lineThrough
                            : null,
                      ),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.zero,
                      ),
                      maxLines: null,
                      onSubmitted: onTitleSubmitted,
                    )
                  : GestureDetector(
                      onTap: onTitleEditStart,
                      child: Text(
                        todo.title,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: colorScheme.onSurface,
                          decoration: isCompleted
                              ? TextDecoration.lineThrough
                              : null,
                        ),
                      ),
                    ),
            ),
          ],
        ),

        // Status chip
        if (isCompleted)
          Padding(
            padding: const EdgeInsets.only(top: 8, left: 44),
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isLight
                    ? ux.successWash
                    : ux.success.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Completed',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: ux.success,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
