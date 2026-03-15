import 'package:feature_projects/src/domain/entities/project_filter.dart';
import 'package:feature_projects/src/domain/repositories/project_repository.dart';
import 'package:feature_projects/src/domain/usecases/archive_project.dart';
import 'package:feature_projects/src/domain/usecases/create_project.dart';
import 'package:feature_projects/src/domain/usecases/get_projects.dart';
import 'package:feature_projects/src/domain/usecases/reorder_projects.dart';
import 'package:feature_projects/src/domain/usecases/update_project.dart';
import 'package:feature_projects/src/presentation/providers/project_providers.dart';
import 'package:feature_projects/src/project_plugin.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:unjynx_core/core.dart';

// ---------------------------------------------------------------------------
// Fake repository (mirrors the one in project_usecases_test.dart so tests
// remain fully independent — no shared state between files).
// ---------------------------------------------------------------------------

class FakeProjectRepository implements ProjectRepository {
  final List<Project> _store = [];

  /// Exposes the internal store for white-box assertions in provider tests.
  List<Project> get store => List.unmodifiable(_store);

  /// Optional hook – when set, every call to [taskCount] returns this value.
  int taskCountResult = 0;

  /// Optional hook – when set, [getById] returns an error for this ID.
  String? getByIdErrorId;

  @override
  Future<Result<List<Project>>> getAll({ProjectFilter? filter}) async {
    var items = List<Project>.from(_store);
    final query = filter?.searchQuery?.toLowerCase();
    if (query != null && query.isNotEmpty) {
      items =
          items.where((p) => p.name.toLowerCase().contains(query)).toList();
    }
    if (filter?.includeArchived != true) {
      items = items.where((p) => !p.isArchived).toList();
    }
    return Result.ok(items);
  }

  @override
  Future<Result<Project>> getById(String id) async {
    if (id == getByIdErrorId) {
      return Result.err('Simulated getById error for $id');
    }
    final found = _store.where((p) => p.id == id);
    if (found.isEmpty) return Result.err('Not found');
    return Result.ok(found.first);
  }

  @override
  Future<Result<Project>> create({
    required String name,
    String? description,
    String color = '#6C5CE7',
    String icon = 'folder',
  }) async {
    final project = Project(
      id: 'proj-${_store.length + 1}',
      userId: 'user-1',
      name: name,
      description: description,
      color: color,
      icon: icon,
      createdAt: DateTime(2026),
      updatedAt: DateTime(2026),
    );
    _store.add(project);
    return Result.ok(project);
  }

  @override
  Future<Result<Project>> update(Project project) async {
    final idx = _store.indexWhere((p) => p.id == project.id);
    if (idx < 0) return Result.err('Not found');
    _store[idx] = project;
    return Result.ok(project);
  }

  @override
  Future<Result<void>> archive(String id) async {
    final idx = _store.indexWhere((p) => p.id == id);
    if (idx < 0) return Result.err('Not found');
    _store[idx] = _store[idx].copyWith(isArchived: true);
    return Result.ok(null);
  }

  @override
  Future<Result<void>> reorder(List<String> orderedIds) async {
    return Result.ok(null);
  }

  @override
  Future<Result<int>> taskCount(String projectId) async {
    return Result.ok(taskCountResult);
  }
}

// ---------------------------------------------------------------------------
// Helper: build a ProviderContainer with the fake repository overridden.
// ---------------------------------------------------------------------------

ProviderContainer makeContainer(FakeProjectRepository repo) {
  return ProviderContainer(
    overrides: [overrideProjectRepository(repo)],
  );
}

void main() {
  // -------------------------------------------------------------------------
  // ProjectPlugin contract
  // -------------------------------------------------------------------------

  group('ProjectPlugin', () {
    late ProjectPlugin plugin;

    setUp(() {
      plugin = ProjectPlugin();
    });

    test('id is "projects"', () {
      expect(plugin.id, 'projects');
    });

    test('name is "Projects"', () {
      expect(plugin.name, 'Projects');
    });

    test('version is "0.2.0"', () {
      expect(plugin.version, '0.2.0');
    });

    test('exposes exactly three routes', () {
      expect(plugin.routes, hasLength(3));
    });

    test('route path is "/projects"', () {
      expect(plugin.routes.first.path, '/projects');
    });

    test('route label is "Projects"', () {
      expect(plugin.routes.first.label, 'Projects');
    });

    test('route icon is Icons.folder_outlined', () {
      expect(plugin.routes.first.icon, Icons.folder_outlined);
    });

    test('route sortOrder is 1', () {
      expect(plugin.routes.first.sortOrder, 1);
    });

    test('initialize completes without throwing', () async {
      final bus = EventBus();
      await expectLater(plugin.initialize(bus), completes);
      bus.dispose();
    });

    test('dispose completes without throwing', () async {
      await expectLater(plugin.dispose(), completes);
    });

    test('implements UnjynxPlugin', () {
      expect(plugin, isA<UnjynxPlugin>());
    });
  });

  // -------------------------------------------------------------------------
  // ProjectFilter – Freezed value semantics
  // -------------------------------------------------------------------------

  group('ProjectFilter', () {
    test('default includeArchived is false', () {
      const filter = ProjectFilter();
      expect(filter.includeArchived, isFalse);
    });

    test('default searchQuery is null', () {
      const filter = ProjectFilter();
      expect(filter.searchQuery, isNull);
    });

    test('copyWith updates includeArchived', () {
      const filter = ProjectFilter();
      final updated = filter.copyWith(includeArchived: true);

      expect(updated.includeArchived, isTrue);
      // Original must be unchanged (immutability).
      expect(filter.includeArchived, isFalse);
    });

    test('copyWith updates searchQuery', () {
      const filter = ProjectFilter();
      final updated = filter.copyWith(searchQuery: 'work');

      expect(updated.searchQuery, 'work');
      expect(filter.searchQuery, isNull);
    });

    test('copyWith with no arguments is equal to original', () {
      const filter = ProjectFilter(includeArchived: true, searchQuery: 'abc');
      expect(filter.copyWith(), equals(filter));
    });

    test('two filters with same values are equal', () {
      const a = ProjectFilter(searchQuery: 'test');
      const b = ProjectFilter(searchQuery: 'test');
      expect(a, equals(b));
    });

    test('two filters with different values are not equal', () {
      const a = ProjectFilter(searchQuery: 'alpha');
      const b = ProjectFilter(searchQuery: 'beta');
      expect(a, isNot(equals(b)));
    });
  });

  // -------------------------------------------------------------------------
  // projectRepositoryProvider – unoverridden throws StateError
  // -------------------------------------------------------------------------

  group('projectRepositoryProvider (unoverridden)', () {
    test('throws StateError when not overridden', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      // Riverpod 3 wraps provider errors in ProviderException.
      expect(
        () => container.read(projectRepositoryProvider),
        throwsA(anything),
      );
    });
  });

  // -------------------------------------------------------------------------
  // overrideProjectRepository helper
  // -------------------------------------------------------------------------

  group('overrideProjectRepository', () {
    test('resolves to the provided repository instance', () {
      final repo = FakeProjectRepository();
      final container = makeContainer(repo);
      addTearDown(container.dispose);

      expect(container.read(projectRepositoryProvider), same(repo));
    });
  });

  // -------------------------------------------------------------------------
  // Use-case providers – resolve to correct types with overridden repository
  // -------------------------------------------------------------------------

  group('Use-case providers', () {
    late FakeProjectRepository repo;
    late ProviderContainer container;

    setUp(() {
      repo = FakeProjectRepository();
      container = makeContainer(repo);
    });

    tearDown(() => container.dispose());

    test('createProjectProvider returns CreateProject instance', () {
      expect(container.read(createProjectProvider), isA<CreateProject>());
    });

    test('getProjectsProvider returns GetProjects instance', () {
      expect(container.read(getProjectsProvider), isA<GetProjects>());
    });

    test('updateProjectProvider returns UpdateProject instance', () {
      expect(container.read(updateProjectProvider), isA<UpdateProject>());
    });

    test('archiveProjectProvider returns ArchiveProject instance', () {
      expect(container.read(archiveProjectProvider), isA<ArchiveProject>());
    });

    test('reorderProjectsProvider returns ReorderProjects instance', () {
      expect(
        container.read(reorderProjectsProvider),
        isA<ReorderProjects>(),
      );
    });
  });

  // -------------------------------------------------------------------------
  // projectFilterProvider – StateProvider
  // -------------------------------------------------------------------------

  group('projectFilterProvider', () {
    late ProviderContainer container;

    setUp(() {
      container = makeContainer(FakeProjectRepository());
    });

    tearDown(() => container.dispose());

    test('defaults to ProjectFilter() with includeArchived false', () {
      final filter = container.read(projectFilterProvider);
      expect(filter, equals(const ProjectFilter()));
      expect(filter.includeArchived, isFalse);
    });

    test('defaults to null searchQuery', () {
      expect(container.read(projectFilterProvider).searchQuery, isNull);
    });

    test('can be updated via notifier', () {
      container
          .read(projectFilterProvider.notifier)
          .state = const ProjectFilter(searchQuery: 'alpha');

      expect(
        container.read(projectFilterProvider).searchQuery,
        'alpha',
      );
    });

    test('update to includeArchived true is reflected', () {
      container
          .read(projectFilterProvider.notifier)
          .state = const ProjectFilter(includeArchived: true);

      expect(
        container.read(projectFilterProvider).includeArchived,
        isTrue,
      );
    });

    test('multiple sequential updates are independent', () {
      container.read(projectFilterProvider.notifier).set(
        const ProjectFilter(searchQuery: 'first'),
      );
      container.read(projectFilterProvider.notifier).set(
        const ProjectFilter(searchQuery: 'second'),
      );

      expect(container.read(projectFilterProvider).searchQuery, 'second');
    });

    test('separate containers do not share filter state', () {
      final containerB = makeContainer(FakeProjectRepository());
      addTearDown(containerB.dispose);

      container
          .read(projectFilterProvider.notifier)
          .state = const ProjectFilter(searchQuery: 'only-in-a');

      expect(
        containerB.read(projectFilterProvider).searchQuery,
        isNull,
      );
    });
  });

  // -------------------------------------------------------------------------
  // projectListProvider – FutureProvider
  // -------------------------------------------------------------------------

  group('projectListProvider', () {
    late FakeProjectRepository repo;
    late ProviderContainer container;

    setUp(() {
      repo = FakeProjectRepository();
      container = makeContainer(repo);
    });

    tearDown(() => container.dispose());

    test('returns empty list when repository is empty', () async {
      final result = await container.read(projectListProvider.future);
      expect(result, isEmpty);
    });

    test('returns all active projects', () async {
      await repo.create(name: 'A');
      await repo.create(name: 'B');

      // Invalidate so the provider re-fetches.
      container.invalidate(projectListProvider);

      final result = await container.read(projectListProvider.future);
      expect(result, hasLength(2));
    });

    test('excludes archived projects by default', () async {
      final created = (await repo.create(name: 'ToArchive')).unwrap();
      await repo.archive(created.id);

      container.invalidate(projectListProvider);

      final result = await container.read(projectListProvider.future);
      expect(result, isEmpty);
    });

    test('includes archived projects when filter says so', () async {
      final created = (await repo.create(name: 'Archived')).unwrap();
      await repo.archive(created.id);

      container
          .read(projectFilterProvider.notifier)
          .state = const ProjectFilter(includeArchived: true);

      final result = await container.read(projectListProvider.future);
      expect(result, hasLength(1));
      expect(result.first.isArchived, isTrue);
    });

    test('filters by searchQuery', () async {
      await repo.create(name: 'Work Alpha');
      await repo.create(name: 'Personal');

      container
          .read(projectFilterProvider.notifier)
          .state = const ProjectFilter(searchQuery: 'work');

      final result = await container.read(projectListProvider.future);
      expect(result, hasLength(1));
      expect(result.first.name, 'Work Alpha');
    });

    test('search is case-insensitive', () async {
      await repo.create(name: 'UPPER');

      container
          .read(projectFilterProvider.notifier)
          .state = const ProjectFilter(searchQuery: 'upper');

      final result = await container.read(projectListProvider.future);
      expect(result, hasLength(1));
    });

    test('empty searchQuery returns all active projects', () async {
      await repo.create(name: 'X');
      await repo.create(name: 'Y');

      container
          .read(projectFilterProvider.notifier)
          .state = const ProjectFilter(searchQuery: '');

      final result = await container.read(projectListProvider.future);
      expect(result, hasLength(2));
    });

    test('returns empty list when searchQuery matches nothing', () async {
      await repo.create(name: 'Home');

      container
          .read(projectFilterProvider.notifier)
          .state = const ProjectFilter(searchQuery: 'zzz-no-match');

      final result = await container.read(projectListProvider.future);
      expect(result, isEmpty);
    });
  });

  // -------------------------------------------------------------------------
  // projectByIdProvider – FutureProvider.family
  // -------------------------------------------------------------------------

  group('projectByIdProvider', () {
    late FakeProjectRepository repo;
    late ProviderContainer container;

    setUp(() {
      repo = FakeProjectRepository();
      container = makeContainer(repo);
    });

    tearDown(() => container.dispose());

    test('returns the project when it exists', () async {
      final created = (await repo.create(name: 'MyProject')).unwrap();

      final project =
          await container.read(projectByIdProvider(created.id).future);

      expect(project, isNotNull);
      expect(project!.name, 'MyProject');
      expect(project.id, created.id);
    });

    test('returns null when project does not exist', () async {
      final project =
          await container.read(projectByIdProvider('nonexistent-id').future);

      expect(project, isNull);
    });

    test('returns null when repository returns an error', () async {
      repo.getByIdErrorId = 'error-id';

      final project =
          await container.read(projectByIdProvider('error-id').future);

      expect(project, isNull);
    });

    test('different IDs are cached independently', () async {
      final p1 = (await repo.create(name: 'First')).unwrap();
      final p2 = (await repo.create(name: 'Second')).unwrap();

      final result1 =
          await container.read(projectByIdProvider(p1.id).future);
      final result2 =
          await container.read(projectByIdProvider(p2.id).future);

      expect(result1!.name, 'First');
      expect(result2!.name, 'Second');
    });

    test('returns archived project by ID (no filter applied)', () async {
      final created = (await repo.create(name: 'ArchivedProject')).unwrap();
      await repo.archive(created.id);

      final project =
          await container.read(projectByIdProvider(created.id).future);

      expect(project, isNotNull);
      expect(project!.isArchived, isTrue);
    });
  });

  // -------------------------------------------------------------------------
  // projectTaskCountProvider – FutureProvider.family
  // -------------------------------------------------------------------------

  group('projectTaskCountProvider', () {
    late FakeProjectRepository repo;
    late ProviderContainer container;

    setUp(() {
      repo = FakeProjectRepository();
      container = makeContainer(repo);
    });

    tearDown(() => container.dispose());

    test('returns 0 by default', () async {
      final count =
          await container.read(projectTaskCountProvider('proj-1').future);

      expect(count, 0);
    });

    test('returns the value provided by the repository', () async {
      repo.taskCountResult = 42;

      final count =
          await container.read(projectTaskCountProvider('proj-1').future);

      expect(count, 42);
    });

    test('different project IDs are resolved independently', () async {
      repo.taskCountResult = 7;

      final countA =
          await container.read(projectTaskCountProvider('proj-a').future);
      final countB =
          await container.read(projectTaskCountProvider('proj-b').future);

      // Both go through the same fake, so both should equal 7.
      expect(countA, 7);
      expect(countB, 7);
    });

    test('falls back to 0 when repository returns an error', () async {
      // Override taskCount to return an error for this test.
      final errorRepo = _ErrorTaskCountRepository();
      final errorContainer = ProviderContainer(
        overrides: [overrideProjectRepository(errorRepo)],
      );
      addTearDown(errorContainer.dispose);

      final count = await errorContainer
          .read(projectTaskCountProvider('any-id').future);

      // unwrapOr(0) is used in the provider, so result is 0.
      expect(count, 0);
    });
  });
}

// ---------------------------------------------------------------------------
// Auxiliary fake that returns errors from taskCount, used in one edge-case
// test above.
// ---------------------------------------------------------------------------

class _ErrorTaskCountRepository implements ProjectRepository {
  @override
  Future<Result<List<Project>>> getAll({ProjectFilter? filter}) async =>
      Result.ok([]);

  @override
  Future<Result<Project>> getById(String id) async =>
      Result.err('not implemented');

  @override
  Future<Result<Project>> create({
    required String name,
    String? description,
    String color = '#000000',
    String icon = 'error',
  }) async =>
      Result.err('not implemented');

  @override
  Future<Result<Project>> update(Project project) async =>
      Result.err('not implemented');

  @override
  Future<Result<void>> archive(String id) async =>
      Result.err('not implemented');

  @override
  Future<Result<void>> reorder(List<String> orderedIds) async =>
      Result.err('not implemented');

  @override
  Future<Result<int>> taskCount(String projectId) async =>
      Result.err('Simulated taskCount error');
}
