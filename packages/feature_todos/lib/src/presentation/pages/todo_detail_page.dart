import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:service_api/service_api.dart';
import 'package:unjynx_core/core.dart';
import 'package:uuid/uuid.dart';

import '../../domain/entities/activity_entry.dart';
import '../../domain/entities/subtask.dart';
import '../../domain/entities/todo.dart';
import '../providers/todo_providers.dart';
import 'recurring_builder_page.dart';
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

  static String _subtaskPrefsKey(String todoId) => 'subtasks_$todoId';

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
    _loadSubtasksFromPrefs();
  }

  Future<void> _loadSubtasksFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString(_subtaskPrefsKey(widget.todoId));
    if (json == null || json.isEmpty) return;

    try {
      final decoded = jsonDecode(json) as List<dynamic>;
      final loaded = decoded
          .cast<Map<String, dynamic>>()
          .map((m) => Subtask(
                id: m['id'] as String,
                todoId: m['todoId'] as String,
                title: m['title'] as String,
                isCompleted: m['isCompleted'] as bool? ?? false,
                sortOrder: m['sortOrder'] as int? ?? 0,
                createdAt: DateTime.parse(m['createdAt'] as String),
              ))
          .toList();
      if (mounted) {
        setState(() => _subtasks = loaded);
      }
    } on Exception catch (_) {
      // Corrupted data; start fresh.
    }
  }

  Future<void> _saveSubtasksToPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(
      _subtasks
          .map((s) => {
                'id': s.id,
                'todoId': s.todoId,
                'title': s.title,
                'isCompleted': s.isCompleted,
                'sortOrder': s.sortOrder,
                'createdAt': s.createdAt.toIso8601String(),
              })
          .toList(),
    );
    await prefs.setString(_subtaskPrefsKey(widget.todoId), encoded);
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
      onRecurrenceTap: () => _showRecurringBuilder(todo),
      onSubtaskToggle: _toggleSubtask,
      onSubtaskAdd: _addSubtask,
      onSubtaskDelete: _deleteSubtask,
      onSubtaskReorder: _reorderSubtasks,
      onMenuAction: (action) => _handleMenuAction(action, todo),
      onDuplicate: () => _duplicateTask(todo),
      onMove: () => _showProjectPicker(todo),
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

    // Reschedule notification for new due date
    final notificationPort = ref.read(notificationPortProvider);
    await notificationPort.cancel(todo.id);
    if (result.isAfter(DateTime.now())) {
      final reminderTime = result.subtract(const Duration(minutes: 15));
      final scheduleAt = reminderTime.isAfter(DateTime.now())
          ? reminderTime
          : result;
      await notificationPort.schedule(
        id: todo.id,
        title: 'Task reminder',
        body: todo.title,
        scheduledAt: scheduleAt,
        payload: {'todo_id': todo.id},
      );
    }

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
      case 'move': _showProjectPicker(todo);
      case 'ritual': _showRitualPicker(todo);
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
    _saveSubtasksToPrefs();

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
    _saveSubtasksToPrefs();
  }

  void _deleteSubtask(Subtask subtask) {
    setState(() {
      _subtasks = _subtasks.where((s) => s.id != subtask.id).toList();
    });
    _saveSubtasksToPrefs();
  }

  void _reorderSubtasks(int oldIndex, int newIndex) {
    setState(() {
      final adjustedNewIndex = newIndex > oldIndex ? newIndex - 1 : newIndex;
      final reordered = List<Subtask>.from(_subtasks);
      final item = reordered[oldIndex];
      reordered.removeAt(oldIndex);
      reordered.insert(adjustedNewIndex, item);
      _subtasks = [
        for (var i = 0; i < reordered.length; i++)
          reordered[i].copyWith(sortOrder: i),
      ];
    });
    _saveSubtasksToPrefs();
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
    final entry = _makeEntry(todoId, type, description, DateTime.now());
    setState(() {
      _activityLog = [entry, ..._activityLog];
    });
  }

  Future<void> _showProjectPicker(Todo todo) async {
    HapticFeedback.lightImpact();
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    // Fetch projects from API
    List<Map<String, dynamic>> projects = [];
    try {
      final api = ref.read(projectApiProvider);
      final response = await api.getProjects();
      projects = response.data?.cast<Map<String, dynamic>>() ?? [];
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not load projects')),
        );
      }
      return;
    }

    if (!mounted) return;
    final selected = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Text(
                'Move to Project',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onSurface,
                ),
              ),
            ),
            const SizedBox(height: 8),
            if (projects.isEmpty)
              Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'No projects yet',
                  style: TextStyle(color: colorScheme.onSurfaceVariant),
                ),
              )
            else
              ...projects.map((p) {
                final id = p['id'] as String;
                final name = p['name'] as String? ?? 'Untitled';
                final color = p['color'] as String?;
                final isCurrent = id == todo.projectId;
                return ListTile(
                  leading: CircleAvatar(
                    radius: 14,
                    backgroundColor: color != null
                        ? hexToColor(color)
                        : colorScheme.primary.withValues(alpha: 0.2),
                    child: isCurrent
                        ? Icon(Icons.check_rounded, size: 16, color: ux.gold)
                        : null,
                  ),
                  title: Text(
                    name,
                    style: TextStyle(
                      fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  trailing: isCurrent
                      ? Text('Current', style: TextStyle(
                          fontSize: 12, color: ux.gold,
                        ))
                      : null,
                  onTap: isCurrent ? null : () {
                    HapticFeedback.selectionClick();
                    Navigator.of(ctx).pop(id);
                  },
                );
              }),
            // "No project" option
            ListTile(
              leading: CircleAvatar(
                radius: 14,
                backgroundColor: colorScheme.surfaceContainerHighest,
                child: Icon(Icons.inbox_rounded, size: 16,
                    color: colorScheme.onSurfaceVariant),
              ),
              title: Text('Inbox (no project)',
                  style: TextStyle(color: colorScheme.onSurface)),
              onTap: () {
                HapticFeedback.selectionClick();
                Navigator.of(ctx).pop('__none__');
              },
            ),
          ],
        ),
      ),
    );

    if (selected == null || !mounted) return;
    final targetProjectId = selected == '__none__' ? null : selected;
    try {
      final api = ref.read(taskApiProvider);
      await api.moveTask(todo.id, projectId: targetProjectId);
      ref.invalidate(todoByIdProvider(todo.id));
      ref.invalidate(todoListProvider);
      HapticFeedback.mediumImpact();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Task moved${targetProjectId == null ? ' to Inbox' : ''}'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
      _logActivity(todoId: todo.id, type: ActivityType.moved, description: 'Moved to project');
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to move task')),
        );
      }
    }
  }

  Future<void> _showRitualPicker(Todo todo) async {
    HapticFeedback.lightImpact();
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    final selected = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Text(
                'Add to Ritual',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onSurface,
                ),
              ),
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: CircleAvatar(
                radius: 20,
                backgroundColor: ux.gold.withValues(alpha: 0.15),
                child: Icon(Icons.wb_sunny_rounded, color: ux.gold),
              ),
              title: Text('Morning Ritual',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  )),
              subtitle: Text('Review this task during your morning planning',
                  style: TextStyle(
                    fontSize: 13,
                    color: colorScheme.onSurfaceVariant,
                  )),
              onTap: () {
                HapticFeedback.selectionClick();
                Navigator.of(ctx).pop('morning');
              },
            ),
            ListTile(
              leading: CircleAvatar(
                radius: 20,
                backgroundColor: colorScheme.primary.withValues(alpha: 0.15),
                child: Icon(Icons.nightlight_round, color: colorScheme.primary),
              ),
              title: Text('Evening Review',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  )),
              subtitle: Text('Include in your evening reflection',
                  style: TextStyle(
                    fontSize: 13,
                    color: colorScheme.onSurfaceVariant,
                  )),
              onTap: () {
                HapticFeedback.selectionClick();
                Navigator.of(ctx).pop('evening');
              },
            ),
          ],
        ),
      ),
    );

    if (selected == null || !mounted) return;
    try {
      final api = ref.read(contentApiProvider);
      await api.logRitual({
        'type': selected,
        'taskId': todo.id,
        'taskTitle': todo.title,
      });
      HapticFeedback.mediumImpact();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Added to ${selected == 'morning' ? 'morning ritual' : 'evening review'}'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
      _logActivity(todoId: todo.id, type: ActivityType.updated, description: 'Added to $selected ritual');
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to add to ritual')),
        );
      }
    }
  }

  void _showRecurringBuilder(Todo todo) {
    HapticFeedback.lightImpact();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, controller) => RecurringBuilderPage(
          initialRrule: todo.rrule,
          onSave: (rrule) async {
            Navigator.of(context).pop();
            HapticFeedback.mediumImpact();
            final updateTodo = ref.read(updateTodoProvider);
            await updateTodo(todo.copyWith(rrule: rrule, updatedAt: DateTime.now()));
            ref.invalidate(todoByIdProvider(todo.id));
            _logActivity(todoId: todo.id, type: ActivityType.updated, description: 'Set recurrence: $rrule');
          },
          onRemove: todo.rrule != null
              ? () async {
                  Navigator.of(context).pop();
                  HapticFeedback.mediumImpact();
                  final updateTodo = ref.read(updateTodoProvider);
                  await updateTodo(todo.copyWith(rrule: null, updatedAt: DateTime.now()));
                  ref.invalidate(todoByIdProvider(todo.id));
                  _logActivity(todoId: todo.id, type: ActivityType.updated, description: 'Removed recurrence');
                }
              : null,
        ),
      ),
    );
  }

}
