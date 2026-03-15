import 'package:feature_gamification/feature_gamification.dart';
import 'package:feature_projects/feature_projects.dart';
import 'package:feature_todos/todo_plugin.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:unjynx_core/core.dart';

// ---------------------------------------------------------------------------
// Gamification chart data — computed from local Drift database.
//
// Follows the same override pattern as home_api_overrides.dart.
// Each provider aggregates real task data from the TodoRepository.
// ---------------------------------------------------------------------------

/// Returns Riverpod overrides that wire the 4 gamification chart providers
/// to real local task data instead of placeholder values.
List<Override> gamificationOverrides() {
  return [
    completionTrendProvider.overrideWith(_completionTrendFromTodos),
    productivityByDayProvider.overrideWith(_productivityByDayFromTodos),
    productivityByHourProvider.overrideWith(_productivityByHourFromTodos),
    categoryBreakdownProvider.overrideWith(_categoryBreakdownFromTodos),
  ];
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

/// Completion trend: (dayOffset, completedCount) for last 30/90/365 days.
Future<List<(int, double)>> _completionTrendFromTodos(Ref ref) async {
  try {
    final range = ref.watch(trendRangeProvider);
    final days = switch (range) {
      TrendRange.days30 => 30,
      TrendRange.days90 => 90,
      TrendRange.year => 365,
    };

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

    // Return as list ordered oldest→newest (offset N-1 → 0).
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

/// Productivity by day of week: (dayName, avgTasks) over last 12 weeks.
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

/// Productivity heatmap: (hour, dayOfWeek, intensity 0.0-1.0) for 24h × 7d.
Future<List<(int, int, double)>> _productivityByHourFromTodos(Ref ref) async {
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

/// Category breakdown: (categoryName, count) from project names.
Future<List<(String, double)>> _categoryBreakdownFromTodos(Ref ref) async {
  try {
    final todoRepo = ref.watch(todoRepositoryProvider);
    final projectRepo = ref.watch(projectRepositoryProvider);

    final todoResult = await todoRepo.getAll();
    final projectResult = await projectRepo.getAll();

    final todos = todoResult.unwrapOr(<Todo>[]);
    final projects = projectResult.unwrapOr(<Project>[]);

    // Build project ID → name map.
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
