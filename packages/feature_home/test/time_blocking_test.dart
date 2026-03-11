import 'package:feature_home/feature_home.dart';
import 'package:feature_home/src/presentation/pages/time_blocking_page.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TimeBlock model', () {
    test('topOffset and height calculation', () {
      const block = TimeBlock(
        id: 'tb-1',
        taskId: 't-1',
        title: 'Test block',
        startHour: 9,
        startMinute: 30,
        durationMinutes: 60,
      );

      // 80px per hour -> (9*60+30) * (80/60) = 570 * 1.333... = 760
      expect(block.topOffset, closeTo(760.0, 0.1));
      // 60 min * (80/60) = 80
      expect(block.height, closeTo(80.0, 0.1));
    });

    test('topOffset at midnight is zero', () {
      const block = TimeBlock(
        id: 'tb-0',
        taskId: 't-0',
        title: 'Midnight',
        startHour: 0,
        startMinute: 0,
        durationMinutes: 15,
      );

      expect(block.topOffset, 0.0);
      // 15 * (80/60) = 20
      expect(block.height, closeTo(20.0, 0.1));
    });

    test('copyWithTime updates hour and minute', () {
      const block = TimeBlock(
        id: 'tb-2',
        taskId: 't-2',
        title: 'Original',
        startHour: 10,
        startMinute: 0,
        durationMinutes: 45,
      );

      final moved = block.copyWithTime(startHour: 14, startMinute: 15);
      expect(moved.startHour, 14);
      expect(moved.startMinute, 15);
      expect(moved.durationMinutes, 45); // unchanged
      expect(moved.title, 'Original'); // unchanged
      expect(moved.id, 'tb-2'); // unchanged
    });

    test('copyWithTime partial update', () {
      const block = TimeBlock(
        id: 'tb-3',
        taskId: 't-3',
        title: 'Partial',
        startHour: 8,
        startMinute: 30,
        durationMinutes: 30,
      );

      final moved = block.copyWithTime(startMinute: 45);
      expect(moved.startHour, 8); // unchanged
      expect(moved.startMinute, 45);
    });

    test('default priority is none', () {
      const block = TimeBlock(
        id: 'tb-4',
        taskId: 't-4',
        title: 'Default',
        startHour: 12,
        startMinute: 0,
        durationMinutes: 30,
      );

      expect(block.priority, HomeTaskPriority.none);
      expect(block.color, isNull);
    });
  });

  group('TimeBlock providers', () {
    test('timeBlockDateProvider defaults to today', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final date = container.read(timeBlockDateProvider);
      final now = DateTime.now();
      expect(date.year, now.year);
      expect(date.month, now.month);
      expect(date.day, now.day);
    });

    test('timeBlocksProvider defaults to empty list', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(timeBlocksProvider), isEmpty);
    });

    test('timeBlocksProvider can be updated', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      const block = TimeBlock(
        id: 'tb-test',
        taskId: 't-test',
        title: 'Test',
        startHour: 9,
        startMinute: 0,
        durationMinutes: 30,
      );

      container.read(timeBlocksProvider.notifier).state = [block];
      expect(container.read(timeBlocksProvider), hasLength(1));
      expect(container.read(timeBlocksProvider).first.title, 'Test');
    });

    test('unscheduledTasksProvider has placeholder tasks', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final tasks = container.read(unscheduledTasksProvider);
      expect(tasks, isNotEmpty);
      expect(tasks.length, 4);
      expect(tasks.first.title, 'Review PR comments');
    });
  });

  group('TimeBlock height calculations', () {
    test('15 min block is quarter of hour height', () {
      const block = TimeBlock(
        id: 'tb-q',
        taskId: 't-q',
        title: 'Quick',
        startHour: 10,
        startMinute: 0,
        durationMinutes: 15,
      );

      // 15 * (80/60) = 20
      expect(block.height, closeTo(20.0, 0.1));
    });

    test('2 hour block has correct height', () {
      const block = TimeBlock(
        id: 'tb-long',
        taskId: 't-long',
        title: 'Long session',
        startHour: 14,
        startMinute: 0,
        durationMinutes: 120,
      );

      // 120 * (80/60) = 160
      expect(block.height, closeTo(160.0, 0.1));
    });

    test('end of day block positioned correctly', () {
      const block = TimeBlock(
        id: 'tb-late',
        taskId: 't-late',
        title: 'Late night',
        startHour: 23,
        startMinute: 0,
        durationMinutes: 60,
      );

      // (23*60+0) * (80/60) = 1380 * 1.333... = 1840
      expect(block.topOffset, closeTo(1840.0, 0.1));
    });
  });
}
