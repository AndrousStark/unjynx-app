import 'dart:async';

import 'app_events.dart';

/// Central event bus for UNJYNX Plugin-Play architecture.
///
/// Plugins communicate through events rather than direct dependencies.
/// This enables loose coupling and dynamic plugin composition.
class EventBus {
  final _controller = StreamController<AppEvent>.broadcast();

  /// Publish an event to all listeners.
  void publish(AppEvent event) {
    if (!_controller.isClosed) {
      _controller.add(event);
    }
  }

  /// Listen to all events.
  Stream<AppEvent> get stream => _controller.stream;

  /// Listen to events of a specific type.
  Stream<T> on<T extends AppEvent>() {
    return _controller.stream.where((e) => e is T).cast<T>();
  }

  /// Dispose the event bus.
  void dispose() {
    _controller.close();
  }
}
