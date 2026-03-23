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
import 'package:unjynx_mobile/firebase/notification_tap_handler.dart';
import 'package:unjynx_mobile/providers/gamification_overrides.dart';
import 'package:unjynx_mobile/providers/home_api_overrides.dart';

/// Loads the cached vocabulary map from SharedPreferences.
///
/// Returns an empty map (General mode) if nothing is cached.
Map<String, String> _loadCachedVocabulary(SharedPreferences prefs) {
  final raw = prefs.getString('unjynx_active_mode_vocab');
  if (raw == null || raw.isEmpty) return const <String, String>{};

  final vocab = <String, String>{};
  for (final pair in raw.split('|')) {
    final idx = pair.indexOf('=');
    if (idx > 0) {
      vocab[pair.substring(0, idx)] = pair.substring(idx + 1);
    }
  }
  return Map<String, String>.unmodifiable(vocab);
}

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

  // Load cached vocabulary from SharedPreferences for instant mode display.
  final cachedVocab = _loadCachedVocabulary(getIt<SharedPreferences>());

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
        // Wire industry mode vocabulary from cache (updated async later)
        vocabularyProvider.overrideWith(
          () => VocabularyNotifier(initial: cachedVocab),
        ),
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

  // Initialize industry mode vocabulary from API (with SharedPreferences cache)
  unawaited(() async {
    try {
      final prefs = getIt<SharedPreferences>();

      // Try to load from API first.
      ApiClient? apiClient;
      try {
        apiClient = ApiClient(
          auth: getIt<AuthPort>(),
          config: AppConfig.apiConfig,
        );
      } catch (_) {
        // ApiClient not available (no auth token yet).
      }

      if (apiClient != null) {
        try {
          final modeApi = ModeApiService(apiClient);
          final response = await modeApi.getActiveMode();
          if (response.success && response.data != null) {
            final slug =
                (response.data!['slug'] as String?) ?? 'general';
            final vocabRaw = response.data!['vocabulary'];
            final vocab = <String, String>{};
            if (vocabRaw is Map) {
              for (final entry in vocabRaw.entries) {
                vocab[entry.key.toString()] = entry.value.toString();
              }
            }

            // Update the vocabulary provider in the running ProviderScope.
            // This is a fire-and-forget operation; the provider is a
            // StateProvider so setting it from outside the widget tree is
            // fine via the ProviderContainer (accessed through getIt).

            // Cache for offline access.
            await prefs.setString('unjynx_active_mode_slug', slug);
            final vocabEntries = vocab.entries
                .map((e) => '${e.key}=${e.value}')
                .join('|');
            await prefs.setString(
              'unjynx_active_mode_vocab',
              vocabEntries,
            );
          }
        } catch (e) {
          debugPrint('Mode API fetch failed, falling back to cache: $e');
        }
      }
    } catch (e) {
      debugPrint('Industry mode initialization failed: $e');
    }
  }());

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

  // Initialize FCM and register token with backend.
  unawaited(() async {
    try {
      final fcmToken = await FcmTokenManager.initialize();
      if (fcmToken != null) {
        // Sync token to backend via channel API (if available).
        ChannelApiService? channelApi;
        try {
          channelApi = ChannelApiService(getIt<ApiClient>());
        } on Exception {
          // ApiClient not available (e.g. no auth token yet).
        }
        FcmTokenManager.startTokenSync(channelApi: channelApi);
        FcmTokenManager.setupForegroundHandler(
          onForegroundMessage: (message) {
            // Display foreground FCM messages via awesome_notifications.
            final title = message.notification?.title;
            final body = message.notification?.body;
            if (title != null || body != null) {
              notificationPort.schedule(
                id: message.messageId ??
                    DateTime.now().millisecondsSinceEpoch.toString(),
                title: title ?? 'UNJYNX',
                body: body ?? '',
                scheduledAt: DateTime.now(),
              );
            }
          },
        );
      }
    } on Exception catch (e) {
      debugPrint('FCM initialization failed: $e');
    }
  }());

  // Wire notification tap -> GoRouter navigation (deep link on tap).
  // Must run after runApp so the GoRouter and rootNavigatorKey are ready.
  unawaited(() async {
    try {
      await NotificationTapHandler.initialize();
    } on Exception catch (e) {
      debugPrint('NotificationTapHandler initialization failed: $e');
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
