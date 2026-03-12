import 'package:feature_home/src/domain/models/home_models.dart';
import 'package:feature_home/src/domain/services/ambient_sound_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Re-export models so widgets can import everything from this file.
export 'package:feature_home/src/domain/models/home_models.dart';
export 'package:feature_home/src/domain/services/ambient_sound_service.dart';

// ---------------------------------------------------------------------------
// User & streak
// ---------------------------------------------------------------------------

/// User display name shown in the greeting bar.
///
/// Override in app bootstrap with the real user profile provider.
final homeUserNameProvider = Provider<String>((ref) => 'User');

/// Override helper for user name.
Override overrideHomeUserName(String name) {
  return homeUserNameProvider.overrideWithValue(name);
}

/// Streak data (current streak count, longest, last active date).
///
/// Override in app bootstrap with the real streak repository.
final homeStreakProvider = FutureProvider<StreakData>(
  (ref) async => StreakData(
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: DateTime.now(),
  ),
);

/// Unread notification count shown on the bell badge.
final homeNotificationCountProvider = Provider<int>((ref) => 0);

// ---------------------------------------------------------------------------
// Progress rings
// ---------------------------------------------------------------------------

/// Aggregated progress data for the three concentric rings.
///
/// Override in app bootstrap with computed values from todos, focus,
/// and habits.
final homeProgressRingsProvider =
    FutureProvider<ProgressRingsData>((ref) async {
  return const ProgressRingsData(
    tasksCompleted: 0,
    tasksTotal: 0,
    focusMinutes: 0,
    focusGoalMinutes: 60,
    habitsCompleted: 0,
    habitsTotal: 0,
  );
});

// ---------------------------------------------------------------------------
// Daily content
// ---------------------------------------------------------------------------

/// Today's daily content (quote, tip, etc.).
///
/// Override in app bootstrap with the real content service.
final homeDailyContentProvider = FutureProvider<DailyContent?>(
  (ref) async => const DailyContent(
    id: 'default',
    category: 'Stoic Wisdom',
    content:
        'The impediment to action advances action. What stands in the way '
        'becomes the way.',
    author: 'Marcus Aurelius',
    source: 'Meditations',
  ),
);

// ---------------------------------------------------------------------------
// Content categories
// ---------------------------------------------------------------------------

/// Immutable model for a content category option.
@immutable
class ContentCategory {
  const ContentCategory({
    required this.id,
    required this.name,
    required this.tagline,
    required this.icon,
  });

  /// Unique identifier (snake_case).
  final String id;

  /// Display name.
  final String name;

  /// Short tagline shown below the name.
  final String tagline;

  /// Material icon for the category.
  final IconData icon;
}

/// The 10 content categories available for selection.
const List<ContentCategory> contentCategories = [
  ContentCategory(
    id: 'stoic_wisdom',
    name: 'Stoic Wisdom',
    tagline: 'Ancient philosophy. Modern edge.',
    icon: Icons.school,
  ),
  ContentCategory(
    id: 'ancient_indian_wisdom',
    name: 'Ancient Indian Wisdom',
    tagline: '5,000 years of power.',
    icon: Icons.temple_hindu,
  ),
  ContentCategory(
    id: 'growth_mindset',
    name: 'Growth Mindset',
    tagline: 'Rewire how you think.',
    icon: Icons.psychology,
  ),
  ContentCategory(
    id: 'dark_humor',
    name: 'Dark Humor & Anti-Motivation',
    tagline: 'Laugh at the chaos.',
    icon: Icons.mood,
  ),
  ContentCategory(
    id: 'anime_pop_culture',
    name: 'Anime & Pop Culture',
    tagline: 'Level up. Main character energy.',
    icon: Icons.movie,
  ),
  ContentCategory(
    id: 'gratitude_mindfulness',
    name: 'Gratitude & Mindfulness',
    tagline: 'Anti-jinx your negativity.',
    icon: Icons.self_improvement,
  ),
  ContentCategory(
    id: 'warrior_discipline',
    name: 'Warrior Discipline',
    tagline: 'Empires were not built comfortably.',
    icon: Icons.shield,
  ),
  ContentCategory(
    id: 'poetic_wisdom',
    name: 'Poetic Wisdom',
    tagline: 'Words that haunt and heal.',
    icon: Icons.edit_note,
  ),
  ContentCategory(
    id: 'productivity_hacks',
    name: 'Productivity Hacks',
    tagline: 'One technique. Every day.',
    icon: Icons.rocket_launch,
  ),
  ContentCategory(
    id: 'comeback_stories',
    name: 'Comeback Stories',
    tagline: 'They were worse off than you.',
    icon: Icons.trending_up,
  ),
];

/// User's selected content categories (set of category IDs).
///
/// Override in app bootstrap with persisted user preferences.
final selectedCategoriesProvider = StateProvider<Set<String>>(
  (ref) => {'stoic_wisdom'},
);

/// User's preferred content delivery time as "HH:mm".
///
/// Override in app bootstrap with persisted user preferences.
final contentDeliveryTimeProvider = StateProvider<String>(
  (ref) => '07:00',
);

/// Recent content history (last 7 days placeholder).
///
/// Override in app bootstrap with real content repository data.
final recentContentProvider = FutureProvider<List<DailyContent>>(
  (ref) async => const <DailyContent>[],
);

// ---------------------------------------------------------------------------
// Content save / unsave
// ---------------------------------------------------------------------------

/// Callback to persist save/unsave state for a content item.
///
/// Override in app bootstrap with a real implementation backed by
/// ContentApiService.saveContent(). The function receives the content ID
/// and the new saved state. Returns the updated [DailyContent].
final contentSaveCallbackProvider =
    Provider<Future<void> Function(String contentId, {required bool saved})>(
  (ref) => (String contentId, {required bool saved}) async {
    // No-op stub. Override at app bootstrap.
  },
);

// ---------------------------------------------------------------------------
// Ritual persistence
// ---------------------------------------------------------------------------

/// Callback to persist morning ritual data (mood, gratitude, intention).
///
/// Override in app bootstrap with a real implementation backed by
/// ContentApiService.logRitual().
final morningRitualSaveCallbackProvider =
    Provider<Future<void> Function({int? mood, String? gratitude, String? intention})>(
  (ref) => ({int? mood, String? gratitude, String? intention}) async {
    // No-op stub. Override at app bootstrap.
  },
);

/// Callback to persist evening review data (reflection text).
///
/// Override in app bootstrap with a real implementation backed by
/// ContentApiService.logRitual().
final eveningReviewSaveCallbackProvider =
    Provider<Future<void> Function({String? reflection})>(
  (ref) => ({String? reflection}) async {
    // No-op stub. Override at app bootstrap.
  },
);

// ---------------------------------------------------------------------------
// Task reschedule
// ---------------------------------------------------------------------------

/// Callback to reschedule an incomplete task to tomorrow.
///
/// Override in app bootstrap with a real implementation backed by
/// TaskApiService.updateTask() or TaskApiService.snoozeTask().
final rescheduleTaskCallbackProvider =
    Provider<Future<void> Function(String taskId)>(
  (ref) => (String taskId) async {
    // No-op stub. Override at app bootstrap.
  },
);

// ---------------------------------------------------------------------------
// Task completion toggle
// ---------------------------------------------------------------------------

/// Callback to toggle a task's completion status.
///
/// Override in app bootstrap with a real implementation backed by
/// TaskApiService.updateTask(). Receives the task ID and the new
/// completion state (true = completed, false = incomplete).
final toggleTaskCompletionCallbackProvider =
    Provider<Future<void> Function(String taskId, {required bool completed})>(
  (ref) => (String taskId, {required bool completed}) async {
    // No-op stub. Override at app bootstrap.
  },
);

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

/// Today's tasks - overdue + today + no date.
///
/// Override in app bootstrap with values from the todo repository.
final homeTodayTasksProvider = FutureProvider<List<HomeTask>>(
  (ref) async => const <HomeTask>[],
);

/// Upcoming tasks (next 3 tasks after today).
///
/// Override in app bootstrap with values from the todo repository.
final homeUpcomingTasksProvider = FutureProvider<List<HomeTask>>(
  (ref) async => const <HomeTask>[],
);

// ---------------------------------------------------------------------------
// Pomodoro settings
// ---------------------------------------------------------------------------

/// Immutable pomodoro timer configuration.
///
/// Override in app bootstrap if the user has customised durations in settings.
class PomodoroSettings {
  const PomodoroSettings({
    this.workMinutes = 25,
    this.shortBreakMinutes = 5,
    this.longBreakMinutes = 15,
    this.sessionsBeforeLongBreak = 4,
  });

  /// Work session length in minutes.
  final int workMinutes;

  /// Short break length in minutes.
  final int shortBreakMinutes;

  /// Long break length in minutes (after all sessions complete).
  final int longBreakMinutes;

  /// Number of work sessions before a long break.
  final int sessionsBeforeLongBreak;

  /// Returns a copy with the given fields replaced.
  PomodoroSettings copyWith({
    int? workMinutes,
    int? shortBreakMinutes,
    int? longBreakMinutes,
    int? sessionsBeforeLongBreak,
  }) {
    return PomodoroSettings(
      workMinutes: workMinutes ?? this.workMinutes,
      shortBreakMinutes: shortBreakMinutes ?? this.shortBreakMinutes,
      longBreakMinutes: longBreakMinutes ?? this.longBreakMinutes,
      sessionsBeforeLongBreak:
          sessionsBeforeLongBreak ?? this.sessionsBeforeLongBreak,
    );
  }
}

/// Provider for pomodoro timer settings.
///
/// Override in app bootstrap to wire up user-configurable durations.
final pomodoroSettingsProvider = Provider<PomodoroSettings>(
  (ref) => const PomodoroSettings(),
);

// ---------------------------------------------------------------------------
// Progress Hub - Activity heatmap
// ---------------------------------------------------------------------------

/// Daily task completion counts for the activity heatmap.
///
/// Keys are ISO date strings ("2026-03-09"), values are completion counts.
/// Override in app bootstrap with real data from the todo repository.
@immutable
class ActivityData {
  const ActivityData({this.dailyCounts = const {}});

  /// Map of ISO date string to completed task count for that day.
  final Map<String, int> dailyCounts;

  /// Returns a copy with the given fields replaced.
  ActivityData copyWith({Map<String, int>? dailyCounts}) {
    return ActivityData(dailyCounts: dailyCounts ?? this.dailyCounts);
  }
}

/// Provides activity data for the heatmap grid.
///
/// Override in app bootstrap with computed values from the todo repository.
final activityHeatmapProvider = FutureProvider<ActivityData>(
  (ref) async => const ActivityData(),
);

// ---------------------------------------------------------------------------
// Progress Hub - Personal bests
// ---------------------------------------------------------------------------

/// Lifetime personal best statistics.
///
/// Override in app bootstrap with real aggregate data.
@immutable
class PersonalBests {
  const PersonalBests({
    this.mostTasksInDay = 0,
    this.longestStreak = 0,
    this.totalCompleted = 0,
    this.totalFocusMinutes = 0,
  });

  /// Maximum tasks completed in a single day.
  final int mostTasksInDay;

  /// Longest consecutive-day streak.
  final int longestStreak;

  /// All-time total completed tasks.
  final int totalCompleted;

  /// All-time total focus minutes.
  final int totalFocusMinutes;

  /// Returns a copy with the given fields replaced.
  PersonalBests copyWith({
    int? mostTasksInDay,
    int? longestStreak,
    int? totalCompleted,
    int? totalFocusMinutes,
  }) {
    return PersonalBests(
      mostTasksInDay: mostTasksInDay ?? this.mostTasksInDay,
      longestStreak: longestStreak ?? this.longestStreak,
      totalCompleted: totalCompleted ?? this.totalCompleted,
      totalFocusMinutes: totalFocusMinutes ?? this.totalFocusMinutes,
    );
  }
}

/// Provides personal best statistics for the Progress Hub.
///
/// Override in app bootstrap with real aggregate data.
final personalBestsProvider = FutureProvider<PersonalBests>(
  (ref) async => const PersonalBests(),
);

// ---------------------------------------------------------------------------
// Progress Hub - Weekly insight
// ---------------------------------------------------------------------------

/// A rotating weekly insight message for the user.
@immutable
class WeeklyInsight {
  const WeeklyInsight({required this.text, this.type = 'general'});

  /// The insight message text.
  final String text;

  /// Category: 'streak', 'completion', 'productivity', or 'general'.
  final String type;
}

/// Provides a contextual weekly insight based on current streak data.
///
/// When a real analytics engine is available, override this provider.
final weeklyInsightProvider = FutureProvider<WeeklyInsight>((ref) async {
  final streak = await ref.watch(homeStreakProvider.future);
  if (streak.currentStreak > 0) {
    return WeeklyInsight(
      text: "You're on a ${streak.currentStreak}-day streak! Keep it going.",
      type: 'streak',
    );
  }
  return const WeeklyInsight(
    text: 'Start completing tasks to see your insights here.',
  );
});

// ---------------------------------------------------------------------------
// Ghost mode
// ---------------------------------------------------------------------------

/// Whether ghost mode is currently active.
final ghostModeActiveProvider = StateProvider<bool>((ref) => false);

/// Sorted task list for ghost mode.
///
/// Prioritises overdue tasks first, then by priority (urgent -> none),
/// then by due date (earlier first), then tasks without due dates last.
/// Only incomplete tasks are included.
final ghostModeTasksProvider = FutureProvider<List<HomeTask>>((ref) async {
  final tasks = await ref.watch(homeTodayTasksProvider.future);
  final now = DateTime.now();
  final todayStart = DateTime(now.year, now.month, now.day);

  // Filter to incomplete tasks.
  final incomplete =
      tasks.where((t) => !t.isCompleted).toList(growable: false);

  // Sort with a stable comparator.
  final sorted = [...incomplete]..sort((a, b) {
      // 1. Overdue tasks first.
      final aOverdue = a.dueDate != null && a.dueDate!.isBefore(todayStart);
      final bOverdue = b.dueDate != null && b.dueDate!.isBefore(todayStart);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // 2. By priority (urgent = 0, none = 4).
      final priorityOrder = <HomeTaskPriority, int>{
        HomeTaskPriority.urgent: 0,
        HomeTaskPriority.high: 1,
        HomeTaskPriority.medium: 2,
        HomeTaskPriority.low: 3,
        HomeTaskPriority.none: 4,
      };
      final aPri = priorityOrder[a.priority] ?? 4;
      final bPri = priorityOrder[b.priority] ?? 4;
      if (aPri != bPri) return aPri.compareTo(bPri);

      // 3. By due date (earlier first, null last).
      if (a.dueDate != null && b.dueDate != null) {
        return a.dueDate!.compareTo(b.dueDate!);
      }
      if (a.dueDate != null) return -1;
      if (b.dueDate != null) return 1;

      return 0;
    });

  return sorted;
});

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

/// Lightweight task representation for the calendar view.
///
/// Avoids coupling to the full Todo entity from feature_todos.
@immutable
class CalendarTask {
  const CalendarTask({
    required this.id,
    required this.title,
    required this.priority,
    required this.status,
    this.dueDate,
    this.projectColor,
  });

  /// Unique identifier.
  final String id;

  /// Task title.
  final String title;

  /// Due date (nullable -- tasks without dates won't appear on the calendar).
  final DateTime? dueDate;

  /// Priority as a string: 'urgent', 'high', 'medium', 'low', 'none'.
  final String priority;

  /// Status: 'pending', 'completed', etc.
  final String status;

  /// Optional ARGB color int of the associated project.
  final int? projectColor;

  /// Returns a copy with the given fields replaced.
  CalendarTask copyWith({
    String? id,
    String? title,
    DateTime? dueDate,
    String? priority,
    String? status,
    int? projectColor,
  }) {
    return CalendarTask(
      id: id ?? this.id,
      title: title ?? this.title,
      dueDate: dueDate ?? this.dueDate,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      projectColor: projectColor ?? this.projectColor,
    );
  }
}

/// Tasks for a given month, used by the calendar grid.
///
/// The [DateTime] parameter represents the month (only year and month are
/// used). Override in app bootstrap with real data from the todo repository.
final calendarTasksProvider =
    FutureProvider.family<List<CalendarTask>, DateTime>(
  (ref, month) async {
    // Placeholder -- returns empty until wired to real data source.
    return const <CalendarTask>[];
  },
);

// ---------------------------------------------------------------------------
// Ambient sound (Pomodoro)
// ---------------------------------------------------------------------------

/// Selected ambient sound for Pomodoro sessions.
final ambientSoundProvider =
    StateProvider<AmbientSoundState>((ref) => const AmbientSoundState());

/// Controls ambient sound playback.
///
/// Phase 2: State tracking only (no audio playback).
/// Phase 3: Wire to just_audio for actual sound playback.
final ambientSoundControllerProvider =
    StateNotifierProvider<AmbientSoundController, AmbientSoundState>(
  (ref) => AmbientSoundController(),
);

class AmbientSoundController extends StateNotifier<AmbientSoundState> {
  AmbientSoundController() : super(const AmbientSoundState());

  void selectSound(AmbientSound sound) {
    state = state.copyWith(sound: sound);
  }

  void setVolume(double volume) {
    state = state.copyWith(volume: volume.clamp(0.0, 1.0));
  }

  void play() {
    if (!state.sound.isSilence) {
      state = state.copyWith(isPlaying: true);
      // Phase 3: actual audio playback via just_audio
    }
  }

  void pause() {
    state = state.copyWith(isPlaying: false);
    // Phase 3: pause actual audio
  }

  void stop() {
    state = state.copyWith(isPlaying: false);
    // Phase 3: stop and dispose audio
  }
}
