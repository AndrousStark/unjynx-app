import 'package:unjynx_core/models/project.dart';
import 'package:unjynx_core/utils/result.dart';

import '../repositories/project_repository.dart';

/// Use case: Create a new project.
class CreateProject {
  final ProjectRepository _repository;

  const CreateProject(this._repository);

  Future<Result<Project>> call({
    required String name,
    String? description,
    String color = '#6C5CE7',
    String icon = 'folder',
  }) {
    if (name.trim().isEmpty) {
      return Future.value(Result.err('Project name cannot be empty'));
    }

    return _repository.create(
      name: name.trim(),
      description: description?.trim(),
      color: color,
      icon: icon,
    );
  }
}
