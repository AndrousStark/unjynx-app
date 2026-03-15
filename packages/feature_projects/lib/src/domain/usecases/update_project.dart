import 'package:unjynx_core/models/project.dart';
import 'package:unjynx_core/utils/result.dart';

import '../repositories/project_repository.dart';

/// Use case: Update an existing project.
class UpdateProject {
  final ProjectRepository _repository;

  const UpdateProject(this._repository);

  Future<Result<Project>> call(Project project) {
    if (project.name.trim().isEmpty) {
      return Future.value(Result.err('Project name cannot be empty'));
    }

    return _repository.update(project);
  }
}
