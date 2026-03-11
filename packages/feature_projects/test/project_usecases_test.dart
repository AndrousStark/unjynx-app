import 'package:flutter_test/flutter_test.dart';
import 'package:unjynx_core/models/project.dart';
import 'package:unjynx_core/utils/result.dart';

import 'package:feature_projects/src/domain/entities/project_filter.dart';
import 'package:feature_projects/src/domain/repositories/project_repository.dart';
import 'package:feature_projects/src/domain/usecases/create_project.dart';
import 'package:feature_projects/src/domain/usecases/get_projects.dart';
import 'package:feature_projects/src/domain/usecases/update_project.dart';
import 'package:feature_projects/src/domain/usecases/archive_project.dart';

/// In-memory fake for testing use cases.
class FakeProjectRepository implements ProjectRepository {
  final List<Project> _projects = [];

  @override
  Future<Result<List<Project>>> getAll({ProjectFilter? filter}) async {
    var items = List<Project>.from(_projects);
    final query = filter?.searchQuery?.toLowerCase();
    if (query != null && query.isNotEmpty) {
      items = items.where((p) => p.name.toLowerCase().contains(query)).toList();
    }
    if (filter?.includeArchived != true) {
      items = items.where((p) => !p.isArchived).toList();
    }
    return Result.ok(items);
  }

  @override
  Future<Result<Project>> getById(String id) async {
    final found = _projects.where((p) => p.id == id);
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
      id: 'proj-${_projects.length + 1}',
      userId: 'user-1',
      name: name,
      description: description,
      color: color,
      icon: icon,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    _projects.add(project);
    return Result.ok(project);
  }

  @override
  Future<Result<Project>> update(Project project) async {
    final idx = _projects.indexWhere((p) => p.id == project.id);
    if (idx < 0) return Result.err('Not found');
    _projects[idx] = project;
    return Result.ok(project);
  }

  @override
  Future<Result<void>> archive(String id) async {
    final idx = _projects.indexWhere((p) => p.id == id);
    if (idx < 0) return Result.err('Not found');
    _projects[idx] = _projects[idx].copyWith(isArchived: true);
    return Result.ok(null);
  }

  @override
  Future<Result<void>> reorder(List<String> orderedIds) async {
    return Result.ok(null);
  }

  @override
  Future<Result<int>> taskCount(String projectId) async {
    return Result.ok(0);
  }
}

void main() {
  late FakeProjectRepository repository;

  setUp(() {
    repository = FakeProjectRepository();
  });

  group('CreateProject', () {
    late CreateProject createProject;

    setUp(() {
      createProject = CreateProject(repository);
    });

    test('creates a project with valid name', () async {
      final result = await createProject(name: 'Work');

      expect(result.isOk, isTrue);
      expect(result.unwrap().name, 'Work');
    });

    test('trims whitespace from name', () async {
      final result = await createProject(name: '  Personal  ');

      expect(result.unwrap().name, 'Personal');
    });

    test('rejects empty name', () async {
      final result = await createProject(name: '');

      expect(result.isErr, isTrue);
    });

    test('rejects whitespace-only name', () async {
      final result = await createProject(name: '   ');

      expect(result.isErr, isTrue);
    });

    test('passes color and icon', () async {
      final result = await createProject(
        name: 'Colored',
        color: '#FF0000',
        icon: 'star',
      );

      expect(result.unwrap().color, '#FF0000');
      expect(result.unwrap().icon, 'star');
    });

    test('passes description', () async {
      final result = await createProject(
        name: 'Described',
        description: 'A test project',
      );

      expect(result.unwrap().description, 'A test project');
    });
  });

  group('GetProjects', () {
    late GetProjects getProjects;
    late CreateProject createProject;

    setUp(() {
      getProjects = GetProjects(repository);
      createProject = CreateProject(repository);
    });

    test('returns empty list initially', () async {
      final result = await getProjects();

      expect(result.unwrap(), isEmpty);
    });

    test('returns all created projects', () async {
      await createProject(name: 'A');
      await createProject(name: 'B');

      final result = await getProjects();

      expect(result.unwrap(), hasLength(2));
    });

    test('filters by search query', () async {
      await createProject(name: 'Work Tasks');
      await createProject(name: 'Personal');

      final result = await getProjects(
        filter: const ProjectFilter(searchQuery: 'work'),
      );

      expect(result.unwrap(), hasLength(1));
      expect(result.unwrap().first.name, 'Work Tasks');
    });
  });

  group('UpdateProject', () {
    late UpdateProject updateProject;
    late CreateProject createProject;

    setUp(() {
      updateProject = UpdateProject(repository);
      createProject = CreateProject(repository);
    });

    test('updates a project', () async {
      final created = (await createProject(name: 'Old')).unwrap();
      final updated = created.copyWith(name: 'New');

      final result = await updateProject(updated);

      expect(result.unwrap().name, 'New');
    });

    test('rejects empty name on update', () async {
      final created = (await createProject(name: 'Valid')).unwrap();
      final invalid = created.copyWith(name: '');

      final result = await updateProject(invalid);

      expect(result.isErr, isTrue);
    });
  });

  group('ArchiveProject', () {
    late ArchiveProject archiveProject;
    late CreateProject createProject;

    setUp(() {
      archiveProject = ArchiveProject(repository);
      createProject = CreateProject(repository);
    });

    test('archives a project', () async {
      final created = (await createProject(name: 'ToArchive')).unwrap();

      final result = await archiveProject(created.id);

      expect(result.isOk, isTrue);
    });

    test('rejects empty project id', () async {
      final result = await archiveProject('');

      expect(result.isErr, isTrue);
    });
  });
}
