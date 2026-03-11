import 'package:feature_home/src/domain/models/home_models.dart';
import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Ghost mode task sorting', () {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final tomorrow = today.add(const Duration(days: 1));

    test('overdue tasks come first', () {
      final tasks = [
        HomeTask(
          id: '1',
          title: 'Future task',
          priority: HomeTaskPriority.high,
          dueDate: tomorrow,
        ),
        HomeTask(
          id: '2',
          title: 'Overdue task',
          priority: HomeTaskPriority.low,
          dueDate: yesterday,
        ),
      ];

      final sorted = _sortGhostModeTasks(tasks, today);
      expect(sorted.first.id, '2'); // overdue wins
    });

    test('higher priority wins when both overdue', () {
      final tasks = [
        HomeTask(
          id: '1',
          title: 'Medium overdue',
          priority: HomeTaskPriority.medium,
          dueDate: yesterday,
        ),
        HomeTask(
          id: '2',
          title: 'Urgent overdue',
          priority: HomeTaskPriority.urgent,
          dueDate: yesterday,
        ),
      ];

      final sorted = _sortGhostModeTasks(tasks, today);
      expect(sorted.first.id, '2');
    });

    test('due date sorts earlier first at same priority', () {
      final tasks = [
        HomeTask(
          id: '1',
          title: 'Later',
          priority: HomeTaskPriority.high,
          dueDate: tomorrow.add(const Duration(days: 2)),
        ),
        HomeTask(
          id: '2',
          title: 'Sooner',
          priority: HomeTaskPriority.high,
          dueDate: tomorrow,
        ),
      ];

      final sorted = _sortGhostModeTasks(tasks, today);
      expect(sorted.first.id, '2');
    });

    test('tasks with due date come before no-date tasks', () {
      final tasks = [
        const HomeTask(
          id: '1',
          title: 'No date',
          priority: HomeTaskPriority.high,
        ),
        HomeTask(
          id: '2',
          title: 'Has date',
          priority: HomeTaskPriority.high,
          dueDate: tomorrow,
        ),
      ];

      final sorted = _sortGhostModeTasks(tasks, today);
      expect(sorted.first.id, '2');
    });

    test('completed tasks excluded', () {
      final tasks = [
        const HomeTask(
          id: '1',
          title: 'Done',
          priority: HomeTaskPriority.urgent,
          isCompleted: true,
        ),
        const HomeTask(
          id: '2',
          title: 'Not done',
          priority: HomeTaskPriority.low,
        ),
      ];

      final incomplete =
          tasks.where((t) => !t.isCompleted).toList();
      expect(incomplete.length, 1);
      expect(incomplete.first.id, '2');
    });
  });

  group('PomodoroSettings', () {
    test('default values', () {
      const settings = PomodoroSettings();
      expect(settings.workMinutes, 25);
      expect(settings.shortBreakMinutes, 5);
      expect(settings.longBreakMinutes, 15);
      expect(settings.sessionsBeforeLongBreak, 4);
    });

    test('copyWith updates specified fields', () {
      const settings = PomodoroSettings();
      final custom = settings.copyWith(
        workMinutes: 50,
        shortBreakMinutes: 10,
      );
      expect(custom.workMinutes, 50);
      expect(custom.shortBreakMinutes, 10);
      expect(custom.longBreakMinutes, 15); // unchanged
      expect(custom.sessionsBeforeLongBreak, 4); // unchanged
    });
  });

  group('ActivityData', () {
    test('default is empty', () {
      const data = ActivityData();
      expect(data.dailyCounts, isEmpty);
    });

    test('copyWith replaces counts', () {
      const data = ActivityData(
        dailyCounts: {'2026-03-09': 5},
      );
      final updated = data.copyWith(
        dailyCounts: {'2026-03-10': 3},
      );
      expect(updated.dailyCounts['2026-03-10'], 3);
      expect(updated.dailyCounts.containsKey('2026-03-09'), false);
    });
  });

  group('PersonalBests', () {
    test('default values are zero', () {
      const bests = PersonalBests();
      expect(bests.mostTasksInDay, 0);
      expect(bests.longestStreak, 0);
      expect(bests.totalCompleted, 0);
      expect(bests.totalFocusMinutes, 0);
    });

    test('copyWith updates specific fields', () {
      const bests = PersonalBests(mostTasksInDay: 5);
      final updated = bests.copyWith(longestStreak: 12);
      expect(updated.mostTasksInDay, 5);
      expect(updated.longestStreak, 12);
    });
  });

  group('WeeklyInsight', () {
    test('default type is general', () {
      const insight = WeeklyInsight(text: 'Keep going!');
      expect(insight.type, 'general');
    });

    test('custom type', () {
      const insight = WeeklyInsight(
        text: '5-day streak!',
        type: 'streak',
      );
      expect(insight.type, 'streak');
    });
  });

  group('CalendarTask', () {
    test('copyWith preserves fields', () {
      final task = CalendarTask(
        id: '1',
        title: 'Test',
        priority: 'high',
        status: 'pending',
        dueDate: DateTime(2026, 3, 10),
      );
      final updated = task.copyWith(status: 'completed');
      expect(updated.id, '1');
      expect(updated.title, 'Test');
      expect(updated.status, 'completed');
      expect(updated.priority, 'high');
    });

    test('projectColor is nullable', () {
      const task = CalendarTask(
        id: '1',
        title: 'Test',
        priority: 'none',
        status: 'pending',
      );
      expect(task.projectColor, isNull);
      expect(task.dueDate, isNull);
    });
  });

  group('ContentCategory constants', () {
    test('has 10 categories', () {
      expect(contentCategories.length, 10);
    });

    test('each category has unique id', () {
      final ids = contentCategories.map((c) => c.id).toSet();
      expect(ids.length, 10);
    });

    test('stoic_wisdom is first', () {
      expect(contentCategories.first.id, 'stoic_wisdom');
      expect(contentCategories.first.name, 'Stoic Wisdom');
    });
  });
}

/// Replicate the ghost mode sorting logic from the provider
/// for unit testing without Riverpod container.
List<HomeTask> _sortGhostModeTasks(
  List<HomeTask> tasks,
  DateTime todayStart,
) {
  final incomplete =
      tasks.where((t) => !t.isCompleted).toList(growable: false);

  return [...incomplete]..sort((a, b) {
      final aOverdue =
          a.dueDate != null && a.dueDate!.isBefore(todayStart);
      final bOverdue =
          b.dueDate != null && b.dueDate!.isBefore(todayStart);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      final priorityOrder = <HomeTaskPriority, int>{
        HomeTaskPriority.urgent: 0,
        HomeTaskPriority.high: 1,
        HomeTaskPriority.medium: 2,
        HomeTaskPriority.low: 3,
        HomeTaskPriority.none: 4,
      };
      final aPri = priorityOrder[a.priority] ?? 4;
      final bPri = priorityOrder[b.priority] ?? 4;
      if (aPri != bPri) return aPri.compareTo(bPri);

      if (a.dueDate != null && b.dueDate != null) {
        return a.dueDate!.compareTo(b.dueDate!);
      }
      if (a.dueDate != null) return -1;
      if (b.dueDate != null) return 1;

      return 0;
    });
}
