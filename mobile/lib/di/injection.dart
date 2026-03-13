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
import 'package:service_api/service_api.dart';
import 'package:service_auth/service_auth.dart';
import 'package:service_database/service_database.dart';
import 'package:service_notification/service_notification.dart';
import 'package:service_sync/service_sync.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/core.dart';

import 'package:unjynx_mobile/config/app_config.dart';
import 'package:unjynx_mobile/sync/api_sync_remote_adapter.dart';
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

  // 2. Infrastructure — run independent async init in parallel
  final dbPort = DriftDatabasePort();
  final notificationPort = AwesomeNotificationPort();

  final results = await Future.wait([
    dbPort.initialize(),          // [0]
    notificationPort.initialize(), // [1]
    SharedPreferences.getInstance(), // [2]
  ]);

  final prefs = results[2] as SharedPreferences;

  getIt
    ..registerSingleton<DatabasePort>(dbPort)
    ..registerSingleton<AppDatabase>(dbPort.db)
    ..registerSingleton<AuthPort>(
      AppConfig.isAuthConfigured
          ? LogtoAuthPort(
              config: LogtoConfig(
                endpoint: AppConfig.logtoEndpoint,
                appId: AppConfig.logtoAppId,
              ),
            )
          : MockAuthPort(),
    );

  getIt.registerSingleton<NotificationPort>(notificationPort);
  getIt.registerSingleton<SharedPreferences>(prefs);

  final onboardingRepo = OnboardingRepository(prefs);
  final settingsRepo = SharedPrefSettingsRepository(prefs);
  getIt
    ..registerSingleton<OnboardingRepository>(onboardingRepo)
    ..registerSingleton<SettingsRepository>(settingsRepo);

  // 4. API client + services (real backend when auth is configured)
  final authPort = getIt<AuthPort>();
  final apiClient = ApiClient(auth: authPort, config: AppConfig.apiConfig);
  getIt.registerSingleton<ApiClient>(apiClient);

  final taskApi = TaskApiService(apiClient);
  final projectApi = ProjectApiService(apiClient);
  final syncApi = SyncApiService(apiClient);
  getIt
    ..registerSingleton<TaskApiService>(taskApi)
    ..registerSingleton<ProjectApiService>(projectApi)
    ..registerSingleton<SyncApiService>(syncApi);

  // Feature datasources + repositories (offline-first with real API sync)
  final todoDatasource = TodoDriftDatasource(getIt<AppDatabase>());
  final todoRepository = TodoSyncRepository(todoDatasource, taskApi, eventBus: eventBus);

  final projectDatasource = ProjectDriftDatasource(getIt<AppDatabase>());
  final projectRepository = ProjectSyncRepository(projectDatasource, projectApi, eventBus: eventBus);

  // Sync infrastructure — local + remote adapters for the SyncEngine
  final syncLocal = DriftSyncLocalAdapter(dbPort.db, prefs);
  final syncRemote = ApiSyncRemoteAdapter(syncApi);
  final syncEngine = SyncEngine(
    local: syncLocal,
    remote: syncRemote,
    eventBus: eventBus,
    entityTypes: const ['task', 'project'],
  );
  getIt
    ..registerSingleton<SyncLocalPort>(syncLocal)
    ..registerSingleton<SyncRemotePort>(syncRemote)
    ..registerSingleton<SyncEngine>(syncEngine);

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
    ..registerSingleton<BillingPlugin>(BillingPlugin());

  // Incomplete features — gated behind compile-time flags
  if (AppConfig.featureTeam) {
    getIt.registerSingleton<TeamPlugin>(TeamPlugin());
  }
  if (AppConfig.featureImportExport) {
    getIt.registerSingleton<ImportExportPlugin>(ImportExportPlugin());
  }
  if (AppConfig.featureWidgets) {
    getIt.registerSingleton<WidgetsPlugin>(WidgetsPlugin());
  }
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
