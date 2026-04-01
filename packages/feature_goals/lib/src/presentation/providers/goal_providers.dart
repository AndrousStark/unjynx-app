import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

import '../../domain/models/goal.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Goal tree
// ---------------------------------------------------------------------------

/// Full hierarchical goal tree (company → team → individual).
///
/// Returns a flat list of root-level goals, each with nested [children].
final goalTreeProvider = FutureProvider<List<Goal>>((ref) async {
  final api = _tryRead(ref, goalApiProvider);
  if (api == null) return const [];

  try {
    final response = await api.getGoalTree();
    if (response.success && response.data != null) {
      return List.unmodifiable(
        response.data!
            .map((e) => Goal.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
    }
  } on DioException {
    // Network error.
  } on ApiException {
    // API error.
  }

  return const [];
});

// ---------------------------------------------------------------------------
// Flat goal list (with optional filters)
// ---------------------------------------------------------------------------

/// Currently selected level filter.
class _GoalLevelFilterNotifier extends Notifier<GoalLevel?> {
  @override
  GoalLevel? build() => null;
  void set(GoalLevel? value) => state = value;
}

final goalLevelFilterProvider =
    NotifierProvider<_GoalLevelFilterNotifier, GoalLevel?>(
      _GoalLevelFilterNotifier.new,
    );

/// Flat list of goals filtered by level.
final goalsProvider = FutureProvider<List<Goal>>((ref) async {
  final level = ref.watch(goalLevelFilterProvider);
  final api = _tryRead(ref, goalApiProvider);
  if (api == null) return const [];

  try {
    final response = await api.getGoals(level: level?.name);
    if (response.success && response.data != null) {
      return List.unmodifiable(
        response.data!
            .map((e) => Goal.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
    }
  } on DioException {
    // Network error.
  } on ApiException {
    // API error.
  }

  return const [];
});

// ---------------------------------------------------------------------------
// Single goal detail
// ---------------------------------------------------------------------------

/// Get a single goal by ID (family provider).
final goalDetailProvider = FutureProvider.family<Goal?, String>((
  ref,
  goalId,
) async {
  final api = _tryRead(ref, goalApiProvider);
  if (api == null) return null;

  try {
    final response = await api.getGoal(goalId);
    if (response.success && response.data != null) {
      return Goal.fromJson(response.data!);
    }
  } on DioException {
    // Network error.
  } on ApiException {
    // API error.
  }

  return null;
});
