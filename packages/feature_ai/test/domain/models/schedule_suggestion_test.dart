import 'package:feature_ai/feature_ai.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ScheduleSlot', () {
    test('creates with default accepted/rejected as false', () {
      const slot = ScheduleSlot(
        taskId: 'task-1',
        taskTitle: 'Write tests',
        suggestedStart: '09:00',
        suggestedEnd: '10:00',
        reason: 'High energy hour',
      );

      expect(slot.taskId, 'task-1');
      expect(slot.accepted, false);
      expect(slot.rejected, false);
    });

    test('copyWith creates accepted copy without mutating original', () {
      const original = ScheduleSlot(
        taskId: 'task-1',
        taskTitle: 'Write tests',
        suggestedStart: '09:00',
        suggestedEnd: '10:00',
        reason: 'High energy hour',
      );

      final accepted = original.copyWith(accepted: true);

      expect(accepted.accepted, true);
      expect(original.accepted, false);
    });
  });

  group('ScheduleResult', () {
    test('creates with empty slots list', () {
      const result = ScheduleResult(slots: [], insights: 'No tasks');

      expect(result.slots, isEmpty);
      expect(result.insights, 'No tasks');
    });
  });
}
