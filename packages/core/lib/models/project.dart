import 'package:freezed_annotation/freezed_annotation.dart';

part 'project.freezed.dart';
part 'project.g.dart';

/// Immutable project entity.
@freezed
abstract class Project with _$Project {
  const factory Project({
    required String id,
    String? orgId,
    required String userId,
    required String name,
    String? key,
    String? description,
    @Default('kanban') String projectType,
    @Default('#6C5CE7') String color,
    @Default('folder') String icon,
    String? leadId,
    String? workflowId,
    @Default(0) int issueCounter,
    @Default(false) bool isArchived,
    @Default(0) int sortOrder,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Project;

  factory Project.fromJson(Map<String, dynamic> json) =>
      _$ProjectFromJson(json);
}
