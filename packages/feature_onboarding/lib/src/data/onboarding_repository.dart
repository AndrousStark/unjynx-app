import 'package:shared_preferences/shared_preferences.dart';

/// Persists onboarding completion state via shared_preferences.
class OnboardingRepository {
  static const _key = 'unjynx_onboarding_complete';

  final SharedPreferences _prefs;

  const OnboardingRepository(this._prefs);

  /// Whether the user has completed onboarding.
  bool get isComplete => _prefs.getBool(_key) ?? false;

  /// Mark onboarding as complete.
  Future<bool> markComplete() => _prefs.setBool(_key, true);

  /// Reset onboarding (for testing / re-show).
  Future<bool> reset() => _prefs.remove(_key);
}
