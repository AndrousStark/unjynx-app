import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

import '../../domain/models/sprint.dart';

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
// Selected project for sprint context
// ---------------------------------------------------------------------------

/// The project ID whose sprints are currently visible.
///
/// Set when the user navigates to sprints from a specific project.
class _SelectedProjectIdNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? value) => state = value;
}

final sprintProjectIdProvider =
    NotifierProvider<_SelectedProjectIdNotifier, String?>(
      _SelectedProjectIdNotifier.new,
    );

// ---------------------------------------------------------------------------
// Sprints list
// ---------------------------------------------------------------------------

/// All sprints for the selected project, fetched from the API.
final sprintsProvider = FutureProvider<List<Sprint>>((ref) async {
  final projectId = ref.watch(sprintProjectIdProvider);
  if (projectId == null) return const [];

  final api = _tryRead(ref, sprintApiProvider);
  if (api == null) return const [];

  try {
    final response = await api.getSprints(projectId: projectId);
    if (response.success && response.data != null) {
      return List.unmodifiable(
        response.data!
            .map((e) => Sprint.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
    }
  } on DioException {
    // Network error — return empty.
  } on ApiException {
    // API error — return empty.
  }

  return const [];
});

/// Currently active sprint for the selected project.
final activeSprintProvider = FutureProvider<Sprint?>((ref) async {
  final projectId = ref.watch(sprintProjectIdProvider);
  if (projectId == null) return null;

  final api = _tryRead(ref, sprintApiProvider);
  if (api == null) return null;

  try {
    final response = await api.getActiveSprint(projectId: projectId);
    if (response.success && response.data != null) {
      return Sprint.fromJson(response.data!);
    }
  } on DioException {
    // Network error.
  } on ApiException {
    // API error.
  }

  return null;
});

// ---------------------------------------------------------------------------
// Burndown
// ---------------------------------------------------------------------------

/// Burndown chart data for a specific sprint.
final burndownProvider = FutureProvider.family<List<BurndownEntry>, String>((
  ref,
  sprintId,
) async {
  final api = _tryRead(ref, sprintApiProvider);
  if (api == null) return const [];

  try {
    final response = await api.getBurndown(sprintId);
    if (response.success && response.data != null) {
      return List.unmodifiable(
        response.data!
            .map((e) => BurndownEntry.fromJson(e as Map<String, dynamic>))
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
// Velocity
// ---------------------------------------------------------------------------

/// Velocity chart data for a project.
class VelocityData {
  const VelocityData({this.sprints = const [], this.averageVelocity = 0});

  final List<VelocityEntry> sprints;
  final double averageVelocity;
}

final velocityProvider = FutureProvider<VelocityData>((ref) async {
  final projectId = ref.watch(sprintProjectIdProvider);
  if (projectId == null) return const VelocityData();

  final api = _tryRead(ref, sprintApiProvider);
  if (api == null) return const VelocityData();

  try {
    final response = await api.getVelocity(projectId: projectId);
    if (response.success && response.data != null) {
      final d = response.data!;
      final sprintList =
          (d['sprints'] as List<dynamic>?)
              ?.map((e) => VelocityEntry.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [];
      return VelocityData(
        sprints: List.unmodifiable(sprintList),
        averageVelocity: (d['averageVelocity'] as num?)?.toDouble() ?? 0,
      );
    }
  } on DioException {
    // Network error.
  } on ApiException {
    // API error.
  }

  return const VelocityData();
});
