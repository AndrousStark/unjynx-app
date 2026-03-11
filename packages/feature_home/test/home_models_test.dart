import 'package:feature_home/src/domain/models/home_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('HomeTask', () {
    test('copyWith preserves unchanged fields', () {
      const task = HomeTask(
        id: '1',
        title: 'Test',
        priority: HomeTaskPriority.high,
        dueDate: null,
      );
      final updated = task.copyWith(title: 'Updated');
      expect(updated.id, '1');
      expect(updated.title, 'Updated');
      expect(updated.priority, HomeTaskPriority.high);
    });

    test('copyWith changes isCompleted', () {
      const task = HomeTask(
        id: '1',
        title: 'Test',
        priority: HomeTaskPriority.none,
      );
      final completed = task.copyWith(isCompleted: true);
      expect(completed.isCompleted, true);
      expect(completed.title, 'Test');
    });

    test('default isCompleted is false', () {
      const task = HomeTask(
        id: '1',
        title: 'Test',
        priority: HomeTaskPriority.none,
      );
      expect(task.isCompleted, false);
    });
  });

  group('HomeTaskPriority', () {
    test('has all 5 levels', () {
      expect(HomeTaskPriority.values.length, 5);
      expect(
        HomeTaskPriority.values,
        containsAll([
          HomeTaskPriority.none,
          HomeTaskPriority.low,
          HomeTaskPriority.medium,
          HomeTaskPriority.high,
          HomeTaskPriority.urgent,
        ]),
      );
    });
  });

  group('ProgressRingsData', () {
    test('calculates task progress', () {
      const data = ProgressRingsData(
        tasksCompleted: 3,
        tasksTotal: 10,
        focusMinutes: 0,
        focusGoalMinutes: 60,
        habitsCompleted: 0,
        habitsTotal: 0,
      );
      expect(data.taskProgress, closeTo(0.3, 0.01));
    });

    test('calculates focus progress', () {
      const data = ProgressRingsData(
        tasksCompleted: 0,
        tasksTotal: 0,
        focusMinutes: 45,
        focusGoalMinutes: 60,
        habitsCompleted: 0,
        habitsTotal: 0,
      );
      expect(data.focusProgress, closeTo(0.75, 0.01));
    });

    test('calculates habit progress', () {
      const data = ProgressRingsData(
        tasksCompleted: 0,
        tasksTotal: 0,
        focusMinutes: 0,
        focusGoalMinutes: 0,
        habitsCompleted: 2,
        habitsTotal: 4,
      );
      expect(data.habitProgress, closeTo(0.5, 0.01));
    });

    test('handles zero totals gracefully', () {
      const data = ProgressRingsData(
        tasksCompleted: 0,
        tasksTotal: 0,
        focusMinutes: 0,
        focusGoalMinutes: 0,
        habitsCompleted: 0,
        habitsTotal: 0,
      );
      expect(data.taskProgress, 0.0);
      expect(data.focusProgress, 0.0);
      expect(data.habitProgress, 0.0);
      expect(data.overallProgress, 0.0);
    });

    test('clamps progress to 1.0 max', () {
      const data = ProgressRingsData(
        tasksCompleted: 15,
        tasksTotal: 10,
        focusMinutes: 120,
        focusGoalMinutes: 60,
        habitsCompleted: 5,
        habitsTotal: 3,
      );
      expect(data.taskProgress, 1.0);
      expect(data.focusProgress, 1.0);
      expect(data.habitProgress, 1.0);
      expect(data.overallProgress, 1.0);
    });

    test('overall progress averages three rings', () {
      const data = ProgressRingsData(
        tasksCompleted: 5,
        tasksTotal: 10,
        focusMinutes: 30,
        focusGoalMinutes: 60,
        habitsCompleted: 1,
        habitsTotal: 4,
      );
      // (0.5 + 0.5 + 0.25) / 3 ≈ 0.417
      expect(data.overallProgress, closeTo(0.417, 0.01));
    });
  });

  group('DailyContent', () {
    test('copyWith changes isSaved', () {
      const content = DailyContent(
        id: 'c1',
        category: 'stoic',
        content: 'Be like water.',
        author: 'Bruce Lee',
      );
      expect(content.isSaved, false);
      final saved = content.copyWith(isSaved: true);
      expect(saved.isSaved, true);
      expect(saved.content, 'Be like water.');
    });

    test('source is nullable', () {
      const content = DailyContent(
        id: 'c1',
        category: 'growth',
        content: 'Test',
        author: 'Unknown',
      );
      expect(content.source, isNull);
    });
  });

  group('StreakData', () {
    test('holds streak values', () {
      final data = StreakData(
        currentStreak: 5,
        longestStreak: 12,
        lastActiveDate: DateTime(2026, 3, 9),
      );
      expect(data.currentStreak, 5);
      expect(data.longestStreak, 12);
      expect(data.lastActiveDate.day, 9);
    });
  });
}
