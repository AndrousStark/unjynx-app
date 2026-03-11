import 'dart:async';

import 'package:flutter/services.dart';

/// Centralized haptic feedback helper for UNJYNX.
///
/// Provides semantically named haptic patterns so the entire app
/// uses consistent tactile feedback for the same interaction types.
///
/// All methods are static fire-and-forget calls. On platforms that
/// don't support a particular feedback type the call is silently
/// ignored by the Flutter engine.
///
/// ```dart
/// UnjynxHaptics.taskComplete();
/// UnjynxHaptics.achievementUnlock();
/// ```
abstract final class UnjynxHaptics {
  // ── Primitive feedback types ──────────────────────────────────────

  /// Subtle tick for picker scrolls, option changes.
  static void selectionClick() => HapticFeedback.selectionClick();

  /// Gentle tap for lightweight confirmations.
  static void lightImpact() => HapticFeedback.lightImpact();

  /// Standard tap for button presses, card interactions.
  static void mediumImpact() => HapticFeedback.mediumImpact();

  /// Strong thud for significant actions.
  static void heavyImpact() => HapticFeedback.heavyImpact();

  // ── Semantic feedback patterns ────────────────────────────────────

  /// Positive confirmation (task created, save succeeded).
  static void success() => HapticFeedback.lightImpact();

  /// Error or destructive action feedback.
  static void error() => HapticFeedback.mediumImpact();

  /// Satisfying haptic when a task is marked complete.
  static void taskComplete() => HapticFeedback.lightImpact();

  /// Double-pulse celebration for achievement unlock / streak milestone.
  static Future<void> achievementUnlock() async {
    unawaited(HapticFeedback.heavyImpact());
    await Future<void>.delayed(const Duration(milliseconds: 100));
    unawaited(HapticFeedback.heavyImpact());
  }

  /// Dramatic haptic when Ghost Mode is activated.
  static void ghostModeActivate() => HapticFeedback.heavyImpact();

  /// Feedback when a drag operation begins (Kanban reorder, list sort).
  static void dragStart() => HapticFeedback.mediumImpact();

  /// Feedback when a dragged item is dropped into place.
  static void dragDrop() => HapticFeedback.lightImpact();

  /// Click when a toggle / switch changes state.
  static void toggleChange() => HapticFeedback.selectionClick();

  /// Tick when a swipe crosses a threshold (e.g. swipe-to-delete).
  static void swipeThreshold() => HapticFeedback.selectionClick();

  /// Tick when pull-to-refresh reaches its activation point.
  static void pullToRefresh() => HapticFeedback.selectionClick();
}
