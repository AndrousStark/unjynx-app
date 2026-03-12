import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_auth/service_auth.dart' as auth;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/contracts/auth_port.dart';

// Re-export auth providers from service_auth.
// The canonical auth providers live in service_auth.
export 'package:service_auth/service_auth.dart'
    show
        authPortProvider,
        currentUserProvider,
        isAuthenticatedProvider,
        authNotifierProvider,
        overrideServiceAuthPort;

// Legacy helper — delegates to service_auth's canonical override.
Override overrideAuthPort(AuthPort port) {
  return auth.authPortProvider.overrideWithValue(port);
}

/// User productivity statistics.
class UserStats {
  final int tasksCompleted;
  final int currentStreak;
  final int totalXp;

  const UserStats({
    this.tasksCompleted = 0,
    this.currentStreak = 0,
    this.totalXp = 0,
  });
}

/// Stats provider — reads from gamification/progress API data.
/// Falls back to local task count from SharedPreferences if API unavailable.
final userStatsProvider = FutureProvider<UserStats>((ref) async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final tasksCompleted = prefs.getInt('unjynx_tasks_completed') ?? 0;
    final currentStreak = prefs.getInt('unjynx_current_streak') ?? 0;
    final totalXp = prefs.getInt('unjynx_total_xp') ?? 0;
    return UserStats(
      tasksCompleted: tasksCompleted,
      currentStreak: currentStreak,
      totalXp: totalXp,
    );
  } catch (_) {
    return const UserStats();
  }
});

/// SharedPreferences key for persisted timezone.
const _timezoneKey = 'unjynx_timezone';

/// Notifier that persists timezone selection via SharedPreferences.
class TimezoneNotifier extends StateNotifier<String> {
  TimezoneNotifier() : super('Asia/Kolkata') {
    _loadFromPrefs();
  }

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_timezoneKey);
      if (saved != null && saved.isNotEmpty) {
        state = saved;
      }
    } catch (_) {
      // Keep default if SharedPreferences is unavailable.
    }
  }

  Future<void> setTimezone(String timezone) async {
    state = timezone;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_timezoneKey, timezone);
    } catch (_) {
      // Silently fail persistence; in-memory state still updated.
    }
  }
}

/// Selected timezone with SharedPreferences persistence.
/// Defaults to India Standard Time.
final timezoneProvider =
    StateNotifierProvider<TimezoneNotifier, String>(
  (ref) => TimezoneNotifier(),
);
