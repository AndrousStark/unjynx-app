import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../../domain/entities/activity_entry.dart';
import '../../../domain/entities/subtask.dart';
import '../../../domain/entities/todo.dart';
import '../../widgets/activity_log.dart';
import '../../widgets/comment_section.dart';
import '../../widgets/subtask_list.dart';
import '../../widgets/task_info_section.dart';
import 'todo_detail_actions.dart';
import 'todo_detail_description.dart';
import 'todo_detail_header.dart';

/// Complete scaffold for the todo detail page including AppBar and body.
///
/// Composes header, info section, description, subtasks, activity log,
/// and bottom action buttons into a scrollable layout with a popup menu.
class TodoDetailBody extends StatelessWidget {
  const TodoDetailBody({
    super.key,
    required this.todo,
    required this.titleController,
    required this.descriptionController,
    required this.titleEditing,
    required this.descriptionEditing,
    required this.completionScale,
    required this.subtasks,
    required this.activityLog,
    required this.onBack,
    required this.onToggleComplete,
    required this.onTitleEditStart,
    required this.onTitleSubmitted,
    required this.onDescriptionEditStart,
    required this.onDescriptionEditDone,
    required this.onDateTap,
    required this.onPriorityTap,
    required this.onRecurrenceTap,
    required this.onSubtaskToggle,
    required this.onSubtaskAdd,
    required this.onSubtaskDelete,
    required this.onSubtaskReorder,
    required this.onMenuAction,
    required this.onDuplicate,
    required this.onMove,
    required this.onDelete,
  });

  final Todo todo;
  final TextEditingController titleController;
  final TextEditingController descriptionController;
  final bool titleEditing;
  final bool descriptionEditing;
  final Animation<double> completionScale;
  final List<Subtask> subtasks;
  final List<ActivityEntry> activityLog;

  // Navigation
  final VoidCallback onBack;

  // Header callbacks
  final VoidCallback onToggleComplete;
  final VoidCallback onTitleEditStart;
  final ValueChanged<String> onTitleSubmitted;

  // Description callbacks
  final VoidCallback onDescriptionEditStart;
  final VoidCallback onDescriptionEditDone;

  // Info section callbacks
  final VoidCallback onDateTap;
  final VoidCallback onPriorityTap;
  final VoidCallback onRecurrenceTap;

  // Subtask callbacks
  final ValueChanged<Subtask> onSubtaskToggle;
  final ValueChanged<String> onSubtaskAdd;
  final ValueChanged<Subtask> onSubtaskDelete;
  final void Function(int oldIndex, int newIndex) onSubtaskReorder;

  // Action callbacks
  final ValueChanged<String> onMenuAction;
  final VoidCallback onDuplicate;
  final VoidCallback onMove;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: onBack,
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            color: colorScheme.surface,
            onSelected: onMenuAction,
            itemBuilder: (context) => const [
              PopupMenuItem(
                value: 'duplicate',
                child: TodoDetailMenuRow(
                    icon: Icons.copy_rounded, label: 'Duplicate'),
              ),
              PopupMenuItem(
                value: 'move',
                child: TodoDetailMenuRow(
                    icon: Icons.drive_file_move_outline, label: 'Move to...'),
              ),
              PopupMenuItem(
                value: 'ritual',
                child: TodoDetailMenuRow(
                    icon: Icons.wb_twilight_rounded,
                    label: 'Add to ritual'),
              ),
              PopupMenuDivider(),
              PopupMenuItem(
                value: 'delete',
                child: TodoDetailMenuRow(
                  icon: Icons.delete_outline,
                  label: 'Delete',
                  destructive: true,
                ),
              ),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: StaggeredColumn(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),

            // === Completion button + Title ===
            TodoDetailHeader(
              todo: todo,
              titleController: titleController,
              titleEditing: titleEditing,
              completionScale: completionScale,
              onToggleComplete: onToggleComplete,
              onTitleEditStart: onTitleEditStart,
              onTitleSubmitted: onTitleSubmitted,
            ),

            const SizedBox(height: 24),

            // === Info Section ===
            TaskInfoSection(
              todo: todo,
              onDateTap: onDateTap,
              onPriorityTap: onPriorityTap,
              onRecurrenceTap: onRecurrenceTap,
            ),

            const SizedBox(height: 24),

            // === Description ===
            TodoDetailDescription(
              todo: todo,
              controller: descriptionController,
              isEditing: descriptionEditing,
              onEditStart: onDescriptionEditStart,
              onEditDone: onDescriptionEditDone,
            ),

            const SizedBox(height: 24),

            // === Subtasks ===
            SubtaskList(
              subtasks: subtasks,
              onToggle: onSubtaskToggle,
              onAdd: onSubtaskAdd,
              onDelete: onSubtaskDelete,
              onReorder: onSubtaskReorder,
            ),

            const SizedBox(height: 24),

            // === Activity Log ===
            ActivityLog(entries: activityLog),

            const SizedBox(height: 24),

            // === Comments ===
            CommentSection(taskId: todo.id),

            const SizedBox(height: 32),

            // === Bottom Actions ===
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                TodoDetailBottomAction(
                  icon: Icons.copy_rounded,
                  label: 'Duplicate',
                  onTap: onDuplicate,
                ),
                TodoDetailBottomAction(
                  icon: Icons.drive_file_move_outline,
                  label: 'Move',
                  onTap: onMove,
                ),
                TodoDetailBottomAction(
                  icon: Icons.delete_outline,
                  label: 'Delete',
                  color: colorScheme.error,
                  onTap: onDelete,
                ),
              ],
            ),

            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

}
