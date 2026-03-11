import 'package:flutter_riverpod/flutter_riverpod.dart';

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
final appSettingsProvider = StateNotifierProvider<SettingsNotifier, AppSettings>(
  (ref) {
    final repo = ref.watch(settingsRepositoryProvider);
    return SettingsNotifier(repo);
  },
);

/// Settings state notifier for reactive updates.
class SettingsNotifier extends StateNotifier<AppSettings> {
  final SettingsRepository _repo;

  SettingsNotifier(this._repo) : super(_repo.load());

  /// Update a single setting field.
  Future<void> update(AppSettings Function(AppSettings) updater) async {
    final updated = updater(state);
    state = updated;
    await _repo.save(updated);
  }

  /// Reset all settings to defaults.
  Future<void> reset() async {
    await _repo.reset();
    state = const AppSettings();
  }
}
