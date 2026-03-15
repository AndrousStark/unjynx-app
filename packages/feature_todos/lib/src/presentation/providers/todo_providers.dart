import 'package:feature_todos/src/domain/entities/todo.dart';
import 'package:feature_todos/src/domain/entities/todo_filter.dart';
import 'package:feature_todos/src/domain/repositories/todo_repository.dart';
import 'package:feature_todos/src/domain/usecases/complete_todo.dart';
import 'package:feature_todos/src/domain/usecases/create_todo.dart';
import 'package:feature_todos/src/domain/usecases/delete_todo.dart';
import 'package:feature_todos/src/domain/usecases/get_todos.dart';
import 'package:feature_todos/src/domain/usecases/update_todo.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:unjynx_core/contracts/notification_port.dart';

/// Repository provider — must be overridden in ProviderScope or
/// set before use via [overrideTodoRepository].
final todoRepositoryProvider = Provider<TodoRepository>(
  (ref) => throw StateError(
    'todoRepositoryProvider must be overridden. '
    'Call overrideTodoRepository() in app bootstrap.',
  ),
);

/// Override helper called from the app shell after DI is ready.
Override overrideTodoRepository(TodoRepository repository) {
  return todoRepositoryProvider.overrideWithValue(repository);
}

// Use cases
final createTodoProvider = Provider(
  (ref) => CreateTodo(ref.watch(todoRepositoryProvider)),
);

final getTodosProvider = Provider(
  (ref) => GetTodos(ref.watch(todoRepositoryProvider)),
);

final updateTodoProvider = Provider(
  (ref) => UpdateTodo(ref.watch(todoRepositoryProvider)),
);

final deleteTodoProvider = Provider(
  (ref) => DeleteTodo(ref.watch(todoRepositoryProvider)),
);

final completeTodoProvider = Provider(
  (ref) => CompleteTodo(ref.watch(todoRepositoryProvider)),
);

// Filter state
class _TodoFilterNotifier extends Notifier<TodoFilter> {
  @override
  TodoFilter build() => const TodoFilter();
  void set(TodoFilter value) => state = value;
}

final todoFilterProvider =
    NotifierProvider<_TodoFilterNotifier, TodoFilter>(
  _TodoFilterNotifier.new,
);

// Todo list (async)
final todoListProvider = FutureProvider<List<Todo>>((ref) async {
  final getTodos = ref.watch(getTodosProvider);
  final filter = ref.watch(todoFilterProvider);
  final result = await getTodos(filter: filter);
  return result.unwrapOr([]);
});

/// Notification port provider — must be overridden in ProviderScope.
final notificationPortProvider = Provider<NotificationPort>(
  (ref) => throw StateError(
    'notificationPortProvider must be overridden. '
    'Call overrideNotificationPort() in app bootstrap.',
  ),
);

/// Override helper for notification port.
Override overrideNotificationPort(NotificationPort port) {
  return notificationPortProvider.overrideWithValue(port);
}

// Single todo by ID
final todoByIdProvider =
    FutureProvider.family<Todo?, String>((ref, id) async {
  final repo = ref.watch(todoRepositoryProvider);
  final result = await repo.getById(id);
  return result.when(ok: (todo) => todo, err: (_, __) => null);
});

/// View mode for the task list.
enum TaskViewMode { list, grid }

/// Current view mode (list or grid).
class _TaskViewModeNotifier extends Notifier<TaskViewMode> {
  @override
  TaskViewMode build() => TaskViewMode.list;
  void set(TaskViewMode value) => state = value;
}

final taskViewModeProvider =
    NotifierProvider<_TaskViewModeNotifier, TaskViewMode>(
  _TaskViewModeNotifier.new,
);

/// Set of currently selected todo IDs for bulk operations.
class _SelectedTodoIdsNotifier extends Notifier<Set<String>> {
  @override
  Set<String> build() => const {};
  void set(Set<String> value) => state = value;
}

final selectedTodoIdsProvider =
    NotifierProvider<_SelectedTodoIdsNotifier, Set<String>>(
  _SelectedTodoIdsNotifier.new,
);

/// Whether bulk selection mode is active.
final isBulkModeProvider = Provider<bool>(
  (ref) => ref.watch(selectedTodoIdsProvider).isNotEmpty,
);
