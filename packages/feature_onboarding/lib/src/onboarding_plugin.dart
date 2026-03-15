import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/first_task_prompt_page.dart';
import 'presentation/pages/notification_permission_page.dart';
import 'presentation/pages/onboarding_page.dart';
import 'presentation/pages/personalization_page.dart';

/// Onboarding plugin for UNJYNX Plugin-Play architecture.
///
/// Provides the full onboarding flow:
///   /onboarding            -> B1: Value-prop slides
///   /onboarding/personalize -> B2: Personalization
///   /onboarding/first-task  -> B3: First task creation (NLP)
///   /onboarding/notifications -> B4: Notification permission
class OnboardingPlugin implements UnjynxPlugin {
  @override
  String get id => 'onboarding';

  @override
  String get name => 'Onboarding';

  @override
  String get version => '0.2.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed for onboarding.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/onboarding',
          builder: () => const OnboardingPage(),
          label: 'Onboarding',
          icon: Icons.waving_hand_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/onboarding/personalize',
          builder: () => const PersonalizationPage(),
          label: 'Personalize',
          icon: Icons.tune_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/onboarding/first-task',
          builder: () => const FirstTaskPromptPage(),
          label: 'First Task',
          icon: Icons.add_task_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/onboarding/notifications',
          builder: () => const NotificationPermissionPage(),
          label: 'Notifications',
          icon: Icons.notifications_rounded,
          sortOrder: -1,
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
