import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;

import '../../domain/entities/app_settings.dart';
import '../../domain/repositories/settings_repository.dart';

/// Repository provider — must be overridden in ProviderScope.
final settingsRepositoryProvider = Provider<SettingsRepository>(
  (ref) => throw StateError(
    'settingsRepositoryProvider must be overridden. '
    'Call overrideSettingsRepository() in app bootstrap.',
  ),
);

/// Override helper called from the app shell after DI is ready.
Override overrideSettingsRepository(SettingsRepository repository) {
  return settingsRepositoryProvider.overrideWithValue(repository);
}

/// Current app settings (reactive).
final appSettingsProvider =
    NotifierProvider<SettingsNotifier, AppSettings>(SettingsNotifier.new);

/// Settings state notifier for reactive updates.
class SettingsNotifier extends Notifier<AppSettings> {
  @override
  AppSettings build() {
    return ref.read(settingsRepositoryProvider).load();
  }

  /// Update a single setting field.
  Future<void> update(AppSettings Function(AppSettings) updater) async {
    final updated = updater(state);
    state = updated;
    await ref.read(settingsRepositoryProvider).save(updated);
  }

  /// Reset all settings to defaults.
  Future<void> reset() async {
    await ref.read(settingsRepositoryProvider).reset();
    state = const AppSettings();
  }
}
