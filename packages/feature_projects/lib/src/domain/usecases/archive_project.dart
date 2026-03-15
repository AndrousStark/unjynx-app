import 'package:unjynx_core/utils/result.dart';

import '../repositories/project_repository.dart';

/// Use case: Archive a project (soft delete).
class ArchiveProject {
  final ProjectRepository _repository;

  const ArchiveProject(this._repository);

  Future<Result<void>> call(String projectId) {
    if (projectId.isEmpty) {
      return Future.value(Result.err('Project ID cannot be empty'));
    }

    return _repository.archive(projectId);
  }
}
