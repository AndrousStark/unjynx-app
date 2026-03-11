// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'todo.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Todo _$TodoFromJson(Map<String, dynamic> json) => _Todo(
  id: json['id'] as String,
  title: json['title'] as String,
  description: json['description'] as String? ?? '',
  status:
      $enumDecodeNullable(_$TodoStatusEnumMap, json['status']) ??
      TodoStatus.pending,
  priority:
      $enumDecodeNullable(_$TodoPriorityEnumMap, json['priority']) ??
      TodoPriority.none,
  projectId: json['projectId'] as String?,
  dueDate: json['dueDate'] == null
      ? null
      : DateTime.parse(json['dueDate'] as String),
  completedAt: json['completedAt'] == null
      ? null
      : DateTime.parse(json['completedAt'] as String),
  rrule: json['rrule'] as String?,
  sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$TodoToJson(_Todo instance) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'description': instance.description,
  'status': _$TodoStatusEnumMap[instance.status]!,
  'priority': _$TodoPriorityEnumMap[instance.priority]!,
  'projectId': instance.projectId,
  'dueDate': instance.dueDate?.toIso8601String(),
  'completedAt': instance.completedAt?.toIso8601String(),
  'rrule': instance.rrule,
  'sortOrder': instance.sortOrder,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
};

const _$TodoStatusEnumMap = {
  TodoStatus.pending: 'pending',
  TodoStatus.inProgress: 'inProgress',
  TodoStatus.completed: 'completed',
  TodoStatus.cancelled: 'cancelled',
};

const _$TodoPriorityEnumMap = {
  TodoPriority.none: 'none',
  TodoPriority.low: 'low',
  TodoPriority.medium: 'medium',
  TodoPriority.high: 'high',
  TodoPriority.urgent: 'urgent',
};
