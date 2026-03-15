import 'package:drift/drift.dart';
import 'package:service_database/service_database.dart';
import 'package:unjynx_core/models/project.dart';
import 'package:unjynx_core/utils/result.dart';
import 'package:uuid/uuid.dart';

import '../../domain/entities/project_filter.dart';
import '../../domain/repositories/project_repository.dart';
import '../datasources/project_drift_datasource.dart';

/// Drift-backed implementation of [ProjectRepository].
class ProjectDriftRepository implements ProjectRepository {
  final ProjectDriftDatasource _datasource;
  static const _uuid = Uuid();

  const ProjectDriftRepository(this._datasource);

  @override
  Future<Result<List<Project>>> getAll({ProjectFilter? filter}) async {
    try {
      final includeArchived = filter?.includeArchived ?? false;
      var projects = await _datasource.getAll(
        includeArchived: includeArchived,
      );

      // Apply search filter in memory (simple substring match)
      final query = filter?.searchQuery?.toLowerCase();
      if (query != null && query.isNotEmpty) {
        projects = projects
            .where((p) => p.name.toLowerCase().contains(query))
            .toList();
      }

      return Result.ok(projects);
    } on Exception catch (e) {
      return Result.err('Failed to load projects: $e');
    }
  }

  @override
  Future<Result<Project>> getById(String id) async {
    try {
      final project = await _datasource.getById(id);
      if (project == null) {
        return Result.err('Project not found');
      }
      return Result.ok(project);
    } on Exception catch (e) {
      return Result.err('Failed to load project: $e');
    }
  }

  @override
  Future<Result<Project>> create({
    required String name,
    String? description,
    String color = '#6C5CE7',
    String icon = 'folder',
  }) async {
    try {
      final id = _uuid.v4();
      final now = DateTime.now();

      await _datasource.insert(
        LocalProjectsCompanion.insert(
          id: id,
          name: name,
          description: Value(description),
          color: Value(color),
          icon: Value(icon),
          createdAt: Value(now),
          updatedAt: Value(now),
        ),
      );

      final created = await _datasource.getById(id);
      return Result.ok(created!);
    } on Exception catch (e) {
      return Result.err('Failed to create project: $e');
    }
  }

  @override
  Future<Result<Project>> update(Project project) async {
    try {
      final now = DateTime.now();

      await _datasource.update(
        project.id,
        LocalProjectsCompanion(
          name: Value(project.name),
          description: Value(project.description),
          color: Value(project.color),
          icon: Value(project.icon),
          isArchived: Value(project.isArchived),
          sortOrder: Value(project.sortOrder),
          updatedAt: Value(now),
        ),
      );

      final updated = await _datasource.getById(project.id);
      return Result.ok(updated!);
    } on Exception catch (e) {
      return Result.err('Failed to update project: $e');
    }
  }

  @override
  Future<Result<void>> archive(String id) async {
    try {
      await _datasource.archive(id);
      return Result.ok(null);
    } on Exception catch (e) {
      return Result.err('Failed to archive project: $e');
    }
  }

  @override
  Future<Result<void>> reorder(List<String> orderedIds) async {
    try {
      await _datasource.reorder(orderedIds);
      return Result.ok(null);
    } on Exception catch (e) {
      return Result.err('Failed to reorder projects: $e');
    }
  }

  @override
  Future<Result<int>> taskCount(String projectId) async {
    try {
      final count = await _datasource.taskCount(projectId);
      return Result.ok(count);
    } on Exception catch (e) {
      return Result.err('Failed to count tasks: $e');
    }
  }
}
