import 'package:flutter/material.dart';

/// Accessibility utilities for WCAG 2.1 AA compliance.
///
/// Provides helpers for reduce-motion support, semantic labels,
/// and touch target enforcement.

/// Returns [Duration.zero] when the platform requests reduced motion,
/// otherwise returns [normal].
///
/// Checks both [MediaQueryData.disableAnimations] (system-level) and
/// can be paired with the app-level `reduceAnimationsProvider` in
/// feature_settings.
///
/// Usage:
/// ```dart
/// AnimatedContainer(
///   duration: accessibleDuration(context, const Duration(milliseconds: 300)),
///   ...
/// )
/// ```
Duration accessibleDuration(BuildContext context, Duration normal) {
  final mediaQuery = MediaQuery.maybeOf(context);
  if (mediaQuery != null && mediaQuery.disableAnimations) {
    return Duration.zero;
  }
  return normal;
}

/// Returns a curve appropriate for the current motion preference.
///
/// When reduced motion is active, returns [Curves.linear] for instant
/// transitions. Otherwise returns [normal].
Curve accessibleCurve(BuildContext context, Curve normal) {
  final mediaQuery = MediaQuery.maybeOf(context);
  if (mediaQuery != null && mediaQuery.disableAnimations) {
    return Curves.linear;
  }
  return normal;
}

/// Builds a semantic description for a task suitable for screen readers.
///
/// Produces a natural-language summary like:
/// "Buy milk, high priority, due tomorrow at 9 AM, in Groceries project"
///
/// Pass `null` for optional fields to omit them.
String taskSemanticLabel({
  required String title,
  String? priority,
  String? dueDescription,
  String? projectName,
  bool isCompleted = false,
}) {
  final parts = <String>[];

  if (isCompleted) {
    parts.add('Completed: $title');
  } else {
    parts.add(title);
  }

  if (priority != null && priority.isNotEmpty && priority != 'none') {
    parts.add('$priority priority');
  }

  if (dueDescription != null && dueDescription.isNotEmpty) {
    parts.add('due $dueDescription');
  }

  if (projectName != null && projectName.isNotEmpty) {
    parts.add('in $projectName project');
  }

  return parts.join(', ');
}

/// Builds a semantic description for progress rings.
///
/// Produces: "Task completion: 75%. Focus: 30 of 60 minutes. Habits: 2 of 5."
String progressRingsSemanticLabel({
  required int percentage,
  required int tasksCompleted,
  required int tasksTotal,
  required int focusMinutes,
  required int focusGoalMinutes,
  required int habitsCompleted,
  required int habitsTotal,
}) {
  return 'Overall progress: $percentage percent. '
      'Tasks: $tasksCompleted of $tasksTotal completed. '
      'Focus: $focusMinutes of $focusGoalMinutes minutes. '
      'Habits: $habitsCompleted of $habitsTotal completed.';
}

/// Minimum touch target size per WCAG 2.1 AA / Material 3 guidelines.
///
/// Use this to enforce 48x48dp minimum for interactive elements.
const double kMinTouchTarget = 48;

/// Box constraints that enforce the minimum 48x48dp touch target.
const BoxConstraints kMinTouchTargetConstraints = BoxConstraints(
  minWidth: kMinTouchTarget,
  minHeight: kMinTouchTarget,
);
