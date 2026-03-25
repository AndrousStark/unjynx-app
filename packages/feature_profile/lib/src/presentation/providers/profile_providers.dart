import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:service_api/service_api.dart';
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
class TimezoneNotifier extends Notifier<String> {
  @override
  String build() {
    // Load persisted timezone asynchronously after initial build.
    _loadFromPrefs();
    return 'Asia/Kolkata';
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
    NotifierProvider<TimezoneNotifier, String>(TimezoneNotifier.new);

// ---------------------------------------------------------------------------
// Activity heatmap (profile-specific)
// ---------------------------------------------------------------------------

/// Provides a flat list of daily task-completion counts for the last 364 days,
/// suitable for the profile [ActivityHeatmap] widget.
///
/// Index 0 = oldest day (364 days ago), last index = today.
/// Falls back to an empty list when the API is unavailable.
final profileActivityHeatmapProvider = FutureProvider<List<int>>((ref) async {
  try {
    final api = ref.read(progressApiProvider);
    final now = DateTime.now();
    final from = now
        .subtract(const Duration(days: 364))
        .toIso8601String()
        .split('T')[0];
    final to = now.toIso8601String().split('T')[0];

    final response = await api.getHeatmap(from: from, to: to);
    if (response.success && response.data != null) {
      final countsRaw = response.data!['dailyCounts'];
      if (countsRaw is Map) {
        // Build a flat list indexed by day offset from `from`.
        final counts = <String, int>{};
        for (final entry in countsRaw.entries) {
          counts[entry.key as String] = (entry.value as num).toInt();
        }

        // Convert map to ordered list of 364 entries.
        final startDate = now.subtract(const Duration(days: 363));
        return List.generate(364, (i) {
          final date = startDate.add(Duration(days: i));
          final key =
              '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
          return counts[key] ?? 0;
        });
      }
    }
    return const [];
  } on DioException {
    return const [];
  } on ApiException {
    return const [];
  } catch (_) {
    return const [];
  }
});
