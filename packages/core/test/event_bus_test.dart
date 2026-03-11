import 'package:flutter_test/flutter_test.dart';
import 'package:unjynx_core/events/event_bus.dart';
import 'package:unjynx_core/events/app_events.dart';

void main() {
  group('EventBus', () {
    late EventBus bus;

    setUp(() {
      bus = EventBus();
    });

    tearDown(() {
      bus.dispose();
    });

    test('publishes events to stream', () async {
      final events = <AppEvent>[];
      bus.stream.listen(events.add);

      bus.publish(TaskCreated(taskId: '1', title: 'Test'));

      await Future<void>.delayed(Duration.zero);
      expect(events, hasLength(1));
      expect(events.first, isA<TaskCreated>());
    });

    test('filters events by type', () async {
      final taskEvents = <TaskCreated>[];
      bus.on<TaskCreated>().listen(taskEvents.add);

      bus.publish(TaskCreated(taskId: '1', title: 'Test'));
      bus.publish(TaskCompleted(taskId: '1', title: 'Test'));

      await Future<void>.delayed(Duration.zero);
      expect(taskEvents, hasLength(1));
    });

    test('does not emit after dispose', () async {
      final events = <AppEvent>[];
      bus.stream.listen(events.add);
      bus.dispose();

      bus.publish(TaskCreated(taskId: '1', title: 'Test'));

      await Future<void>.delayed(Duration.zero);
      expect(events, isEmpty);
    });
  });
}
