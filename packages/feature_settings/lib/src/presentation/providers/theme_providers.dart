import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _themeModeKey = 'unjynx_theme_mode';
const _fontSizeKey = 'unjynx_font_size';
const _reduceAnimationsKey = 'unjynx_reduce_animations';
const _hapticFeedbackKey = 'unjynx_haptic_feedback';

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
    NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

/// Notifier that persists ThemeMode to SharedPreferences.
class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    final prefs = ref.read(sharedPreferencesProvider);
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
    await ref.read(sharedPreferencesProvider).setString(_themeModeKey, value);
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

// ---------------------------------------------------------------------------
// Font size
// ---------------------------------------------------------------------------

/// Available font size options.
enum FontSizeOption {
  small('Small', 0.85),
  medium('Medium', 1.0),
  large('Large', 1.15);

  const FontSizeOption(this.label, this.scaleFactor);

  /// Display label shown in the UI.
  final String label;

  /// Text scale factor applied via [MediaQuery.textScalerOf].
  final double scaleFactor;
}

/// Reactive font-size provider backed by SharedPreferences.
final fontSizeProvider =
    NotifierProvider<FontSizeNotifier, FontSizeOption>(FontSizeNotifier.new);

/// Notifier that persists the selected font size to SharedPreferences.
class FontSizeNotifier extends Notifier<FontSizeOption> {
  @override
  FontSizeOption build() {
    final prefs = ref.read(sharedPreferencesProvider);
    final stored = prefs.getString(_fontSizeKey);
    return switch (stored) {
      'small' => FontSizeOption.small,
      'large' => FontSizeOption.large,
      _ => FontSizeOption.medium,
    };
  }

  /// Update the font size and persist.
  Future<void> setFontSize(FontSizeOption size) async {
    state = size;
    await ref.read(sharedPreferencesProvider).setString(_fontSizeKey, size.name);
  }
}

// ---------------------------------------------------------------------------
// Reduce animations
// ---------------------------------------------------------------------------

/// When `true`, all UI animations should use [Duration.zero].
final reduceAnimationsProvider =
    NotifierProvider<ReduceAnimationsNotifier, bool>(
  ReduceAnimationsNotifier.new,
);

/// Notifier that persists the reduce-animations preference.
class ReduceAnimationsNotifier extends Notifier<bool> {
  @override
  bool build() {
    final prefs = ref.read(sharedPreferencesProvider);
    return prefs.getBool(_reduceAnimationsKey) ?? false;
  }

  /// Toggle or set the reduce-animations flag and persist.
  Future<void> set(bool value) async {
    state = value;
    await ref.read(sharedPreferencesProvider).setBool(_reduceAnimationsKey, value);
  }
}

// ---------------------------------------------------------------------------
// Haptic feedback
// ---------------------------------------------------------------------------

/// When `false`, all [HapticFeedback] calls throughout the app should be
/// skipped. Defaults to `true` (enabled).
final hapticFeedbackProvider =
    NotifierProvider<HapticFeedbackNotifier, bool>(
  HapticFeedbackNotifier.new,
);

/// Notifier that persists the haptic-feedback preference.
class HapticFeedbackNotifier extends Notifier<bool> {
  @override
  bool build() {
    final prefs = ref.read(sharedPreferencesProvider);
    return prefs.getBool(_hapticFeedbackKey) ?? true;
  }

  /// Toggle or set haptic feedback and persist.
  Future<void> set(bool value) async {
    state = value;
    await ref.read(sharedPreferencesProvider).setBool(_hapticFeedbackKey, value);
  }
}
