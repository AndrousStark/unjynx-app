import 'package:feature_todos/src/domain/entities/todo.dart';
import 'package:feature_todos/src/presentation/pages/kanban_board_page.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('KanbanColumn', () {
    test('status columns cover all TodoStatus values', () {
      final statusIds = [
        'pending',
        'inProgress',
        'completed',
        'cancelled',
      ];
      for (final s in TodoStatus.values) {
        expect(statusIds, contains(s.name));
      }
    });

    test('priority columns cover all TodoPriority values', () {
      final priorityIds = [
        'urgent',
        'high',
        'medium',
        'low',
        'none',
      ];
      for (final p in TodoPriority.values) {
        expect(priorityIds, contains(p.name));
      }
    });
  });

  group('KanbanGroupBy', () {
    test('has status and priority options', () {
      expect(KanbanGroupBy.values.length, 2);
      expect(KanbanGroupBy.values, contains(KanbanGroupBy.status));
      expect(
        KanbanGroupBy.values,
        contains(KanbanGroupBy.priority),
      );
    });
  });

  group('Todo grouping logic', () {
    final todos = [
      Todo(
        id: '1',
        title: 'Task A',
        status: TodoStatus.pending,
        priority: TodoPriority.high,
        createdAt: DateTime(2026, 3, 1),
        updatedAt: DateTime(2026, 3, 1),
      ),
      Todo(
        id: '2',
        title: 'Task B',
        status: TodoStatus.inProgress,
        priority: TodoPriority.urgent,
        createdAt: DateTime(2026, 3, 2),
        updatedAt: DateTime(2026, 3, 2),
      ),
      Todo(
        id: '3',
        title: 'Task C',
        status: TodoStatus.pending,
        priority: TodoPriority.high,
        createdAt: DateTime(2026, 3, 3),
        updatedAt: DateTime(2026, 3, 3),
      ),
      Todo(
        id: '4',
        title: 'Task D',
        status: TodoStatus.completed,
        priority: TodoPriority.low,
        createdAt: DateTime(2026, 3, 4),
        updatedAt: DateTime(2026, 3, 4),
      ),
    ];

    test('groups by status correctly', () {
      final map = <String, List<Todo>>{};
      for (final todo in todos) {
        map.putIfAbsent(todo.status.name, () => []).add(todo);
      }
      expect(map['pending']?.length, 2);
      expect(map['inProgress']?.length, 1);
      expect(map['completed']?.length, 1);
      expect(map['cancelled'], isNull);
    });

    test('groups by priority correctly', () {
      final map = <String, List<Todo>>{};
      for (final todo in todos) {
        map.putIfAbsent(todo.priority.name, () => []).add(todo);
      }
      expect(map['high']?.length, 2);
      expect(map['urgent']?.length, 1);
      expect(map['low']?.length, 1);
      expect(map['medium'], isNull);
      expect(map['none'], isNull);
    });

    test('status update simulation', () {
      final task = todos.first;
      final updated = task.copyWith(
        status: TodoStatus.inProgress,
        updatedAt: DateTime.now(),
      );
      expect(updated.status, TodoStatus.inProgress);
      expect(updated.title, task.title);
      expect(updated.id, task.id);
    });

    test('priority update simulation', () {
      final task = todos.first;
      final updated = task.copyWith(
        priority: TodoPriority.urgent,
        updatedAt: DateTime.now(),
      );
      expect(updated.priority, TodoPriority.urgent);
      expect(updated.title, task.title);
    });
  });
}
