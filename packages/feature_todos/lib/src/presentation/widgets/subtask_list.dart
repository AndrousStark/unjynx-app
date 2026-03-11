import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/subtask.dart';

/// Interactive subtask list with inline add, reorder, and progress bar.
class SubtaskList extends StatefulWidget {
  const SubtaskList({
    super.key,
    required this.subtasks,
    required this.onToggle,
    required this.onAdd,
    required this.onDelete,
    required this.onReorder,
  });

  final List<Subtask> subtasks;
  final ValueChanged<Subtask> onToggle;
  final ValueChanged<String> onAdd;
  final ValueChanged<Subtask> onDelete;
  final void Function(int oldIndex, int newIndex) onReorder;

  @override
  State<SubtaskList> createState() => _SubtaskListState();
}

class _SubtaskListState extends State<SubtaskList> {
  final _addController = TextEditingController();
  final _focusNode = FocusNode();
  bool _isAdding = false;

  @override
  void dispose() {
    _addController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  int get _completedCount =>
      widget.subtasks.where((s) => s.isCompleted).length;

  double get _progress =>
      widget.subtasks.isEmpty ? 0 : _completedCount / widget.subtasks.length;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header with progress
        Row(
          children: [
            Icon(
              Icons.checklist_rounded,
              size: 18,
              color: colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: 8),
            Text(
              'Subtasks',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(width: 8),
            if (widget.subtasks.isNotEmpty)
              Text(
                '$_completedCount/${widget.subtasks.length}',
                style: TextStyle(
                  fontSize: 13,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            const Spacer(),
            IconButton(
              icon: const Icon(Icons.add, size: 20),
              onPressed: () {
                HapticFeedback.lightImpact();
                setState(() => _isAdding = true);
                _focusNode.requestFocus();
              },
              color: colorScheme.primary,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            ),
          ],
        ),

        // Progress bar
        if (widget.subtasks.isNotEmpty) ...[
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _progress,
              minHeight: 4,
              backgroundColor: colorScheme.surfaceContainerHigh,
              valueColor: AlwaysStoppedAnimation<Color>(
                _progress == 1.0 ? ux.success : ux.gold,
              ),
            ),
          ),
        ],

        const SizedBox(height: 8),

        // Subtask items (reorderable)
        if (widget.subtasks.isNotEmpty)
          ReorderableListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            buildDefaultDragHandles: false,
            itemCount: widget.subtasks.length,
            onReorder: widget.onReorder,
            proxyDecorator: (child, index, animation) {
              return AnimatedBuilder(
                animation: animation,
                builder: (context, child) {
                  final cs = Theme.of(context).colorScheme;
                  final dragIsLight = context.isLightMode;
                  return Material(
                    color: dragIsLight
                        ? Colors.white.withValues(alpha: 0.95)
                        : cs.surfaceContainerHigh.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(8),
                    elevation: dragIsLight ? 2 : 4,
                    shadowColor: dragIsLight
                        ? const Color(0xFF1A0533)
                        : Colors.black,
                    child: child,
                  );
                },
                child: child,
              );
            },
            itemBuilder: (context, index) {
              final subtask = widget.subtasks[index];
              return _SubtaskTile(
                key: ValueKey(subtask.id),
                subtask: subtask,
                index: index,
                onToggle: () => widget.onToggle(subtask),
                onDelete: () => widget.onDelete(subtask),
              );
            },
          ),

        // Inline add field
        if (_isAdding)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              children: [
                const SizedBox(width: 4),
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: colorScheme.onSurfaceVariant
                          .withValues(alpha: context.isLightMode ? 0.35 : 0.4),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _addController,
                    focusNode: _focusNode,
                    style: TextStyle(
                      fontSize: 14,
                      color: colorScheme.onSurface,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Add subtask...',
                      hintStyle: TextStyle(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 14,
                      ),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    textInputAction: TextInputAction.done,
                    onSubmitted: _submitSubtask,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 18),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    setState(() => _isAdding = false);
                    _addController.clear();
                  },
                  color: colorScheme.onSurfaceVariant,
                  padding: EdgeInsets.zero,
                  constraints:
                      const BoxConstraints(minWidth: 28, minHeight: 28),
                ),
              ],
            ),
          ),
      ],
    );
  }

  void _submitSubtask(String value) {
    final title = value.trim();
    if (title.isEmpty) return;
    widget.onAdd(title);
    _addController.clear();
    _focusNode.requestFocus();
  }
}

class _SubtaskTile extends StatelessWidget {
  const _SubtaskTile({
    super.key,
    required this.subtask,
    required this.index,
    required this.onToggle,
    required this.onDelete,
  });

  final Subtask subtask;
  final int index;
  final VoidCallback onToggle;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          // Drag handle
          ReorderableDragStartListener(
            index: index,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Icon(
                Icons.drag_indicator,
                size: 16,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ),

          // Checkbox
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              onToggle();
            },
            child: SizedBox(
              width: 44,
              height: 44,
              child: Center(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: subtask.isCompleted
                        ? (isLight ? ux.gold : ux.success)
                            .withValues(alpha: isLight ? 0.15 : 0.2)
                        : Colors.transparent,
                    border: Border.all(
                      color: subtask.isCompleted
                          ? (isLight ? ux.gold : ux.success)
                          : colorScheme.onSurfaceVariant
                              .withValues(alpha: isLight ? 0.4 : 0.5),
                      width: 1.5,
                    ),
                  ),
                  child: subtask.isCompleted
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
          const SizedBox(width: 12),

          // Title
          Expanded(
            child: Text(
              subtask.title,
              style: TextStyle(
                fontSize: 14,
                color: subtask.isCompleted
                    ? colorScheme.onSurfaceVariant
                    : colorScheme.onSurface,
                decoration:
                    subtask.isCompleted ? TextDecoration.lineThrough : null,
                decorationColor: subtask.isCompleted && isLight
                    ? colorScheme.primary
                    : null,
              ),
            ),
          ),

          // Delete
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              onDelete();
            },
            child: SizedBox(
              width: 44,
              height: 44,
              child: Center(
                child: Icon(
                  Icons.close,
                  size: 14,
                  color: colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.4 : 0.5),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
