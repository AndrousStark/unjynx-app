import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _themeModeKey = 'unjynx_theme_mode';

/// Provider for the SharedPreferences instance.
///
/// Must be overridden in the app's ProviderScope with the actual instance.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw StateError(
    'sharedPreferencesProvider must be overridden. '
    'Pass SharedPreferences instance in app bootstrap.',
  ),
);

/// Reactive theme mode provider backed by SharedPreferences.
final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return ThemeModeNotifier(prefs);
});

/// Notifier that persists ThemeMode to SharedPreferences.
class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final SharedPreferences _prefs;

  ThemeModeNotifier(this._prefs) : super(_loadFromPrefs(_prefs));

  static ThemeMode _loadFromPrefs(SharedPreferences prefs) {
    final stored = prefs.getString(_themeModeKey);
    return switch (stored) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  /// Update theme mode and persist.
  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    final value = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    };
    await _prefs.setString(_themeModeKey, value);
  }

  /// Cycle through: system → light → dark → system.
  Future<void> cycle() async {
    final next = switch (state) {
      ThemeMode.system => ThemeMode.light,
      ThemeMode.light => ThemeMode.dark,
      ThemeMode.dark => ThemeMode.system,
    };
    await setThemeMode(next);
  }
}
