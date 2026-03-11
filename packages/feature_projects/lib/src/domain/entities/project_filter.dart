import 'package:freezed_annotation/freezed_annotation.dart';

part 'project_filter.freezed.dart';

/// Filter criteria for project queries.
@freezed
abstract class ProjectFilter with _$ProjectFilter {
  const factory ProjectFilter({
    @Default(false) bool includeArchived,
    String? searchQuery,
  }) = _ProjectFilter;
}
