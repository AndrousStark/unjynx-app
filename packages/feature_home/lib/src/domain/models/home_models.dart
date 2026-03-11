import 'package:flutter/foundation.dart';

/// A lightweight task representation for the home screen.
///
/// Avoids tight coupling to the full Todo entity from feature_todos.
@immutable
class HomeTask {
  const HomeTask({
    required this.id,
    required this.title,
    required this.priority,
    this.projectId,
    this.projectColor,
    this.dueDate,
    this.isCompleted = false,
  });

  final String id;
  final String title;
  final HomeTaskPriority priority;
  final String? projectId;
  final int? projectColor;
  final DateTime? dueDate;
  final bool isCompleted;

  /// Creates a copy with the specified fields replaced.
  HomeTask copyWith({
    String? id,
    String? title,
    HomeTaskPriority? priority,
    String? projectId,
    int? projectColor,
    DateTime? dueDate,
    bool? isCompleted,
  }) {
    return HomeTask(
      id: id ?? this.id,
      title: title ?? this.title,
      priority: priority ?? this.priority,
      projectId: projectId ?? this.projectId,
      projectColor: projectColor ?? this.projectColor,
      dueDate: dueDate ?? this.dueDate,
      isCompleted: isCompleted ?? this.isCompleted,
    );
  }
}

/// Priority levels mirroring the core Todo priorities.
enum HomeTaskPriority { none, low, medium, high, urgent }

/// Data model for the three concentric progress rings.
@immutable
class ProgressRingsData {
  const ProgressRingsData({
    required this.tasksCompleted,
    required this.tasksTotal,
    required this.focusMinutes,
    required this.focusGoalMinutes,
    required this.habitsCompleted,
    required this.habitsTotal,
  });

  final int tasksCompleted;
  final int tasksTotal;
  final int focusMinutes;
  final int focusGoalMinutes;
  final int habitsCompleted;
  final int habitsTotal;

  /// Task ring progress as 0.0 - 1.0.
  double get taskProgress =>
      tasksTotal == 0 ? 0.0 : (tasksCompleted / tasksTotal).clamp(0.0, 1.0);

  /// Focus ring progress as 0.0 - 1.0.
  double get focusProgress => focusGoalMinutes == 0
      ? 0.0
      : (focusMinutes / focusGoalMinutes).clamp(0.0, 1.0);

  /// Habits ring progress as 0.0 - 1.0.
  double get habitProgress =>
      habitsTotal == 0 ? 0.0 : (habitsCompleted / habitsTotal).clamp(0.0, 1.0);

  /// Overall combined progress as 0.0 - 1.0.
  double get overallProgress {
    final sum = taskProgress + focusProgress + habitProgress;
    return (sum / 3.0).clamp(0.0, 1.0);
  }
}

/// Daily content (quote / tip) shown on the home screen.
@immutable
class DailyContent {
  const DailyContent({
    required this.id,
    required this.category,
    required this.content,
    required this.author,
    this.source,
    this.isSaved = false,
  });

  final String id;
  final String category;
  final String content;
  final String author;
  final String? source;
  final bool isSaved;

  DailyContent copyWith({bool? isSaved}) {
    return DailyContent(
      id: id,
      category: category,
      content: content,
      author: author,
      source: source,
      isSaved: isSaved ?? this.isSaved,
    );
  }
}

/// Streak tracking data.
@immutable
class StreakData {
  const StreakData({
    required this.currentStreak,
    required this.longestStreak,
    required this.lastActiveDate,
  });

  final int currentStreak;
  final int longestStreak;
  final DateTime lastActiveDate;
}
