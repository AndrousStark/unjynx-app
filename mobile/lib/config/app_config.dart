import 'package:service_api/service_api.dart';

/// App-wide configuration from compile-time environment variables.
///
/// Set via: flutter run --dart-define=API_BASE_URL=https://api.unjynx.com
/// Or: flutter build apk --dart-define=API_BASE_URL=https://api.unjynx.com
class AppConfig {
  AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static const String logtoEndpoint = String.fromEnvironment(
    'LOGTO_ENDPOINT',
    defaultValue: '',
  );

  static const String logtoAppId = String.fromEnvironment(
    'LOGTO_APP_ID',
    defaultValue: '',
  );

  /// Whether real auth is configured.
  static bool get isAuthConfigured =>
      logtoEndpoint.isNotEmpty && logtoAppId.isNotEmpty;

  /// API config for the service_api package.
  static ApiConfig get apiConfig => ApiConfig(baseUrl: apiBaseUrl);
}
