import 'package:feature_billing/feature_billing.dart';
import 'package:feature_gamification/feature_gamification.dart';
import 'package:feature_home/feature_home.dart';
import 'package:feature_import_export/feature_import_export.dart';
import 'package:feature_notifications/feature_notifications.dart';
import 'package:feature_onboarding/feature_onboarding.dart';
import 'package:feature_profile/feature_profile.dart';
import 'package:feature_projects/feature_projects.dart';
import 'package:feature_settings/feature_settings.dart';
import 'package:feature_team/feature_team.dart';
import 'package:feature_todos/todo_plugin.dart';
import 'package:feature_widgets/feature_widgets.dart';
import 'package:get_it/get_it.dart';
import 'package:service_auth/service_auth.dart';
import 'package:service_database/service_database.dart';
import 'package:service_notification/service_notification.dart';
import 'package:service_sync/service_sync.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/core.dart';

import 'package:unjynx_mobile/sync/drift_sync_local_adapter.dart';

/// Global GetIt instance.
final getIt = GetIt.instance;

/// Configure all dependencies.
///
/// Registration order matters:
/// 1. Core services (EventBus, PluginRegistry)
/// 2. Infrastructure adapters (Database, Auth, Notifications)
/// 3. Shared preferences + onboarding + settings
/// 4. Feature datasources and repositories
/// 5. Feature plugins
Future<void> configureDependencies() async {
  // 1. Core
  final eventBus = EventBus();
  getIt
    ..registerSingleton<EventBus>(eventBus)
    ..registerSingleton<PluginRegistry>(
      PluginRegistry(eventBus: eventBus),
    );

  // 2. Infrastructure
  final dbPort = DriftDatabasePort();
  await dbPort.initialize();
  getIt
    ..registerSingleton<DatabasePort>(dbPort)
    ..registerSingleton<AppDatabase>(dbPort.db)
    ..registerSingleton<AuthPort>(MockAuthPort());

  final notificationPort = AwesomeNotificationPort();
  await notificationPort.initialize();
  getIt.registerSingleton<NotificationPort>(notificationPort);

  // 3. Shared preferences + lightweight repos
  final prefs = await SharedPreferences.getInstance();
  getIt.registerSingleton<SharedPreferences>(prefs);

  final onboardingRepo = OnboardingRepository(prefs);
  final settingsRepo = SharedPrefSettingsRepository(prefs);
  getIt
    ..registerSingleton<OnboardingRepository>(onboardingRepo)
    ..registerSingleton<SettingsRepository>(settingsRepo);

  // 4. Feature datasources + repositories
  final todoDatasource = TodoDriftDatasource(getIt<AppDatabase>());
  // Use TodoSyncRepository (offline-first with optional API). Pass null API
  // service here — pure offline mode. The SyncEngine handles remote sync.
  final todoRepository = TodoSyncRepository(todoDatasource, null);

  final projectDatasource = ProjectDriftDatasource(getIt<AppDatabase>());
  // Use ProjectSyncRepository (offline-first with optional API). Pass null API
  // service here — pure offline mode. The SyncEngine handles remote sync.
  final projectRepository = ProjectSyncRepository(projectDatasource, null);

  // Sync infrastructure — local adapter for the SyncEngine
  final syncLocal = DriftSyncLocalAdapter(dbPort.db, prefs);
  getIt.registerSingleton<SyncLocalPort>(syncLocal);

  getIt
    ..registerSingleton<TodoRepository>(todoRepository)
    ..registerSingleton<ProjectRepository>(projectRepository)

    // 5. Plugins
    ..registerSingleton<OnboardingPlugin>(OnboardingPlugin())
    ..registerSingleton<TodoPlugin>(TodoPlugin())
    ..registerSingleton<ProjectPlugin>(ProjectPlugin())
    ..registerSingleton<CalendarPlugin>(CalendarPlugin())
    ..registerSingleton<SettingsPlugin>(SettingsPlugin())
    ..registerSingleton<ProfilePlugin>(ProfilePlugin())
    ..registerSingleton<HomePlugin>(HomePlugin())
    // Secondary feature plugins (not in bottom nav)
    ..registerSingleton<NotificationPlugin>(NotificationPlugin())
    ..registerSingleton<GamificationPlugin>(GamificationPlugin())
    ..registerSingleton<BillingPlugin>(BillingPlugin())
    ..registerSingleton<TeamPlugin>(TeamPlugin())
    ..registerSingleton<ImportExportPlugin>(ImportExportPlugin())
    ..registerSingleton<WidgetsPlugin>(WidgetsPlugin());
}

/// Nav-visible plugins in display order.
List<UnjynxPlugin> get allPlugins => [
      getIt<HomePlugin>(),
      getIt<TodoPlugin>(),
      getIt<ProjectPlugin>(),
      getIt<CalendarPlugin>(),
      getIt<ProfilePlugin>(),
      getIt<SettingsPlugin>(),
    ];

/// Utility plugins (registered to PluginRegistry but hidden from bottom nav).
List<UnjynxPlugin> get utilityPlugins => [
      getIt<OnboardingPlugin>(),
    ];
