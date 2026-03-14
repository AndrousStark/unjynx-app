import 'package:service_api/service_api.dart';

/// App-wide configuration from compile-time environment variables.
///
/// Production defaults are baked in. Override for local dev:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000 \
///               --dart-define=LOGTO_ENDPOINT=http://10.0.2.2:3001 \
///               --dart-define=LOGTO_APP_ID=your-dev-app-id
class AppConfig {
  AppConfig._();

  /// Compile-time environment flag: 'production' or 'development'.
  static const String env = String.fromEnvironment(
    'ENV',
    defaultValue: 'production',
  );

  static bool get isProduction => env == 'production';

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.unjynx.me',
  );

  static const String logtoEndpoint = String.fromEnvironment(
    'LOGTO_ENDPOINT',
    defaultValue: 'https://auth.unjynx.me',
  );

  static const String logtoAppId = String.fromEnvironment(
    'LOGTO_APP_ID',
    defaultValue: 'unjynx-mobile',
  );

  /// Sentry DSN for crash reporting (from sentry.io project settings).
  static const String sentryDsn = String.fromEnvironment(
    'SENTRY_DSN',
    defaultValue: '',
  );

  /// RevenueCat public API key (from RevenueCat dashboard).
  static const String revenueCatApiKey = String.fromEnvironment(
    'REVENUECAT_API_KEY',
    defaultValue: '',
  );

  /// Whether real auth is configured.
  static bool get isAuthConfigured =>
      logtoEndpoint.isNotEmpty && logtoAppId.isNotEmpty;

  // --- Feature flags for incomplete features ---
  // Enable via: flutter run --dart-define=FEATURE_TEAM=true

  static const bool featureTeam = bool.fromEnvironment(
    'FEATURE_TEAM',
    defaultValue: false,
  );

  static const bool featureImportExport = bool.fromEnvironment(
    'FEATURE_IMPORT_EXPORT',
    defaultValue: false,
  );

  static const bool featureWidgets = bool.fromEnvironment(
    'FEATURE_WIDGETS',
    defaultValue: false,
  );

  /// API config for the service_api package.
  static ApiConfig get apiConfig => ApiConfig(baseUrl: apiBaseUrl);
}
