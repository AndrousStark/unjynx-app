import 'package:unjynx_core/utils/result.dart';
import 'package:unjynx_core/models/project.dart';

import '../entities/project_filter.dart';

/// Abstract repository for project operations.
abstract class ProjectRepository {
  /// Get all projects matching the filter.
  Future<Result<List<Project>>> getAll({ProjectFilter? filter});

  /// Get a single project by ID.
  Future<Result<Project>> getById(String id);

  /// Create a new project.
  Future<Result<Project>> create({
    required String name,
    String? description,
    String color,
    String icon,
  });

  /// Update an existing project.
  Future<Result<Project>> update(Project project);

  /// Archive a project (soft delete).
  Future<Result<void>> archive(String id);

  /// Reorder projects.
  Future<Result<void>> reorder(List<String> orderedIds);

  /// Get the count of active tasks in a project.
  Future<Result<int>> taskCount(String projectId);
}
