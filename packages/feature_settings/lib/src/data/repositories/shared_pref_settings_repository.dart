import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../domain/entities/app_settings.dart';
import '../../domain/repositories/settings_repository.dart';

/// SharedPreferences-backed implementation of [SettingsRepository].
class SharedPrefSettingsRepository implements SettingsRepository {
  static const _key = 'unjynx_app_settings';

  final SharedPreferences _prefs;

  const SharedPrefSettingsRepository(this._prefs);

  @override
  AppSettings load() {
    final raw = _prefs.getString(_key);
    if (raw == null) return const AppSettings();

    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return AppSettings.fromJson(json);
    } on Object {
      // Corrupted data — return defaults
      return const AppSettings();
    }
  }

  @override
  Future<void> save(AppSettings settings) {
    final json = jsonEncode(settings.toJson());
    return _prefs.setString(_key, json);
  }

  @override
  Future<void> reset() => _prefs.remove(_key);
}
