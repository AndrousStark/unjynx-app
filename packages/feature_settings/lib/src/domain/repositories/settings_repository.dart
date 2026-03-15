import '../entities/app_settings.dart';

/// Abstract repository for persisting user settings.
abstract class SettingsRepository {
  /// Load the current settings.
  AppSettings load();

  /// Save updated settings.
  Future<void> save(AppSettings settings);

  /// Reset all settings to defaults.
  Future<void> reset();
}
