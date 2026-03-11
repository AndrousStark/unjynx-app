// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'todo_dto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_TodoDto _$TodoDtoFromJson(Map<String, dynamic> json) => _TodoDto(
  id: json['id'] as String,
  title: json['title'] as String,
  description: json['description'] as String? ?? '',
  status: json['status'] as String? ?? 'pending',
  priority: json['priority'] as String? ?? 'none',
  projectId: json['project_id'] as String?,
  dueDate: json['due_date'] as String?,
  completedAt: json['completed_at'] as String?,
  rrule: json['rrule'] as String?,
  sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
  createdAt: json['created_at'] as String,
  updatedAt: json['updated_at'] as String,
);

Map<String, dynamic> _$TodoDtoToJson(_TodoDto instance) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'description': instance.description,
  'status': instance.status,
  'priority': instance.priority,
  'project_id': instance.projectId,
  'due_date': instance.dueDate,
  'completed_at': instance.completedAt,
  'rrule': instance.rrule,
  'sort_order': instance.sortOrder,
  'created_at': instance.createdAt,
  'updated_at': instance.updatedAt,
};
