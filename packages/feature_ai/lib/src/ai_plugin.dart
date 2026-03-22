import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/ai_chat_page.dart';
import 'presentation/pages/ai_insights_page.dart';
import 'presentation/pages/ai_schedule_page.dart';

/// AI plugin for UNJYNX Plugin-Play architecture.
///
/// Provides the AI flow:
///   /ai/chat       -> K1: AI Chat (streaming Claude conversation)
///   /ai/schedule   -> K2: AI Auto-Schedule (time slot suggestions)
///   /ai/insights   -> K3: AI Insights (weekly AI report)
class AiPlugin implements UnjynxPlugin {
  @override
  String get id => 'ai';

  @override
  String get name => 'AI';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed at this stage.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/ai/chat',
          builder: () => const AiChatPage(),
          label: 'AI Chat',
          icon: Icons.auto_awesome_rounded,
          sortOrder: -1, // hidden from bottom nav
        ),
        PluginRoute(
          path: '/ai/schedule',
          builder: () => const AiSchedulePage(),
          label: 'AI Schedule',
          icon: Icons.schedule_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/ai/insights',
          builder: () => const AiInsightsPage(),
          label: 'AI Insights',
          icon: Icons.insights_rounded,
          sortOrder: -1,
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
