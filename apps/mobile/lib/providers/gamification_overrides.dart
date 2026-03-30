import 'package:dio/dio.dart';
import 'package:feature_gamification/feature_gamification.dart';
import 'package:feature_projects/feature_projects.dart';
import 'package:feature_todos/todo_plugin.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:service_api/service_api.dart';
import 'package:unjynx_core/core.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Safely watch an API provider, returning null if not wired up (e.g. tests).
T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

/// Returns true if [error] is a network/API error that should be handled
/// with a graceful fallback rather than propagated.
bool _isRecoverableError(Object error) {
  return error is DioException || error is ApiException;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/// Returns Riverpod overrides that wire the gamification providers to the
/// real backend API with graceful local-data fallback.
///
/// Pattern: try API first -> on DioException/ApiException fall back to local
/// Drift data (for charts) or empty defaults (for API-only data).
List<Override> gamificationOverrides() {
  return [
    // ── API-first providers (XP, achievements, leaderboard, challenges) ──
    xpDataProvider.overrideWith(_xpDataFromApi),
    achievementsProvider.overrideWith(_achievementsFromApi),
    leaderboardProvider.overrideWith(_leaderboardFromApi),
    activeChallengesProvider.overrideWith(_challengesFromApi),

    // ── Accountability providers ──
    partnersProvider.overrideWith(_partnersFromApi),
    sharedGoalsProvider.overrideWith(_sharedGoalsFromApi),

    // ── Chart providers (API-first with local Drift fallback) ──
    completionTrendProvider.overrideWith(_completionTrendApiFirst),
    productivityByDayProvider.overrideWith(_productivityByDayApiFirst),
    productivityByHourProvider.overrideWith(_productivityByHourApiFirst),
    categoryBreakdownProvider.overrideWith(_categoryBreakdownApiFirst),
  ];
}

// ---------------------------------------------------------------------------
// XP & Level — API-first, empty fallback
// ---------------------------------------------------------------------------

Future<XpData> _xpDataFromApi(Ref ref) async {
  final api = _tryRead(ref, gamificationApiProvider);
  if (api == null) return XpData.empty;

  try {
    final response = await api.getXpData();
    if (response.success && response.data != null) {
      return XpData.fromJson(response.data!);
    }
    return XpData.empty;
  } catch (e) {
    if (_isRecoverableError(e)) {
      debugPrint('[gamification] xpDataProvider: API unavailable ($e), '
          'using empty fallback');
      return XpData.empty;
    }
    rethrow;
  }
}

// ---------------------------------------------------------------------------
// Achievements — API-first, empty fallback
// ---------------------------------------------------------------------------

Future<List<Achievement>> _achievementsFromApi(Ref ref) async {
  final api = _tryRead(ref, gamificationApiProvider);
  if (api == null) return List.unmodifiable(<Achievement>[]);

  try {
    final response = await api.getAchievements();
    if (response.success && response.data != null) {
      final items = response.data!
          .cast<Map<String, dynamic>>()
          .map(Achievement.fromJson)
          .toList();
      return List.unmodifiable(items);
    }
    return List.unmodifiable(<Achievement>[]);
  } catch (e) {
    if (_isRecoverableError(e)) {
      debugPrint('[gamification] achievementsProvider: API unavailable ($e), '
          'returning empty list');
      return List.unmodifiable(<Achievement>[]);
    }
    rethrow;
  }
}

// ---------------------------------------------------------------------------
// Leaderboard — API-first, empty fallback
// ---------------------------------------------------------------------------

Future<List<LeaderboardEntry>> _leaderboardFromApi(Ref ref) async {
  final period = ref.watch(leaderboardPeriodProvider);
  final scope = ref.watch(leaderboardScopeProvider);

  final periodParam = switch (period) {
    LeaderboardPeriod.thisWeek => 'this_week',
    LeaderboardPeriod.thisMonth => 'this_month',
    LeaderboardPeriod.allTime => 'all_time',
  };
  final scopeParam = switch (scope) {
    LeaderboardScope.friends => 'friends',
    LeaderboardScope.team => 'team',
  };

  final api = _tryRead(ref, gamificationApiProvider);
  if (api == null) return List.unmodifiable(<LeaderboardEntry>[]);

  try {
    final response = await api.getLeaderboard(
      scope: scopeParam,
      period: periodParam,
    );
    if (response.success && response.data != null) {
      final items = response.data!
          .cast<Map<String, dynamic>>()
          .map(LeaderboardEntry.fromJson)
          .toList();
      return List.unmodifiable(items);
    }
    return List.unmodifiable(<LeaderboardEntry>[]);
  } catch (e) {
    if (_isRecoverableError(e)) {
      debugPrint('[gamification] leaderboardProvider: API unavailable ($e), '
          'returning empty list');
      return List.unmodifiable(<LeaderboardEntry>[]);
    }
    rethrow;
  }
}

// ---------------------------------------------------------------------------
// Active Challenges — API-first, empty fallback
// ---------------------------------------------------------------------------

Future<List<Challenge>> _challengesFromApi(Ref ref) async {
  final api = _tryRead(ref, gamificationApiProvider);
  if (api == null) return List.unmodifiable(<Challenge>[]);

  try {
    final response = await api.getChallenges(status: 'active');
    if (response.success && response.data != null) {
      final items = response.data!
          .cast<Map<String, dynamic>>()
          .map(Challenge.fromJson)
          .toList();
      return List.unmodifiable(items);
    }
    return List.unmodifiable(<Challenge>[]);
  } catch (e) {
    if (_isRecoverableError(e)) {
      debugPrint(
          '[gamification] activeChallengesProvider: API unavailable ($e), '
          'returning empty list');
      return List.unmodifiable(<Challenge>[]);
    }
    rethrow;
  }
}

// ---------------------------------------------------------------------------
// Accountability Partners — API-first, empty fallback
// ---------------------------------------------------------------------------

Future<List<AccountabilityPartner>> _partnersFromApi(Ref ref) async {
  final api = _tryRead(ref, accountabilityApiProvider);
  if (api == null) return List.unmodifiable(<AccountabilityPartner>[]);

  try {
    final response = await api.getPartners();
    if (response.success && response.data != null) {
      final items = response.data!
          .cast<Map<String, dynamic>>()
          .map(AccountabilityPartner.fromJson)
          .toList();
      return List.unmodifiable(items);
    }
    return List.unmodifiable(<AccountabilityPartner>[]);
  } catch (e) {
    if (_isRecoverableError(e)) {
      debugPrint('[gamification] partnersProvider: API unavailable ($e), '
          'returning empty list');
      return List.unmodifiable(<AccountabilityPartner>[]);
    }
    rethrow;
  }
}

// ---------------------------------------------------------------------------
// Shared Goals — API-first, empty fallback
// ---------------------------------------------------------------------------

Future<List<SharedGoal>> _sharedGoalsFromApi(Ref ref) async {
  final api = _tryRead(ref, accountabilityApiProvider);
  if (api == null) return List.unmodifiable(<SharedGoal>[]);

  try {
    final response = await api.getSharedGoals();
    if (response.success && response.data != null) {
      final items = response.data!
          .cast<Map<String, dynamic>>()
          .map(SharedGoal.fromJson)
          .toList();
      return List.unmodifiable(items);
    }
    return List.unmodifiable(<SharedGoal>[]);
  } catch (e) {
    if (_isRecoverableError(e)) {
      debugPrint('[gamification] sharedGoalsProvider: API unavailable ($e), '
          'returning empty list');
      return List.unmodifiable(<SharedGoal>[]);
    }
    rethrow;
  }
}

// ---------------------------------------------------------------------------
// Completion Trend — API-first with local Drift fallback
// ---------------------------------------------------------------------------

Future<List<(int, double)>> _completionTrendApiFirst(Ref ref) async {
  final range = ref.watch(trendRangeProvider);
  final days = switch (range) {
    TrendRange.days30 => 30,
    TrendRange.days90 => 90,
    TrendRange.year => 365,
  };

  // 1. Try the backend API first.
  final api = _tryRead(ref, progressApiProvider);
  if (api != null) {
    try {
      final response = await api.getCompletionTrend(days: days);
      if (response.success && response.data != null) {
        final entries = response.data!['entries'] as List?;
        if (entries != null && entries.isNotEmpty) {
          return List.unmodifiable(
            entries.asMap().entries.map((e) => (
              e.key,
              (e.value['count'] as num?)?.toDouble() ?? 0.0,
            )),
          );
        }
      }
    } catch (e) {
      if (_isRecoverableError(e)) {
        debugPrint(
            '[gamification] completionTrend: API unavailable ($e), '
            'falling back to local Drift data');
      } else {
        rethrow;
      }
    }
  }

  // 2. Fallback: compute from local Drift todo data.
  return _completionTrendFromTodos(ref, days);
}

Future<List<(int, double)>> _completionTrendFromTodos(
  Ref ref,
  int days,
) async {
  try {
    final repo = ref.watch(todoRepositoryProvider);
    final result = await repo.getAll();
    final todos = result.unwrapOr(<Todo>[]);

    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);

    // Count completed tasks per day offset (0 = today, 1 = yesterday, ...).
    final counts = <int, int>{};
    for (final todo in todos) {
      if (todo.completedAt == null) continue;
      final daysDiff = todayStart
          .difference(DateTime(
            todo.completedAt!.year,
            todo.completedAt!.month,
            todo.completedAt!.day,
          ))
          .inDays;
      if (daysDiff >= 0 && daysDiff < days) {
        counts[daysDiff] = (counts[daysDiff] ?? 0) + 1;
      }
    }

    // Return as list ordered oldest -> newest (offset N-1 -> 0).
    return List.generate(
      days,
      (i) {
        final offset = days - 1 - i;
        return (i, (counts[offset] ?? 0).toDouble());
      },
    );
  } catch (_) {
    return const [];
  }
}

// ---------------------------------------------------------------------------
// Productivity by Day — API-first with local Drift fallback
// ---------------------------------------------------------------------------

Future<List<(String, double)>> _productivityByDayApiFirst(Ref ref) async {
  // 1. Try the backend API first.
  final api = _tryRead(ref, progressApiProvider);
  if (api != null) {
    try {
      final response = await api.getProductivityByDay();
      if (response.success && response.data != null) {
        final byDay = response.data!['entries'] as List?;
        if (byDay != null && byDay.isNotEmpty) {
          return List.unmodifiable(
            byDay.map((e) => (
              e['day'] as String? ?? '',
              (e['count'] as num?)?.toDouble() ?? 0.0,
            )),
          );
        }
      }
    } catch (e) {
      if (_isRecoverableError(e)) {
        debugPrint(
            '[gamification] productivityByDay: API unavailable ($e), '
            'falling back to local Drift data');
      } else {
        rethrow;
      }
    }
  }

  // 2. Fallback: compute from local Drift todo data.
  return _productivityByDayFromTodos(ref);
}

Future<List<(String, double)>> _productivityByDayFromTodos(Ref ref) async {
  try {
    final repo = ref.watch(todoRepositoryProvider);
    final result = await repo.getAll();
    final todos = result.unwrapOr(<Todo>[]);

    final now = DateTime.now();
    final cutoff = now.subtract(const Duration(days: 84)); // 12 weeks
    const weekCount = 12.0;

    // Count completed tasks per weekday (1=Mon ... 7=Sun).
    final counts = <int, int>{};
    for (final todo in todos) {
      if (todo.completedAt == null || todo.completedAt!.isBefore(cutoff)) {
        continue;
      }
      final weekday = todo.completedAt!.weekday; // 1=Mon, 7=Sun
      counts[weekday] = (counts[weekday] ?? 0) + 1;
    }

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return List.generate(7, (i) {
      final weekday = i + 1;
      final avg = (counts[weekday] ?? 0) / weekCount;
      return (dayNames[i], double.parse(avg.toStringAsFixed(1)));
    });
  } catch (_) {
    return const [
      ('Mon', 0), ('Tue', 0), ('Wed', 0), ('Thu', 0),
      ('Fri', 0), ('Sat', 0), ('Sun', 0),
    ];
  }
}

// ---------------------------------------------------------------------------
// Productivity by Hour — API-first with local Drift fallback
// ---------------------------------------------------------------------------

Future<List<(int, int, double)>> _productivityByHourApiFirst(Ref ref) async {
  // 1. Try the backend API first.
  final api = _tryRead(ref, progressApiProvider);
  if (api != null) {
    try {
      final response = await api.getProductivityByHour();
      if (response.success && response.data != null) {
        final byHour = response.data!['entries'] as List?;
        if (byHour != null && byHour.isNotEmpty) {
          return List.unmodifiable(
            byHour.map((e) => (
              e['hour'] as int? ?? 0,
              e['day'] as int? ?? 0,
              (e['intensity'] as num?)?.toDouble() ?? 0.0,
            )),
          );
        }
      }
    } catch (e) {
      if (_isRecoverableError(e)) {
        debugPrint(
            '[gamification] productivityByHour: API unavailable ($e), '
            'falling back to local Drift data');
      } else {
        rethrow;
      }
    }
  }

  // 2. Fallback: compute from local Drift todo data.
  return _productivityByHourFromTodos(ref);
}

Future<List<(int, int, double)>> _productivityByHourFromTodos(
  Ref ref,
) async {
  try {
    final repo = ref.watch(todoRepositoryProvider);
    final result = await repo.getAll();
    final todos = result.unwrapOr(<Todo>[]);

    final now = DateTime.now();
    final cutoff = now.subtract(const Duration(days: 84)); // 12 weeks

    // Count completed tasks per (hour, dayOfWeek).
    final grid = List.generate(24, (_) => List.filled(7, 0));
    var maxCount = 0;

    for (final todo in todos) {
      if (todo.completedAt == null || todo.completedAt!.isBefore(cutoff)) {
        continue;
      }
      final hour = todo.completedAt!.hour;
      final day = todo.completedAt!.weekday - 1; // 0=Mon, 6=Sun
      grid[hour][day]++;
      if (grid[hour][day] > maxCount) maxCount = grid[hour][day];
    }

    // Normalize to 0.0-1.0 intensity.
    final data = <(int, int, double)>[];
    for (int h = 0; h < 24; h++) {
      for (int d = 0; d < 7; d++) {
        final intensity = maxCount > 0 ? grid[h][d] / maxCount : 0.0;
        data.add((h, d, intensity));
      }
    }
    return data;
  } catch (_) {
    return List.generate(168, (i) => (i ~/ 7, i % 7, 0.0));
  }
}

// ---------------------------------------------------------------------------
// Category Breakdown — API-first with local Drift fallback
// ---------------------------------------------------------------------------

Future<List<(String, double)>> _categoryBreakdownApiFirst(Ref ref) async {
  // 1. Try the backend API first.
  final api = _tryRead(ref, progressApiProvider);
  if (api != null) {
    try {
      final response = await api.getInsights();
      if (response.success && response.data != null) {
        final categories = response.data!['categoryBreakdown'] as List?;
        if (categories != null && categories.isNotEmpty) {
          return List.unmodifiable(
            categories.map((e) => (
              e['name'] as String? ?? '',
              (e['count'] as num?)?.toDouble() ?? 0.0,
            )),
          );
        }
      }
    } catch (e) {
      if (_isRecoverableError(e)) {
        debugPrint(
            '[gamification] categoryBreakdown: API unavailable ($e), '
            'falling back to local Drift data');
      } else {
        rethrow;
      }
    }
  }

  // 2. Fallback: compute from local Drift todo + project data.
  return _categoryBreakdownFromTodos(ref);
}

Future<List<(String, double)>> _categoryBreakdownFromTodos(Ref ref) async {
  try {
    final todoRepo = ref.watch(todoRepositoryProvider);
    final projectRepo = ref.watch(projectRepositoryProvider);

    final todoResult = await todoRepo.getAll();
    final projectResult = await projectRepo.getAll();

    final todos = todoResult.unwrapOr(<Todo>[]);
    final projects = projectResult.unwrapOr(<Project>[]);

    // Build project ID -> name map.
    final projectNames = <String, String>{};
    for (final project in projects) {
      projectNames[project.id] = project.name;
    }

    // Count completed tasks per project/category.
    final counts = <String, int>{};
    for (final todo in todos) {
      if (todo.status != TodoStatus.completed) continue;
      final category = todo.projectId != null
          ? (projectNames[todo.projectId] ?? 'Other')
          : 'No Project';
      counts[category] = (counts[category] ?? 0) + 1;
    }

    if (counts.isEmpty) {
      return const [('No Data', 0)];
    }

    // Sort by count descending, take top 5 + aggregate rest.
    final sorted = counts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final result = <(String, double)>[];
    var otherCount = 0;
    for (int i = 0; i < sorted.length; i++) {
      if (i < 5) {
        result.add((sorted[i].key, sorted[i].value.toDouble()));
      } else {
        otherCount += sorted[i].value;
      }
    }
    if (otherCount > 0) {
      result.add(('Other', otherCount.toDouble()));
    }

    return result;
  } catch (_) {
    return const [('No Data', 0)];
  }
}
