import 'package:feature_messaging/src/presentation/pages/channel_list_page.dart';
import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Messaging plugin for UNJYNX Plugin-Play architecture.
///
/// Provides team chat with channels, messages, reactions, and pins.
/// Hidden from bottom nav (utility plugin).
class MessagingPlugin implements UnjynxPlugin {
  @override
  String get id => 'messaging';

  @override
  String get name => 'Messages';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {}

  @override
  List<PluginRoute> get routes => [
    PluginRoute(
      path: '/messaging',
      builder: () => const ChannelListPage(),
      label: 'Messages',
      icon: Icons.forum_rounded,
      sortOrder: -99, // Hidden from bottom nav
    ),
  ];

  @override
  Future<void> dispose() async {}
}
