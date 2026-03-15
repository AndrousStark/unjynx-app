import 'dart:async';

import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/todo_list_page.dart';

/// TODO plugin implementation for UNJYNX Plugin-Play architecture.
class TodoPlugin implements UnjynxPlugin {
  EventBus? _eventBus;
  StreamSubscription<TaskCompleted>? _xpSubscription;

  @override
  String get id => 'todos';

  @override
  String get name => 'Tasks';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    _eventBus = eventBus;

    // Listen for task-related events from other plugins
    _xpSubscription = _eventBus!.on<TaskCompleted>().listen((event) {
      _eventBus!.publish(
        XPEarned(amount: 10, reason: 'Completed task: ${event.title}'),
      );
    });
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/todos',
          builder: () => const TodoListPage(),
          label: 'Tasks',
          icon: Icons.check_circle_outline,
          sortOrder: 0,
        ),
      ];

  @override
  Future<void> dispose() async {
    await _xpSubscription?.cancel();
    _xpSubscription = null;
    _eventBus = null;
  }
}
