import 'package:dio/dio.dart';
import 'package:feature_home/feature_home.dart';
import 'package:feature_todos/todo_plugin.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:service_api/service_api.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Safely watch an API provider, returning null if not wired up (e.g. tests).
///
/// Use during provider build phase (FutureProvider bodies).
T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

/// Safely read an API provider without subscribing, returning null if
/// not wired up. Use inside callbacks invoked outside the build cycle.
T? _tryReadSync<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.read(provider);
  } catch (_) {
    return null;
  }
}

/// Map [TodoPriority] to [HomeTaskPriority] by name.
HomeTaskPriority _mapPriority(TodoPriority priority) {
  switch (priority) {
    case TodoPriority.urgent:
      return HomeTaskPriority.urgent;
    case TodoPriority.high:
      return HomeTaskPriority.high;
    case TodoPriority.medium:
      return HomeTaskPriority.medium;
    case TodoPriority.low:
      return HomeTaskPriority.low;
    case TodoPriority.none:
      return HomeTaskPriority.none;
  }
}

/// Convert a [Todo] into a lightweight [HomeTask].
HomeTask _todoToHomeTask(Todo todo) {
  return HomeTask(
    id: todo.id,
    title: todo.title,
    isCompleted: todo.status == TodoStatus.completed,
    priority: _mapPriority(todo.priority),
    dueDate: todo.dueDate,
    projectId: todo.projectId,
  );
}

/// Convert a [Todo] into a lightweight [CalendarTask].
CalendarTask _todoToCalendarTask(Todo todo) {
  return CalendarTask(
    id: todo.id,
    title: todo.title,
    priority: todo.priority.name,
    status: todo.status.name,
    dueDate: todo.dueDate,
  );
}

// ---------------------------------------------------------------------------
// Default fallback values
// ---------------------------------------------------------------------------

final _defaultStreak = StreakData(
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: DateTime.now(),
);

const _defaultRings = ProgressRingsData(
  tasksCompleted: 0,
  tasksTotal: 0,
  focusMinutes: 0,
  focusGoalMinutes: 60,
  habitsCompleted: 0,
  habitsTotal: 0,
);

const _defaultContent = DailyContent(
  id: 'default',
  category: 'Stoic Wisdom',
  content:
      'The impediment to action advances action. What stands in the way '
      'becomes the way.',
  author: 'Marcus Aurelius',
  source: 'Meditations',
);

const _defaultActivity = ActivityData();

const _defaultBests = PersonalBests();

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/// Returns a list of Riverpod overrides that wire all home-screen providers
/// to the real backend API and local Drift database.
///
/// Spread these into the [ProviderScope.overrides] list in bootstrap.
List<Override> homeApiOverrides() {
  return [
    // Streak
    homeStreakProvider.overrideWith(_streakFromApi),

    // Progress rings
    homeProgressRingsProvider.overrideWith(_ringsFromApi),

    // Daily content
    homeDailyContentProvider.overrideWith(_dailyContentFromApi),

    // Today's tasks (local Drift)
    homeTodayTasksProvider.overrideWith(_todayTasksFromRepo),

    // Upcoming tasks (local Drift)
    homeUpcomingTasksProvider.overrideWith(_upcomingTasksFromRepo),

    // Activity heatmap
    activityHeatmapProvider.overrideWith(_heatmapFromApi),

    // Personal bests
    personalBestsProvider.overrideWith(_bestsFromApi),

    // Recent content history
    recentContentProvider.overrideWith(_recentContentFromApi),

    // Content save/unsave callback
    contentSaveCallbackProvider.overrideWith(_contentSaveCallback),

    // Morning ritual callback
    morningRitualSaveCallbackProvider.overrideWith(_morningRitualCallback),

    // Evening review callback
    eveningReviewSaveCallbackProvider.overrideWith(_eveningReviewCallback),

    // Reschedule task callback
    rescheduleTaskCallbackProvider.overrideWith(_rescheduleTaskCallback),

    // Calendar tasks (family provider)
    calendarTasksProvider.overrideWith(_calendarTasksFromRepo),
  ];
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

Future<StreakData> _streakFromApi(Ref ref) async {
  final api = _tryRead(ref, progressApiProvider);
  if (api == null) return _defaultStreak;

  try {
    final response = await api.getStreak();
    if (response.success && response.data != null) {
      final d = response.data!;
      return StreakData(
        currentStreak: (d['currentStreak'] as num?)?.toInt() ?? 0,
        longestStreak: (d['longestStreak'] as num?)?.toInt() ?? 0,
        lastActiveDate: d['lastActiveDate'] != null
            ? (DateTime.tryParse(d['lastActiveDate'] as String) ??
                DateTime.now())
            : DateTime.now(),
      );
    }
    return _defaultStreak;
  } on DioException {
    return _defaultStreak;
  }
}

Future<ProgressRingsData> _ringsFromApi(Ref ref) async {
  final api = _tryRead(ref, progressApiProvider);
  if (api == null) return _computeRingsFromTodos(ref);

  try {
    final response = await api.getRings();
    if (response.success && response.data != null) {
      final d = response.data!;
      return ProgressRingsData(
        tasksCompleted: (d['tasksCompleted'] as num?)?.toInt() ?? 0,
        tasksTotal: (d['tasksTotal'] as num?)?.toInt() ?? 0,
        focusMinutes: (d['focusMinutes'] as num?)?.toInt() ?? 0,
        focusGoalMinutes: (d['focusGoalMinutes'] as num?)?.toInt() ?? 60,
        habitsCompleted: (d['habitsCompleted'] as num?)?.toInt() ?? 0,
        habitsTotal: (d['habitsTotal'] as num?)?.toInt() ?? 0,
      );
    }
    return _computeRingsFromTodos(ref);
  } on DioException {
    return _computeRingsFromTodos(ref);
  }
}

/// Fallback: compute rings from local todo data when the API is unavailable.
Future<ProgressRingsData> _computeRingsFromTodos(Ref ref) async {
  try {
    final repo = ref.watch(todoRepositoryProvider);
    final result = await repo.getAll();
    final todos = result.unwrapOr(<Todo>[]);
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final todayEnd = todayStart.add(const Duration(days: 1));

    final todayTodos = todos.where((t) {
      if (t.dueDate == null) return false;
      return !t.dueDate!.isBefore(todayStart) && t.dueDate!.isBefore(todayEnd);
    }).toList();

    final completed =
        todayTodos.where((t) => t.status == TodoStatus.completed).length;

    return ProgressRingsData(
      tasksCompleted: completed,
      tasksTotal: todayTodos.length,
      focusMinutes: 0,
      focusGoalMinutes: 60,
      habitsCompleted: 0,
      habitsTotal: 0,
    );
  } catch (_) {
    return _defaultRings;
  }
}

Future<DailyContent?> _dailyContentFromApi(Ref ref) async {
  final api = _tryRead(ref, contentApiProvider);
  if (api == null) return _defaultContent;

  try {
    final response = await api.getTodayContent();
    if (response.success && response.data != null) {
      final d = response.data!;
      return DailyContent(
        id: (d['id'] as String?) ?? 'default',
        category: (d['category'] as String?) ?? 'Stoic Wisdom',
        content: (d['content'] as String?) ?? _defaultContent.content,
        author: (d['author'] as String?) ?? 'Unknown',
        source: d['source'] as String?,
        isSaved: (d['isSaved'] as bool?) ?? false,
      );
    }
    return _defaultContent;
  } on DioException {
    return _defaultContent;
  }
}

Future<List<HomeTask>> _todayTasksFromRepo(Ref ref) async {
  try {
    final repo = ref.watch(todoRepositoryProvider);
    final result = await repo.getAll();
    final todos = result.unwrapOr(<Todo>[]);
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final todayEnd = todayStart.add(const Duration(days: 1));

    // Include: overdue, today, or no due date (assumed "today").
    final todayTodos = todos.where((t) {
      if (t.status == TodoStatus.cancelled) return false;
      if (t.dueDate == null) return true; // no-date tasks appear in today
      return t.dueDate!.isBefore(todayEnd); // overdue + today
    }).toList();

    return List.unmodifiable(todayTodos.map(_todoToHomeTask));
  } catch (_) {
    return const <HomeTask>[];
  }
}

Future<List<HomeTask>> _upcomingTasksFromRepo(Ref ref) async {
  try {
    final repo = ref.watch(todoRepositoryProvider);
    final result = await repo.getAll();
    final todos = result.unwrapOr(<Todo>[]);
    final now = DateTime.now();
    final tomorrowStart =
        DateTime(now.year, now.month, now.day).add(const Duration(days: 1));

    // Future tasks only (due date >= tomorrow), sorted by due date.
    final upcoming = todos
        .where((t) =>
            t.status != TodoStatus.cancelled &&
            t.status != TodoStatus.completed &&
            t.dueDate != null &&
            !t.dueDate!.isBefore(tomorrowStart))
        .toList()
      ..sort((a, b) => a.dueDate!.compareTo(b.dueDate!));

    // Return at most 3 upcoming tasks.
    final limited = upcoming.take(3).map(_todoToHomeTask).toList();
    return List.unmodifiable(limited);
  } catch (_) {
    return const <HomeTask>[];
  }
}

Future<ActivityData> _heatmapFromApi(Ref ref) async {
  final api = _tryRead(ref, progressApiProvider);
  if (api == null) return _defaultActivity;

  try {
    // Request last 90 days of heatmap data.
    final now = DateTime.now();
    final from =
        now.subtract(const Duration(days: 90)).toIso8601String().split('T')[0];
    final to = now.toIso8601String().split('T')[0];

    final response = await api.getHeatmap(from: from, to: to);
    if (response.success && response.data != null) {
      final raw = response.data!;
      // API returns { "dailyCounts": { "2026-03-09": 5, ... } }
      final countsRaw = raw['dailyCounts'];
      if (countsRaw is Map) {
        final counts = <String, int>{};
        for (final entry in countsRaw.entries) {
          counts[entry.key as String] = (entry.value as num).toInt();
        }
        return ActivityData(dailyCounts: Map.unmodifiable(counts));
      }
    }
    return _defaultActivity;
  } on DioException {
    return _defaultActivity;
  }
}

Future<PersonalBests> _bestsFromApi(Ref ref) async {
  final api = _tryRead(ref, progressApiProvider);
  if (api == null) return _defaultBests;

  try {
    final response = await api.getBests();
    if (response.success && response.data != null) {
      final d = response.data!;
      return PersonalBests(
        mostTasksInDay: (d['mostTasksInDay'] as num?)?.toInt() ?? 0,
        longestStreak: (d['longestStreak'] as num?)?.toInt() ?? 0,
        totalCompleted: (d['totalCompleted'] as num?)?.toInt() ?? 0,
        totalFocusMinutes: (d['totalFocusMinutes'] as num?)?.toInt() ?? 0,
      );
    }
    return _defaultBests;
  } on DioException {
    return _defaultBests;
  }
}

Future<List<DailyContent>> _recentContentFromApi(Ref ref) async {
  final api = _tryRead(ref, contentApiProvider);
  if (api == null) return const <DailyContent>[];

  try {
    final response = await api.getRitualHistory();
    if (response.success && response.data != null) {
      final items = (response.data!).cast<Map<String, dynamic>>();
      final contents = items.map((d) {
        return DailyContent(
          id: (d['id'] as String?) ?? '',
          category: (d['category'] as String?) ?? '',
          content: (d['content'] as String?) ?? '',
          author: (d['author'] as String?) ?? '',
          source: d['source'] as String?,
          isSaved: (d['isSaved'] as bool?) ?? false,
        );
      }).toList();
      return List.unmodifiable(contents);
    }
    return const <DailyContent>[];
  } on DioException {
    return const <DailyContent>[];
  }
}

// ---------------------------------------------------------------------------
// Callback providers
// ---------------------------------------------------------------------------

Future<void> Function(String, {required bool saved}) _contentSaveCallback(
  Ref ref,
) {
  return (String contentId, {required bool saved}) async {
    final api = _tryReadSync(ref, contentApiProvider);
    if (api == null) return;

    try {
      // The API uses a single save endpoint; the backend toggles state.
      await api.saveContent(contentId);
    } on DioException {
      // Swallow — UI can show optimistic state.
    }
  };
}

Future<void> Function({int? mood, String? gratitude, String? intention})
    _morningRitualCallback(Ref ref) {
  return ({int? mood, String? gratitude, String? intention}) async {
    final api = _tryReadSync(ref, contentApiProvider);
    if (api == null) return;

    try {
      await api.logRitual({
        'type': 'morning',
        if (mood != null) 'mood': mood,
        if (gratitude != null) 'gratitude': gratitude,
        if (intention != null) 'intention': intention,
      });
    } on DioException {
      // Swallow — user sees local state.
    }
  };
}

Future<void> Function({String? reflection}) _eveningReviewCallback(Ref ref) {
  return ({String? reflection}) async {
    final api = _tryReadSync(ref, contentApiProvider);
    if (api == null) return;

    try {
      await api.logRitual({
        'type': 'evening',
        if (reflection != null) 'reflection': reflection,
      });
    } on DioException {
      // Swallow — user sees local state.
    }
  };
}

Future<void> Function(String) _rescheduleTaskCallback(Ref ref) {
  return (String taskId) async {
    // Compute tomorrow's date.
    final now = DateTime.now();
    final tomorrow = DateTime(now.year, now.month, now.day + 1);

    // 1. Update local Drift database.
    try {
      final repo = ref.read(todoRepositoryProvider);
      final result = await repo.getById(taskId);
      final todo = result.unwrapOr(
        Todo(
          id: taskId,
          title: '',
          createdAt: now,
          updatedAt: now,
        ),
      );
      if (todo.title.isNotEmpty) {
        await repo.update(todo.copyWith(
          dueDate: tomorrow,
          updatedAt: DateTime.now(),
        ));
      }
    } catch (_) {
      // Local update failed — continue to API attempt.
    }

    // 2. Push to backend API.
    final api = _tryReadSync(ref, taskApiProvider);
    if (api == null) return;

    try {
      await api.updateTask(taskId, {
        'dueDate': tomorrow.toIso8601String(),
      });
    } on DioException {
      // Swallow — sync engine will reconcile later.
    }
  };
}

// ---------------------------------------------------------------------------
// Calendar tasks (family provider)
// ---------------------------------------------------------------------------

Future<List<CalendarTask>> _calendarTasksFromRepo(
  Ref ref,
  DateTime month,
) async {
  try {
    final repo = ref.watch(todoRepositoryProvider);
    final result = await repo.getAll();
    final todos = result.unwrapOr(<Todo>[]);

    // Filter to tasks whose due date falls within the requested month.
    final monthStart = DateTime(month.year, month.month);
    final monthEnd = DateTime(month.year, month.month + 1);

    final monthTodos = todos.where((t) {
      if (t.dueDate == null) return false;
      return !t.dueDate!.isBefore(monthStart) &&
          t.dueDate!.isBefore(monthEnd);
    }).toList();

    return List.unmodifiable(monthTodos.map(_todoToCalendarTask));
  } catch (_) {
    return const <CalendarTask>[];
  }
}
