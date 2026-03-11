import 'package:feature_home/src/presentation/pages/calendar_page.dart';
import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Calendar plugin implementation for UNJYNX Plugin-Play architecture.
///
/// Provides a month/week calendar view with task indicators,
/// displayed as Tab 4 in navigation (sortOrder: 2, between Projects and
/// Profile).
class CalendarPlugin implements UnjynxPlugin {
  @override
  String get id => 'calendar';

  @override
  String get name => 'Calendar';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {}

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/calendar',
          builder: () => const CalendarPage(),
          label: 'Calendar',
          icon: Icons.calendar_month_rounded,
          sortOrder: 2, // After Projects (1), before Profile (9)
        ),
      ];

  @override
  Future<void> dispose() async {}
}
