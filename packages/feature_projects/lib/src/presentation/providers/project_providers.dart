import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:unjynx_core/models/project.dart';

import '../../domain/entities/project_filter.dart';
import '../../domain/repositories/project_repository.dart';
import '../../domain/usecases/archive_project.dart';
import '../../domain/usecases/create_project.dart';
import '../../domain/usecases/get_projects.dart';
import '../../domain/usecases/reorder_projects.dart';
import '../../domain/usecases/update_project.dart';

/// Repository provider — must be overridden in ProviderScope.
final projectRepositoryProvider = Provider<ProjectRepository>(
  (ref) => throw StateError(
    'projectRepositoryProvider must be overridden. '
    'Call overrideProjectRepository() in app bootstrap.',
  ),
);

/// Override helper called from the app shell after DI is ready.
Override overrideProjectRepository(ProjectRepository repository) {
  return projectRepositoryProvider.overrideWithValue(repository);
}

// Use cases
final createProjectProvider = Provider(
  (ref) => CreateProject(ref.watch(projectRepositoryProvider)),
);

final getProjectsProvider = Provider(
  (ref) => GetProjects(ref.watch(projectRepositoryProvider)),
);

final updateProjectProvider = Provider(
  (ref) => UpdateProject(ref.watch(projectRepositoryProvider)),
);

final archiveProjectProvider = Provider(
  (ref) => ArchiveProject(ref.watch(projectRepositoryProvider)),
);

final reorderProjectsProvider = Provider(
  (ref) => ReorderProjects(ref.watch(projectRepositoryProvider)),
);

// Filter state
class _ProjectFilterNotifier extends Notifier<ProjectFilter> {
  @override
  ProjectFilter build() => const ProjectFilter();
  void set(ProjectFilter value) => state = value;
}

final projectFilterProvider =
    NotifierProvider<_ProjectFilterNotifier, ProjectFilter>(
  _ProjectFilterNotifier.new,
);

// Project list (async)
final projectListProvider = FutureProvider<List<Project>>((ref) async {
  final getProjects = ref.watch(getProjectsProvider);
  final filter = ref.watch(projectFilterProvider);
  final result = await getProjects(filter: filter);
  return result.unwrapOr([]);
});

// Single project by ID
final projectByIdProvider =
    FutureProvider.family<Project?, String>((ref, id) async {
  final repo = ref.watch(projectRepositoryProvider);
  final result = await repo.getById(id);
  return result.when(ok: (project) => project, err: (_, __) => null);
});

// Task count for a project
final projectTaskCountProvider =
    FutureProvider.family<int, String>((ref, projectId) async {
  final repo = ref.watch(projectRepositoryProvider);
  final result = await repo.taskCount(projectId);
  return result.unwrapOr(0);
});
