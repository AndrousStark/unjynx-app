import 'package:feature_onboarding/feature_onboarding.dart';
import 'package:feature_profile/feature_profile.dart';
import 'package:feature_projects/feature_projects.dart';
import 'package:feature_settings/feature_settings.dart';
import 'package:feature_todos/todo_plugin.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/core.dart';
import 'package:unjynx_mobile/app.dart';
import 'package:unjynx_mobile/config/app_config.dart';
import 'package:unjynx_mobile/di/injection.dart';
import 'package:unjynx_mobile/providers/gamification_overrides.dart';
import 'package:unjynx_mobile/providers/home_api_overrides.dart';

/// Bootstrap the UNJYNX application.
///
/// Initializes dependency injection, plugin system, database,
/// and starts the app.
Future<void> bootstrap() async {
  await configureDependencies();

  final registry = getIt<PluginRegistry>();

  // Register all plugins (nav + utility) — isolate failures so one
  // bad plugin doesn't crash the app
  for (final plugin in [...allPlugins, ...utilityPlugins]) {
    try {
      await registry.register(plugin);
    } on Exception catch (e, stackTrace) {
      debugPrint(
        'Failed to register plugin "${plugin.id}": $e',
      );
      debugPrintStack(stackTrace: stackTrace);
    }
  }

  // Request notification permission (non-blocking)
  final notificationPort = getIt<NotificationPort>();
  final isPermitted = await notificationPort.isPermitted();
  if (!isPermitted) {
    await notificationPort.requestPermission();
  }

  runApp(
    ProviderScope(
      overrides: [
        overrideTodoRepository(getIt<TodoRepository>()),
        overrideNotificationPort(notificationPort),
        overrideOnboardingRepository(getIt<OnboardingRepository>()),
        overrideProjectRepository(getIt<ProjectRepository>()),
        overrideSettingsRepository(getIt<SettingsRepository>()),
        overrideAuthPort(getIt<AuthPort>()),
        sharedPreferencesProvider
            .overrideWithValue(getIt<SharedPreferences>()),
        // Wire API config from compile-time env vars
        apiConfigProvider.overrideWithValue(AppConfig.apiConfig),
        // Wire all home-screen providers to real API + Drift data
        ...homeApiOverrides(),
        // Wire gamification chart providers to real local task data
        ...gamificationOverrides(),
      ],
      child: UnjynxApp(registry: registry),
    ),
  );
}
