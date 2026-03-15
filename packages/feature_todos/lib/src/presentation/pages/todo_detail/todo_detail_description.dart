import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../../domain/entities/todo.dart';

/// Description section of the todo detail page.
///
/// Toggles between a read-only display and an editable text field.
class TodoDetailDescription extends StatelessWidget {
  const TodoDetailDescription({
    super.key,
    required this.todo,
    required this.controller,
    required this.isEditing,
    required this.onEditStart,
    required this.onEditDone,
  });

  final Todo todo;
  final TextEditingController controller;
  final bool isEditing;
  final VoidCallback onEditStart;
  final VoidCallback onEditDone;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Description',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        if (isEditing)
          TextField(
            controller: controller,
            maxLines: null,
            minLines: 3,
            autofocus: true,
            style: TextStyle(
              fontSize: 15,
              color: colorScheme.onSurface,
              height: 1.5,
            ),
            decoration: InputDecoration(
              hintText: 'Add a description...',
              hintStyle: TextStyle(color: colorScheme.onSurfaceVariant),
              filled: true,
              fillColor: colorScheme.surfaceContainerHigh,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: colorScheme.primary,
                  width: 1.5,
                ),
              ),
              contentPadding: const EdgeInsets.all(16),
              suffixIcon: IconButton(
                icon: Icon(Icons.check_rounded, color: ux.success),
                onPressed: onEditDone,
              ),
            ),
          )
        else
          GestureDetector(
            onTap: onEditStart,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isLight ? Colors.white : colorScheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isLight
                      ? colorScheme.primary.withValues(alpha: 0.1)
                      : colorScheme.surfaceContainerHigh,
                ),
              ),
              child: Text(
                todo.description.isEmpty
                    ? 'Tap to add description...'
                    : todo.description,
                style: TextStyle(
                  fontSize: 15,
                  height: 1.5,
                  color: todo.description.isEmpty
                      ? colorScheme.onSurfaceVariant
                      : colorScheme.onSurface,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
