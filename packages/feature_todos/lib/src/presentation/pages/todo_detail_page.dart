import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';
import 'package:uuid/uuid.dart';

import '../../domain/entities/activity_entry.dart';
import '../../domain/entities/subtask.dart';
import '../../domain/entities/todo.dart';
import '../providers/todo_providers.dart';
import 'todo_detail/todo_detail_actions.dart';
import 'todo_detail/todo_detail_body.dart';

/// Full-featured task detail screen (D2) with completion animation,
/// inline-editable title, info section, description, subtasks,
/// activity log, and bottom actions (duplicate, move, delete).
class TodoDetailPage extends ConsumerStatefulWidget {
  const TodoDetailPage({super.key, required this.todoId});

  final String todoId;

  @override
  ConsumerState<TodoDetailPage> createState() => _TodoDetailPageState();
}

class _TodoDetailPageState extends ConsumerState<TodoDetailPage>
    with SingleTickerProviderStateMixin {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  bool _controllersInitialized = false;
  bool _titleEditing = false;
  bool _descriptionEditing = false;
  List<Subtask> _subtasks = [];
  List<ActivityEntry> _activityLog = [];
  late AnimationController _completionAnimCtrl;
  late Animation<double> _completionScale;

  static const _uuid = Uuid();

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _descriptionController = TextEditingController();
    _completionAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _completionScale = Tween<double>(begin: 1, end: 0.85).animate(
      CurvedAnimation(parent: _completionAnimCtrl, curve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _completionAnimCtrl.dispose();
    super.dispose();
  }

  void _initControllersOnce(Todo todo) {
    if (_controllersInitialized) return;
    _controllersInitialized = true;
    _titleController.text = todo.title;
    _descriptionController.text = todo.description;
    _activityLog = [
      _makeEntry(todo.id, ActivityType.created, 'Task created', todo.createdAt),
      if (todo.updatedAt != todo.createdAt)
        _makeEntry(todo.id, ActivityType.updated, 'Task updated', todo.updatedAt),
      if (todo.completedAt != null)
        _makeEntry(todo.id, ActivityType.completed, 'Task completed', todo.completedAt!),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final todoAsync = ref.watch(todoByIdProvider(widget.todoId));

    return todoAsync.when(
      data: (todo) {
        if (todo == null) {
          return Scaffold(
            appBar: AppBar(leading: const BackButton()),
            body: Center(
              child: Text(
                'Task not found',
                style: TextStyle(color: colorScheme.onSurfaceVariant),
              ),
            ),
          );
        }
        _initControllersOnce(todo);
        return _buildContent(todo);
      },
      loading: () => Scaffold(
        appBar: AppBar(leading: const BackButton()),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UnjynxShimmerLine(width: 200, height: 24),
              const SizedBox(height: 16),
              const UnjynxShimmerLine(height: 14),
              const SizedBox(height: 8),
              const UnjynxShimmerLine(width: 160, height: 14),
              const SizedBox(height: 24),
              UnjynxShimmerBox(height: 120, borderRadius: 16),
              const SizedBox(height: 16),
              UnjynxShimmerBox(height: 80, borderRadius: 16),
            ],
          ),
        ),
      ),
      error: (error, _) => Scaffold(
        appBar: AppBar(leading: const BackButton()),
        body: Center(
          child: Text('Error: $error',
              style: TextStyle(color: colorScheme.error)),
        ),
      ),
    );
  }

  Widget _buildContent(Todo todo) {
    return TodoDetailBody(
      todo: todo,
      titleController: _titleController,
      descriptionController: _descriptionController,
      titleEditing: _titleEditing,
      descriptionEditing: _descriptionEditing,
      completionScale: _completionScale,
      subtasks: _subtasks,
      activityLog: _activityLog,
      onBack: () => _saveAndPop(todo),
      onToggleComplete: () => _toggleComplete(todo),
      onTitleEditStart: () => setState(() => _titleEditing = true),
      onTitleSubmitted: (_) {
        setState(() => _titleEditing = false);
        _saveTitle(todo);
      },
      onDescriptionEditStart: () =>
          setState(() => _descriptionEditing = true),
      onDescriptionEditDone: () {
        setState(() => _descriptionEditing = false);
        _saveDescription(todo);
      },
      onDateTap: () => _showDatePicker(todo),
      onPriorityTap: () => _showPriorityPicker(todo),
      onRecurrenceTap: () =>
          _showComingSoon('Recurring builder coming soon'),
      onSubtaskToggle: _toggleSubtask,
      onSubtaskAdd: _addSubtask,
      onSubtaskDelete: _deleteSubtask,
      onSubtaskReorder: _reorderSubtasks,
      onMenuAction: (action) => _handleMenuAction(action, todo),
      onDuplicate: () => _duplicateTask(todo),
      onMove: () => _showComingSoon('Move to project coming soon'),
      onDelete: () => _deleteTodo(todo),
    );
  }

  // -- Actions ----------------------------------------------------------------

  Future<void> _toggleComplete(Todo todo) async {
    HapticFeedback.mediumImpact();
    _completionAnimCtrl
      ..reset()
      ..forward();

    final isNowCompleted = todo.status != TodoStatus.completed;
    final updated = todo.copyWith(
      status: isNowCompleted ? TodoStatus.completed : TodoStatus.pending,
      completedAt: isNowCompleted ? DateTime.now() : null,
    );

    final updateTodo = ref.read(updateTodoProvider);
    await updateTodo(updated);

    if (isNowCompleted) {
      final notificationPort = ref.read(notificationPortProvider);
      unawaited(notificationPort.cancel(todo.id));
    }

    _logActivity(
      todoId: todo.id,
      type: isNowCompleted
          ? ActivityType.completed
          : ActivityType.uncompleted,
      description: isNowCompleted ? 'Task completed' : 'Task reopened',
    );

    ref.invalidate(todoByIdProvider(widget.todoId));
    ref.invalidate(todoListProvider);
  }

  Future<void> _saveTitle(Todo todo) async {
    final newTitle = _titleController.text.trim();
    if (newTitle.isEmpty || newTitle == todo.title) return;

    final updateTodo = ref.read(updateTodoProvider);
    await updateTodo(todo.copyWith(title: newTitle));
    ref.invalidate(todoByIdProvider(widget.todoId));
    ref.invalidate(todoListProvider);
  }

  Future<void> _saveDescription(Todo todo) async {
    final newDesc = _descriptionController.text.trim();
    if (newDesc == todo.description) return;

    final updateTodo = ref.read(updateTodoProvider);
    await updateTodo(todo.copyWith(description: newDesc));
    ref.invalidate(todoByIdProvider(widget.todoId));
  }

  Future<void> _saveAndPop(Todo todo) async {
    if (_titleEditing) await _saveTitle(todo);
    if (_descriptionEditing) await _saveDescription(todo);
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _showDatePicker(Todo todo) async {
    final result = await showDateTimePicker(
      context,
      initialDate: todo.dueDate,
      initialTime: todo.dueDate != null
          ? TimeOfDay.fromDateTime(todo.dueDate!)
          : null,
    );

    if (result == null || !mounted) return;

    final updateTodo = ref.read(updateTodoProvider);
    await updateTodo(todo.copyWith(dueDate: result));

    _logActivity(
      todoId: todo.id,
      type: ActivityType.dueDateChanged,
      description: 'Due date updated',
    );

    ref.invalidate(todoByIdProvider(widget.todoId));
    ref.invalidate(todoListProvider);
  }

  void _showPriorityPicker(Todo todo) {
    showPriorityPickerSheet(
      context,
      currentPriority: todo.priority,
    ).then((selected) async {
      if (selected == null || selected == todo.priority || !mounted) return;

      final updateTodo = ref.read(updateTodoProvider);
      await updateTodo(todo.copyWith(priority: selected));

      _logActivity(
        todoId: todo.id,
        type: ActivityType.priorityChanged,
        description: 'Priority changed to ${selected.name}',
      );

      ref.invalidate(todoByIdProvider(widget.todoId));
      ref.invalidate(todoListProvider);
    });
  }

  Future<void> _duplicateTask(Todo todo) async {
    final createTodo = ref.read(createTodoProvider);
    await createTodo(
      title: '${todo.title} (copy)',
      description: todo.description,
      priority: todo.priority,
      projectId: todo.projectId,
      dueDate: todo.dueDate,
      rrule: todo.rrule,
    );
    ref.invalidate(todoListProvider);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Task duplicated'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _deleteTodo(Todo todo) async {
    final confirmed = await showDeleteConfirmation(
      context,
      taskTitle: todo.title,
    );

    if (confirmed != true || !mounted) return;

    final deleteTodo = ref.read(deleteTodoProvider);
    await deleteTodo(todo.id);

    final notificationPort = ref.read(notificationPortProvider);
    unawaited(notificationPort.cancel(todo.id));

    ref.invalidate(todoListProvider);
    if (mounted) Navigator.of(context).pop();
  }

  void _handleMenuAction(String action, Todo todo) {
    switch (action) {
      case 'duplicate': _duplicateTask(todo);
      case 'move': _showComingSoon('Move to project coming soon');
      case 'ritual': _showComingSoon('Add to ritual coming soon');
      case 'delete': _deleteTodo(todo);
    }
  }

  // -- Subtask handlers -------------------------------------------------------

  void _addSubtask(String title) {
    setState(() {
      _subtasks = [
        ..._subtasks,
        Subtask(
          id: _uuid.v4(),
          todoId: widget.todoId,
          title: title,
          sortOrder: _subtasks.length,
          createdAt: DateTime.now(),
        ),
      ];
    });

    _logActivity(
      todoId: widget.todoId,
      type: ActivityType.subtaskAdded,
      description: 'Subtask added: $title',
    );
  }

  void _toggleSubtask(Subtask subtask) {
    HapticFeedback.lightImpact();
    setState(() {
      _subtasks = _subtasks.map((s) {
        if (s.id == subtask.id) {
          return s.copyWith(isCompleted: !s.isCompleted);
        }
        return s;
      }).toList();
    });
  }

  void _deleteSubtask(Subtask subtask) {
    setState(() {
      _subtasks = _subtasks.where((s) => s.id != subtask.id).toList();
    });
  }

  void _reorderSubtasks(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) newIndex--;
      final item = _subtasks.removeAt(oldIndex);
      _subtasks.insert(newIndex, item);
      _subtasks = [
        for (var i = 0; i < _subtasks.length; i++)
          _subtasks[i].copyWith(sortOrder: i),
      ];
    });
  }

  // -- Helpers ----------------------------------------------------------------

  ActivityEntry _makeEntry(
    String todoId, ActivityType type, String description, DateTime timestamp,
  ) {
    return ActivityEntry(
      id: _uuid.v4(),
      todoId: todoId,
      type: type,
      description: description,
      timestamp: timestamp,
    );
  }

  void _logActivity({
    required String todoId,
    required ActivityType type,
    required String description,
  }) {
    _activityLog.insert(0, _makeEntry(todoId, type, description, DateTime.now()));
  }

  void _showComingSoon(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), duration: const Duration(seconds: 1)),
    );
  }
}
