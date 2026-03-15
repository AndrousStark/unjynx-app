import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/channel_setup_page.dart';
import 'presentation/pages/escalation_chain_page.dart';
import 'presentation/pages/notification_history_page.dart';
import 'presentation/pages/notification_hub_page.dart';
import 'presentation/pages/quiet_hours_page.dart';
import 'presentation/pages/test_notification_page.dart';

/// Notification management plugin for UNJYNX Plugin-Play architecture.
///
/// Provides the full notification channel management flow:
///   /notifications             -> J1: Hub overview
///   /notifications/channels    -> J2: Connect channels
///   /notifications/escalation  -> J3: Escalation chain editor
///   /notifications/quiet-hours -> J4: Quiet hours settings
///   /notifications/test        -> J5: Send test notifications
///   /notifications/history     -> J6: Delivery history log
class NotificationPlugin implements UnjynxPlugin {
  @override
  String get id => 'notifications';

  @override
  String get name => 'Notifications';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed at this stage.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/notifications',
          builder: () => const NotificationHubPage(),
          label: 'Notifications',
          icon: Icons.notifications_rounded,
          sortOrder: 5,
        ),
        PluginRoute(
          path: '/notifications/channels',
          builder: () => const ChannelSetupPage(),
          label: 'Channels',
          icon: Icons.link_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/notifications/escalation',
          builder: () => const EscalationChainPage(),
          label: 'Escalation',
          icon: Icons.swap_vert_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/notifications/quiet-hours',
          builder: () => const QuietHoursPage(),
          label: 'Quiet Hours',
          icon: Icons.do_not_disturb_on_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/notifications/test',
          builder: () => const TestNotificationPage(),
          label: 'Test',
          icon: Icons.send_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/notifications/history',
          builder: () => const NotificationHistoryPage(),
          label: 'History',
          icon: Icons.history_rounded,
          sortOrder: -1,
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
