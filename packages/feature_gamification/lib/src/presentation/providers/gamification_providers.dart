import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

import '../../domain/models/accountability_partner.dart';
import '../../domain/models/achievement.dart';
import '../../domain/models/challenge.dart';
import '../../domain/models/leaderboard_entry.dart';
import '../../domain/models/xp_data.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Safely read an API provider, returning null if not wired up (e.g. tests).
T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } on StateError {
    return null;
  }
}

/// Convert a [LeaderboardPeriod] enum to the snake_case API query param.
String _periodToParam(LeaderboardPeriod period) {
  switch (period) {
    case LeaderboardPeriod.thisWeek:
      return 'this_week';
    case LeaderboardPeriod.thisMonth:
      return 'this_month';
    case LeaderboardPeriod.allTime:
      return 'all_time';
  }
}

/// Convert a [LeaderboardScope] enum to the API query param.
String _scopeToParam(LeaderboardScope scope) {
  switch (scope) {
    case LeaderboardScope.friends:
      return 'friends';
    case LeaderboardScope.team:
      return 'team';
  }
}

// ---------------------------------------------------------------------------
// XP & Level
// ---------------------------------------------------------------------------

/// Current user's XP data. Fetches from the gamification API, falls back to
/// empty defaults when the API is unavailable.
final xpDataProvider = FutureProvider<XpData>((ref) async {
  final api = _tryRead(ref, gamificationApiProvider);
  if (api == null) return XpData.empty;

  try {
    final response = await api.getXpData();
    if (response.success && response.data != null) {
      return XpData.fromJson(response.data!);
    }
    return XpData.empty;
  } on DioException {
    return XpData.empty;
  }
});

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

/// All achievements with unlock status for the current user.
final achievementsProvider = FutureProvider<List<Achievement>>((ref) async {
  final api = _tryRead(ref, gamificationApiProvider);
  if (api == null) return List.unmodifiable(<Achievement>[]);

  try {
    final response = await api.getAchievements();
    if (response.success && response.data != null) {
      final items = (response.data! as List)
          .cast<Map<String, dynamic>>()
          .map(Achievement.fromJson)
          .toList();
      return List.unmodifiable(items);
    }
    return List.unmodifiable(<Achievement>[]);
  } on DioException {
    return List.unmodifiable(<Achievement>[]);
  }
});

/// Unlocked achievement count.
final unlockedCountProvider = Provider<AsyncValue<int>>((ref) {
  return ref.watch(achievementsProvider).whenData(
        (list) => list.where((a) => a.isUnlocked).length,
      );
});

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

/// Leaderboard time range.
enum LeaderboardPeriod { thisWeek, thisMonth, allTime }

/// Leaderboard scope toggle.
enum LeaderboardScope { friends, team }

/// Currently selected leaderboard period.
final leaderboardPeriodProvider = StateProvider<LeaderboardPeriod>(
  (ref) => LeaderboardPeriod.thisWeek,
);

/// Currently selected leaderboard scope.
final leaderboardScopeProvider = StateProvider<LeaderboardScope>(
  (ref) => LeaderboardScope.friends,
);

/// Leaderboard entries for the selected period and scope.
final leaderboardProvider =
    FutureProvider<List<LeaderboardEntry>>((ref) async {
  final period = ref.watch(leaderboardPeriodProvider);
  final scope = ref.watch(leaderboardScopeProvider);

  final api = _tryRead(ref, gamificationApiProvider);
  if (api == null) return List.unmodifiable(<LeaderboardEntry>[]);

  try {
    final response = await api.getLeaderboard(
      scope: _scopeToParam(scope),
      period: _periodToParam(period),
    );
    if (response.success && response.data != null) {
      final items = (response.data! as List)
          .cast<Map<String, dynamic>>()
          .map(LeaderboardEntry.fromJson)
          .toList();
      return List.unmodifiable(items);
    }
    return List.unmodifiable(<LeaderboardEntry>[]);
  } on DioException {
    return List.unmodifiable(<LeaderboardEntry>[]);
  }
});

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

/// Active challenges for the current user.
final activeChallengesProvider = FutureProvider<List<Challenge>>((ref) async {
  final api = _tryRead(ref, gamificationApiProvider);
  if (api == null) return List.unmodifiable(<Challenge>[]);

  try {
    final response = await api.getChallenges(status: 'active');
    if (response.success && response.data != null) {
      final items = (response.data! as List)
          .cast<Map<String, dynamic>>()
          .map(Challenge.fromJson)
          .toList();
      return List.unmodifiable(items);
    }
    return List.unmodifiable(<Challenge>[]);
  } on DioException {
    return List.unmodifiable(<Challenge>[]);
  }
});

// ---------------------------------------------------------------------------
// Accountability Partners
// ---------------------------------------------------------------------------

/// Current accountability partners (max 3).
final partnersProvider =
    FutureProvider<List<AccountabilityPartner>>((ref) async {
  final api = _tryRead(ref, accountabilityApiProvider);
  if (api == null) return List.unmodifiable(<AccountabilityPartner>[]);

  try {
    final response = await api.getPartners();
    if (response.success && response.data != null) {
      final items = (response.data! as List)
          .cast<Map<String, dynamic>>()
          .map(AccountabilityPartner.fromJson)
          .toList();
      return List.unmodifiable(items);
    }
    return List.unmodifiable(<AccountabilityPartner>[]);
  } on DioException {
    return List.unmodifiable(<AccountabilityPartner>[]);
  }
});

/// Shared goals with partners.
final sharedGoalsProvider = FutureProvider<List<SharedGoal>>((ref) async {
  final api = _tryRead(ref, accountabilityApiProvider);
  if (api == null) return List.unmodifiable(<SharedGoal>[]);

  try {
    final response = await api.getSharedGoals();
    if (response.success && response.data != null) {
      final items = (response.data! as List)
          .cast<Map<String, dynamic>>()
          .map(SharedGoal.fromJson)
          .toList();
      return List.unmodifiable(items);
    }
    return List.unmodifiable(<SharedGoal>[]);
  } on DioException {
    return List.unmodifiable(<SharedGoal>[]);
  }
});

// ---------------------------------------------------------------------------
// Progress Dashboard chart data (mock — no dedicated backend endpoints yet)
// ---------------------------------------------------------------------------

/// Completion trend data points: (dayOffset, completedCount).
final completionTrendProvider =
    FutureProvider<List<(int, double)>>((ref) async {
  final api = _tryRead(ref, progressApiProvider);
  if (api != null) {
    try {
      final response = await api.getHeatmap();
      if (response.success && response.data != null) {
        final entries = response.data!['entries'] as List?;
        if (entries != null) {
          return List.unmodifiable(
            entries.asMap().entries.map((e) => (
              e.key,
              (e.value['count'] as num?)?.toDouble() ?? 0.0,
            )),
          );
        }
      }
    } on DioException {
      // Fall through to mock data.
    }
  }
  // Fallback mock data when API unavailable.
  return List.generate(30, (i) => (i, (i * 1.5 + 3).toDouble()));
});

/// Productivity by day of week: (dayName, avgTasks).
final productivityByDayProvider =
    FutureProvider<List<(String, double)>>((ref) async {
  final api = _tryRead(ref, progressApiProvider);
  if (api != null) {
    try {
      final response = await api.getInsights();
      if (response.success && response.data != null) {
        final byDay = response.data!['productivityByDay'] as List?;
        if (byDay != null) {
          return List.unmodifiable(
            byDay.map((e) => (
              e['day'] as String? ?? '',
              (e['avg'] as num?)?.toDouble() ?? 0.0,
            )),
          );
        }
      }
    } on DioException {
      // Fall through to mock data.
    }
  }
  // Fallback mock data when API unavailable.
  return [
    ('Mon', 8.0),
    ('Tue', 12.0),
    ('Wed', 10.0),
    ('Thu', 14.0),
    ('Fri', 9.0),
    ('Sat', 5.0),
    ('Sun', 3.0),
  ];
});

/// Productivity by hour heatmap: (hour, dayOfWeek, intensity 0.0-1.0).
final productivityByHourProvider =
    FutureProvider<List<(int, int, double)>>((ref) async {
  final api = _tryRead(ref, progressApiProvider);
  if (api != null) {
    try {
      final response = await api.getInsights();
      if (response.success && response.data != null) {
        final byHour = response.data!['productivityByHour'] as List?;
        if (byHour != null) {
          return List.unmodifiable(
            byHour.map((e) => (
              e['hour'] as int? ?? 0,
              e['day'] as int? ?? 0,
              (e['intensity'] as num?)?.toDouble() ?? 0.0,
            )),
          );
        }
      }
    } on DioException {
      // Fall through to mock data.
    }
  }
  // Fallback mock data: generate 24h x 7d heatmap.
  final data = <(int, int, double)>[];
  for (int h = 0; h < 24; h++) {
    for (int d = 0; d < 7; d++) {
      // Peak hours 9-17 on weekdays.
      final isWorkHour = h >= 9 && h <= 17;
      final isWeekday = d < 5;
      final intensity =
          (isWorkHour && isWeekday) ? 0.6 + (h % 3) * 0.1 : 0.1 + (h % 4) * 0.05;
      data.add((h, d, intensity.clamp(0.0, 1.0)));
    }
  }
  return data;
});

/// Category breakdown: (categoryName, count).
final categoryBreakdownProvider =
    FutureProvider<List<(String, double)>>((ref) async {
  final api = _tryRead(ref, progressApiProvider);
  if (api != null) {
    try {
      final response = await api.getInsights();
      if (response.success && response.data != null) {
        final categories = response.data!['categoryBreakdown'] as List?;
        if (categories != null) {
          return List.unmodifiable(
            categories.map((e) => (
              e['name'] as String? ?? '',
              (e['count'] as num?)?.toDouble() ?? 0.0,
            )),
          );
        }
      }
    } on DioException {
      // Fall through to mock data.
    }
  }
  // Fallback mock data when API unavailable.
  return [
    ('Work', 45.0),
    ('Personal', 28.0),
    ('Health', 15.0),
    ('Learning', 8.0),
    ('Other', 4.0),
  ];
});

/// Selected trend range for completion chart.
enum TrendRange { days30, days90, year }

final trendRangeProvider = StateProvider<TrendRange>(
  (ref) => TrendRange.days30,
);
