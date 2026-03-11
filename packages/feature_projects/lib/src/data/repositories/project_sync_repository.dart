import 'dart:async';

import 'package:drift/drift.dart';
import 'package:service_api/service_api.dart';
import 'package:service_database/service_database.dart';
import 'package:unjynx_core/models/project.dart';
import 'package:unjynx_core/utils/result.dart';
import 'package:uuid/uuid.dart';

import '../../domain/entities/project_filter.dart';
import '../../domain/repositories/project_repository.dart';
import '../datasources/project_drift_datasource.dart';

/// Offline-first [ProjectRepository] that wraps [ProjectDriftDatasource]
/// (local) and [ProjectApiService] (remote).
///
/// Every read returns data from the local Drift database immediately.
/// Writes go to Drift first, then fire-and-forget to the API in the
/// background. If the API call fails (network down, server error, etc.),
/// the operation is silently ignored and the sync engine will reconcile
/// later.
///
/// When [_projectApi] is null, this behaves identically to
/// [ProjectDriftRepository] (pure local mode).
class ProjectSyncRepository implements ProjectRepository {
  ProjectSyncRepository(this._datasource, this._projectApi);

  final ProjectDriftDatasource _datasource;
  final ProjectApiService? _projectApi;
  static const _uuid = Uuid();

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  @override
  Future<Result<List<Project>>> getAll({ProjectFilter? filter}) async {
    try {
      final includeArchived = filter?.includeArchived ?? false;
      var projects = await _datasource.getAll(
        includeArchived: includeArchived,
      );

      // Apply search filter in memory (simple substring match).
      final query = filter?.searchQuery?.toLowerCase();
      if (query != null && query.isNotEmpty) {
        projects = projects
            .where((p) => p.name.toLowerCase().contains(query))
            .toList();
      }

      // Background: pull latest from API and upsert into Drift.
      _backgroundFetchAll();

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

  // ---------------------------------------------------------------------------
  // Writes
  // ---------------------------------------------------------------------------

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

      // Fire-and-forget push to API.
      _backgroundCreateProject(id, name, description, color, icon);

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

      // Fire-and-forget push to API.
      _backgroundUpdateProject(project);

      return Result.ok(updated!);
    } on Exception catch (e) {
      return Result.err('Failed to update project: $e');
    }
  }

  @override
  Future<Result<void>> archive(String id) async {
    try {
      await _datasource.archive(id);

      // Fire-and-forget archive on API (uses delete endpoint).
      _backgroundArchiveProject(id);

      return Result.ok(null);
    } on Exception catch (e) {
      return Result.err('Failed to archive project: $e');
    }
  }

  @override
  Future<Result<void>> reorder(List<String> orderedIds) async {
    // Reorder is local-only UX; not synced to server individually.
    try {
      await _datasource.reorder(orderedIds);
      return Result.ok(null);
    } on Exception catch (e) {
      return Result.err('Failed to reorder projects: $e');
    }
  }

  @override
  Future<Result<int>> taskCount(String projectId) async {
    // Task count is local-only (Drift count is authoritative).
    try {
      final count = await _datasource.taskCount(projectId);
      return Result.ok(count);
    } on Exception catch (e) {
      return Result.err('Failed to count tasks: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Background API operations (fire-and-forget)
  // ---------------------------------------------------------------------------

  void _backgroundFetchAll() {
    final api = _projectApi;
    if (api == null) return;

    unawaited(() async {
      try {
        final response = await api.getProjects();
        if (response.success && response.data != null) {
          final remoteProjects = response.data!
              .whereType<Map<String, dynamic>>()
              .toList();

          for (final json in remoteProjects) {
            final companion = _apiJsonToCompanion(json);
            final id = json['id'] as String;

            // Upsert: try insert, fall back to update on conflict.
            final existing = await _datasource.getById(id);
            if (existing == null) {
              await _datasource.insert(companion);
            } else {
              await _datasource.update(id, companion);
            }
          }
        }
      } on Exception catch (_) {
        // Silently ignore — sync engine will reconcile later.
      }
    }());
  }

  void _backgroundCreateProject(
    String id,
    String name,
    String? description,
    String color,
    String icon,
  ) {
    final api = _projectApi;
    if (api == null) return;

    unawaited(() async {
      try {
        await api.createProject({
          'id': id,
          'name': name,
          if (description != null) 'description': description,
          'color': color,
          'icon': icon,
        });
      } on Exception catch (_) {
        // Sync engine handles later.
      }
    }());
  }

  void _backgroundUpdateProject(Project project) {
    final api = _projectApi;
    if (api == null) return;

    unawaited(() async {
      try {
        await api.updateProject(project.id, {
          'name': project.name,
          if (project.description != null)
            'description': project.description,
          'color': project.color,
          'icon': project.icon,
          'isArchived': project.isArchived,
          'sortOrder': project.sortOrder,
        });
      } on Exception catch (_) {
        // Sync engine handles later.
      }
    }());
  }

  void _backgroundArchiveProject(String id) {
    final api = _projectApi;
    if (api == null) return;

    unawaited(() async {
      try {
        await api.deleteProject(id);
      } on Exception catch (_) {
        // Best-effort; sync engine reconciles later.
      }
    }());
  }

  // ---------------------------------------------------------------------------
  // API JSON -> Drift companion mapping
  // ---------------------------------------------------------------------------

  /// Convert a raw API JSON map into a [LocalProjectsCompanion] for upserting.
  ///
  /// API returns: `id`, `name`, `description`, `color`, `icon`,
  /// `isArchived`/`is_archived`, `sortOrder`/`sort_order`,
  /// `createdAt`/`created_at`, `updatedAt`/`updated_at`.
  LocalProjectsCompanion _apiJsonToCompanion(Map<String, dynamic> json) {
    return LocalProjectsCompanion(
      id: Value(json['id'] as String),
      name: Value(json['name'] as String),
      description: Value(json['description'] as String?),
      color: Value(
        (json['color'] as String?) ?? '#6C5CE7',
      ),
      icon: Value(
        (json['icon'] as String?) ?? 'folder',
      ),
      isArchived: Value(
        (json['isArchived'] ?? json['is_archived'] ?? false) as bool,
      ),
      sortOrder: Value(
        (json['sortOrder'] ?? json['sort_order'] ?? 0) as int,
      ),
      createdAt: Value(
        _parseDateTime(json['createdAt'] ?? json['created_at']),
      ),
      updatedAt: Value(
        _parseDateTime(json['updatedAt'] ?? json['updated_at']),
      ),
    );
  }

  /// Parse a datetime value that may be a String or null.
  DateTime _parseDateTime(dynamic value) {
    if (value is String) {
      return DateTime.parse(value);
    }
    return DateTime.now();
  }
}
