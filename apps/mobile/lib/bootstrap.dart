import 'dart:async';

import 'package:feature_billing/feature_billing.dart';
import 'package:feature_onboarding/feature_onboarding.dart';
import 'package:feature_profile/feature_profile.dart';
import 'package:feature_projects/feature_projects.dart';
import 'package:feature_settings/feature_settings.dart';
import 'package:feature_todos/todo_plugin.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';
import 'package:service_database/service_database.dart';
import 'package:service_sync/service_sync.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/core.dart';
import 'package:unjynx_mobile/app.dart';
import 'package:unjynx_mobile/config/app_config.dart';
import 'package:unjynx_mobile/di/injection.dart';
import 'package:unjynx_mobile/fcm/fcm_token_manager.dart';
import 'package:unjynx_mobile/providers/gamification_overrides.dart';
import 'package:unjynx_mobile/providers/home_api_overrides.dart';

/// Bootstrap the UNJYNX application.
///
/// Initializes dependency injection, plugin system, database,
/// and starts the app. Non-critical initialization (notification
/// permission, FCM, RevenueCat) runs AFTER runApp to avoid grey screen.
Future<void> bootstrap() async {
  await configureDependencies();

  final registry = getIt<PluginRegistry>();

  // Register all plugins in parallel — isolate failures so one
  // bad plugin doesn't crash the app
  await Future.wait(
    [...allPlugins, ...utilityPlugins].map((plugin) async {
      try {
        await registry.register(plugin);
      } on Exception catch (e, stackTrace) {
        debugPrint(
          'Failed to register plugin "${plugin.id}": $e',
        );
        debugPrintStack(stackTrace: stackTrace);
      }
    }),
  );

  final notificationPort = getIt<NotificationPort>();

  runApp(
    ProviderScope(
      overrides: [
        overrideTodoRepository(getIt<TodoRepository>()),
        overrideNotificationPort(notificationPort),
        overrideOnboardingRepository(getIt<OnboardingRepository>()),
        overrideUserPreferencesPort(
          SharedPrefsUserPreferencesAdapter(getIt<SharedPreferences>()),
        ),
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

  // --- Post-runApp initialization (non-blocking) ---
  // These run after the first frame so the user sees the app immediately.

  // Start background sync engine (deferred to avoid blocking first frame)
  unawaited(Future<void>.delayed(const Duration(seconds: 2), () {
    final syncEngine = getIt<SyncEngine>();
    syncEngine.startPeriodicSync();
  }));

  // Initialize notification port + request permission (deferred from DI)
  unawaited(() async {
    try {
      await notificationPort.initialize();
      final isPermitted = await notificationPort.isPermitted();
      if (!isPermitted) {
        await notificationPort.requestPermission();
      }
    } on Exception catch (e) {
      debugPrint('Notification initialization failed: $e');
    }
  }());

  // Initialize FCM (gracefully skips if google-services.json is missing)
  unawaited(() async {
    try {
      final fcmToken = await FcmTokenManager.initialize();
      if (fcmToken != null) {
        FcmTokenManager.startTokenSync();
      }
    } on Exception catch (e) {
      debugPrint('FCM initialization failed: $e');
    }
  }());

  // Initialize RevenueCat (gracefully skips if no API key)
  unawaited(() async {
    try {
      if (AppConfig.revenueCatApiKey.isNotEmpty) {
        await RevenueCatManager.initialize(
          apiKey: AppConfig.revenueCatApiKey,
        );
        final userId = await getIt<AuthPort>().getUserId();
        if (userId != null) {
          await RevenueCatManager.logIn(userId);
        }
      }
    } on Exception catch (e) {
      debugPrint('RevenueCat initialization failed: $e');
    }
  }());
}
