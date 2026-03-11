import 'package:unjynx_core/models/project.dart';
import 'package:unjynx_core/utils/result.dart';

import '../entities/project_filter.dart';
import '../repositories/project_repository.dart';

/// Use case: Get all projects with optional filter.
class GetProjects {
  final ProjectRepository _repository;

  const GetProjects(this._repository);

  Future<Result<List<Project>>> call({ProjectFilter? filter}) {
    return _repository.getAll(filter: filter);
  }
}
