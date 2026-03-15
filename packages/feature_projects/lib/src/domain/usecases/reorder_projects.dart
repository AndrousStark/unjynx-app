import 'package:unjynx_core/utils/result.dart';

import '../repositories/project_repository.dart';

/// Use case: Reorder projects by providing ordered IDs.
class ReorderProjects {
  final ProjectRepository _repository;

  const ReorderProjects(this._repository);

  Future<Result<void>> call(List<String> orderedIds) {
    if (orderedIds.isEmpty) {
      return Future.value(Result.err('Ordered IDs list cannot be empty'));
    }

    return _repository.reorder(orderedIds);
  }
}
